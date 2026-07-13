require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const { body, param, validationResult } = require('express-validator')
const sqlite3 = require('sqlite3')
const Database = sqlite3.Database
const path = require('path')
const fs = require('fs')
const winston = require('winston')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// ─── Config ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'fraud_hub.db')
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175').split(',')
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fraudhub.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123'

// ─── Logger ───────────────────────────────────────────────────
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple())
  ),
  transports: [
    new winston.transports.Console(),
    ...(NODE_ENV === 'production'
      ? [new winston.transports.File({ filename: 'error.log', level: 'error' })]
      : []),
  ],
})

// ─── Express App ──────────────────────────────────────────────
const app = express()

// Security headers
app.use(helmet())

// HTTP request logging
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'))

// Body parsing
app.use(express.json({ limit: '10kb' }))

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || CORS_ORIGINS.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
}))

// Rate limiting
app.use(rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
}))

// ─── Database ─────────────────────────────────────────────────
const db = new Database(DB_PATH)
db.run('PRAGMA journal_mode = WAL')
db.run('PRAGMA foreign_keys = ON')

function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  db.exec(schema, (err) => {
    if (err) {
      logger.error('Database initialization failed:', err.message)
    } else {
      logger.info('Database initialized successfully')
    }
  })
}

initDb()

// ─── Helpers ──────────────────────────────────────────────────
function toCamel(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    date: row.date,
    redFlags: row.red_flags ? JSON.parse(row.red_flags) : undefined,
    example: row.example,
    icon: row.icon,
    channel: row.channel,
    sender: row.sender,
    message: row.message,
    isScam: row.is_scam ? true : false,
    explanation: row.explanation,
    // Adventure scenario fields
    act: row.act,
    scene: row.scene,
    choices: row.choices ? JSON.parse(row.choices) : undefined,
    correctIndex: row.correct_index,
  }
}

function handleValidation(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }
  next()
}

const VALID_CATEGORIES = ['Fake APK', 'Phishing Link', 'Social Engineering']

// ─── Auth Middleware ───────────────────────────────────────────
function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}

// ─── Seed Default Admin ────────────────────────────────────────
function seedAdmin() {
  db.get('SELECT id FROM admin_users WHERE email = ?', [ADMIN_EMAIL], (err, row) => {
    if (err || row) return
    const id = `admin-${Date.now()}`
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10)
    const now = new Date().toISOString()
    db.run(
      'INSERT INTO admin_users (id, email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, ADMIN_EMAIL, hash, 'Super Admin', 'super_admin', now],
      (err) => {
        if (err) {
          logger.error('Failed to seed admin user:', err.message)
        } else {
          logger.info(`Default admin seeded: ${ADMIN_EMAIL}`)
        }
      }
    )
  })
}

seedAdmin()

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() })
})

// ─── Auth Routes ──────────────────────────────────────────────

// POST /api/auth/login — login and get JWT
app.post('/api/auth/login',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
  (req, res) => {
    const { email, password } = req.body
    db.get('SELECT * FROM admin_users WHERE email = ?', [email], (err, user) => {
      if (err) {
        logger.error('Login query error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      )
      logger.info(`User logged in: ${email}`)
      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      })
    })
  }
)

// GET /api/auth/me — get current user profile
app.get('/api/auth/me', authenticate, (req, res) => {
  db.get('SELECT id, email, name, role, created_at FROM admin_users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      logger.error('GET /api/auth/me error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  })
})

// GET /api/auth/admins — list all admins (super_admin only)
app.get('/api/auth/admins', authenticate, authorize('super_admin'), (req, res) => {
  db.all('SELECT id, email, name, role, created_at FROM admin_users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      logger.error('GET /api/auth/admins error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows)
  })
})

// POST /api/auth/admins — create admin (super_admin only)
app.post('/api/auth/admins',
  authenticate,
  authorize('super_admin'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').isIn(['super_admin', 'admin']).withMessage('Role must be super_admin or admin'),
  handleValidation,
  (req, res) => {
    const { email, password, name, role } = req.body
    db.get('SELECT id FROM admin_users WHERE email = ?', [email], (err, existing) => {
      if (err) {
        logger.error('POST /api/auth/admins check error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      if (existing) {
        return res.status(409).json({ error: 'Email already in use' })
      }
      const id = `admin-${Date.now()}`
      const hash = bcrypt.hashSync(password, 10)
      const now = new Date().toISOString()
      db.run(
        'INSERT INTO admin_users (id, email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, email, hash, name, role, now],
        function (err) {
          if (err) {
            logger.error('POST /api/auth/admins error:', err.message)
            return res.status(500).json({ error: 'Internal server error' })
          }
          logger.info(`Admin created: ${email} (${role})`)
          res.status(201).json({ id, email, name, role, created_at: now })
        }
      )
    })
  }
)

// DELETE /api/auth/admins/:id — delete admin (super_admin only)
app.delete('/api/auth/admins/:id', authenticate, authorize('super_admin'), (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' })
  }
  db.run('DELETE FROM admin_users WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      logger.error('DELETE /api/auth/admins/:id error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Admin not found' })
    logger.info(`Admin deleted: ${req.params.id}`)
    res.json({ success: true })
  })
})

// ─── Scam Alerts CRUD ─────────────────────────────────────────

app.get('/api/alerts', (req, res) => {
  db.all('SELECT * FROM scam_alerts ORDER BY date DESC', [], (err, rows) => {
    if (err) {
      logger.error('GET /api/alerts error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows.map(toCamel))
  })
})

app.get('/api/alerts/:id', (req, res) => {
  db.get('SELECT * FROM scam_alerts WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      logger.error('GET /api/alerts/:id error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!row) return res.status(404).json({ error: 'Alert not found' })
    res.json(toCamel(row))
  })
})

app.post('/api/alerts',
  authenticate,
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
  body('category').isIn(VALID_CATEGORIES).withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  handleValidation,
  (req, res) => {
    const { title, category, description, date } = req.body
    const id = `alert-${Date.now()}`
    const alertDate = date || new Date().toISOString().split('T')[0]
    db.run(
      'INSERT INTO scam_alerts (id, title, category, description, date) VALUES (?, ?, ?, ?, ?)',
      [id, title, category, description, alertDate],
      function (err) {
        if (err) {
          logger.error('POST /api/alerts error:', err.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        logger.info(`Alert created: ${id}`)
        res.status(201).json({ id, title, category, description, date: alertDate })
      }
    )
  }
)

app.put('/api/alerts/:id',
  authenticate,
  body('title').optional().trim().notEmpty().isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
  body('category').optional().isIn(VALID_CATEGORIES).withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('description').optional().trim().notEmpty().isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  handleValidation,
  (req, res) => {
    const { title, category, description, date } = req.body
    const fields = []
    const values = []
    if (title !== undefined) { fields.push('title = ?'); values.push(title) }
    if (category !== undefined) { fields.push('category = ?'); values.push(category) }
    if (description !== undefined) { fields.push('description = ?'); values.push(description) }
    if (date !== undefined) { fields.push('date = ?'); values.push(date) }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' })
    values.push(req.params.id)
    db.run(
      `UPDATE scam_alerts SET ${fields.join(', ')} WHERE id = ?`,
      values,
      function (err) {
        if (err) {
          logger.error('PUT /api/alerts/:id error:', err.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        if (this.changes === 0) return res.status(404).json({ error: 'Alert not found' })
        db.get('SELECT * FROM scam_alerts WHERE id = ?', [req.params.id], (err2, row) => {
          if (err2) {
            logger.error('PUT /api/alerts/:id fetch error:', err2.message)
            return res.status(500).json({ error: 'Internal server error' })
          }
          logger.info(`Alert updated: ${req.params.id}`)
          res.json(toCamel(row))
        })
      }
    )
  }
)

app.delete('/api/alerts/:id', authenticate, (req, res) => {
  db.run('DELETE FROM scam_alerts WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      logger.error('DELETE /api/alerts/:id error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Alert not found' })
    logger.info(`Alert deleted: ${req.params.id}`)
    res.json({ success: true })
  })
})

// ─── Scam Patterns (read-only) ───────────────────────────────

app.get('/api/patterns', (req, res) => {
  db.all('SELECT * FROM scam_patterns', [], (err, rows) => {
    if (err) {
      logger.error('GET /api/patterns error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows.map(toCamel))
  })
})

app.get('/api/patterns/:id', (req, res) => {
  db.get('SELECT * FROM scam_patterns WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      logger.error('GET /api/patterns/:id error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!row) return res.status(404).json({ error: 'Pattern not found' })
    res.json(toCamel(row))
  })
})

// ─── Game Scenarios (read-only) ──────────────────────────────

app.get('/api/scenarios', (req, res) => {
  db.all('SELECT * FROM game_scenarios', [], (err, rows) => {
    if (err) {
      logger.error('GET /api/scenarios error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows.map(toCamel))
  })
})

app.get('/api/scenarios/:id', (req, res) => {
  db.get('SELECT * FROM game_scenarios WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      logger.error('GET /api/scenarios/:id error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!row) return res.status(404).json({ error: 'Scenario not found' })
    res.json(toCamel(row))
  })
})

// ─── Adventure Scenarios (read-only) ──────────────────────────

app.get('/api/adventure/scenarios', (req, res) => {
  db.all('SELECT * FROM adventure_scenarios ORDER BY act, scene', [], (err, rows) => {
    if (err) {
      logger.error('GET /api/adventure/scenarios error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows.map(toCamel))
  })
})

app.get('/api/adventure/scenarios/:id', (req, res) => {
  db.get('SELECT * FROM adventure_scenarios WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      logger.error('GET /api/adventure/scenarios/:id error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!row) return res.status(404).json({ error: 'Adventure scenario not found' })
    res.json(toCamel(row))
  })
})

// ─── Hub Stats (static) ──────────────────────────────────────
app.get('/api/stats', (req, res) => {
  res.json([
    { label: 'Scam Types Documented', value: '47+' },
    { label: 'Red Flags Identified', value: '120+' },
    { label: 'Awareness Articles', value: '35' },
  ])
})

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, _next) => {
  logger.error('Unhandled error:', { message: err.message, stack: err.stack })
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Start Server ─────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} [${NODE_ENV}]`)
})

// ─── Graceful Shutdown ────────────────────────────────────────
function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`)
  server.close(() => {
    db.close(() => {
      logger.info('Database connection closed')
      process.exit(0)
    })
  })
  // Force exit after 5s if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 5000)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
