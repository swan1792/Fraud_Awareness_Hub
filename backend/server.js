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
// nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage
// CSRF middleware is not needed — this is a JWT-based API using Authorization headers,
// not cookie-based auth. CORS policy already restricts cross-origin access.
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
    if (!origin) return callback(null, true)
    // Allow exact matches, localhost, and *.vercel.app / *.railway.app
    const allowed = CORS_ORIGINS.some(o => origin === o)
      || /localhost/.test(origin)
      || /\.vercel\.app$/.test(origin)
      || /\.railway\.app$/.test(origin)
    callback(null, allowed)
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
    titleMy: row.title_my,
    category: row.category,
    description: row.description,
    descriptionMy: row.description_my,
    date: row.date,
    status: row.status,
    redFlags: row.red_flags ? JSON.parse(row.red_flags) : undefined,
    example: row.example,
    icon: row.icon,
    channel: row.channel,
    sender: row.sender,
    message: row.message,
    isScam: row.is_scam ? true : false,
    explanation: row.explanation,
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

// ─── Simulator Routes ─────────────────────────────────────────
const simulatorRouter = require('./routes/simulator')
app.use('/api/simulator', simulatorRouter)

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
  const query = req.query.all === 'true'
    ? 'SELECT * FROM scam_alerts ORDER BY date DESC'
    : "SELECT * FROM scam_alerts WHERE status = 'published' ORDER BY date DESC"
  db.all(query, [], (err, rows) => {
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
    const { title, title_my, category, description, description_my, date, status } = req.body
    const id = `alert-${Date.now()}`
    const alertDate = date || new Date().toISOString().split('T')[0]
    const alertStatus = status || 'published'
    db.run(
      'INSERT INTO scam_alerts (id, title, title_my, category, description, description_my, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, title_my || null, category, description, description_my || null, alertDate, alertStatus],
      function (err) {
        if (err) {
          logger.error('POST /api/alerts error:', err.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        logger.info(`Alert created: ${id}`)
        res.status(201).json({ id, title, titleMy: title_my || null, category, description, descriptionMy: description_my || null, date: alertDate, status: alertStatus })
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
    const { title, title_my, category, description, description_my, date } = req.body
    const fields = []
    const values = []
    if (title !== undefined) { fields.push('title = ?'); values.push(title) }
    if (title_my !== undefined) { fields.push('title_my = ?'); values.push(title_my || null) }
    if (category !== undefined) { fields.push('category = ?'); values.push(category) }
    if (description !== undefined) { fields.push('description = ?'); values.push(description) }
    if (description_my !== undefined) { fields.push('description_my = ?'); values.push(description_my || null) }
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

// PUT /api/alerts/:id/status — toggle publish/draft status
app.put('/api/alerts/:id/status', authenticate, (req, res) => {
  const { status } = req.body
  if (!['draft', 'published'].includes(status)) {
    return res.status(400).json({ error: 'Status must be draft or published' })
  }
  db.run('UPDATE scam_alerts SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
    if (err) {
      logger.error('PUT /api/alerts/:id/status error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Alert not found' })
    logger.info(`Alert ${req.params.id} status changed to ${status}`)
    res.json({ id: req.params.id, status })
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

// ─── Game Stages (admin CRUD) ─────────────────────────────────

// Helper to convert stage row to camelCase with nested target_lines and interventions
function stageToCamel(row, lines = [], interventions = []) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    difficulty: row.difficulty,
    scammerLine: row.scammer_line,
    correctIntervention: row.correct_intervention,
    whyText: row.why_text,
    doText: row.do_text,
    dontText: row.dont_text,
    assets: row.assets ? JSON.parse(row.assets) : null,
    isPublished: row.is_published ? true : false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    targetLines: lines.map(l => ({
      id: l.id,
      lineText: l.line_text,
      lineOrder: l.line_order,
    })),
    interventions: interventions.map(i => ({
      id: i.id,
      interventionText: i.intervention_text,
      isCorrect: i.is_correct ? true : false,
      displayOrder: i.display_order,
    })),
  }
}

// GET /api/stages — list published stages (public)
app.get('/api/stages', (req, res) => {
  db.all('SELECT * FROM game_stages WHERE is_published = 1 ORDER BY difficulty, title', [], (err, rows) => {
    if (err) {
      logger.error('GET /api/stages error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!rows || rows.length === 0) return res.json([])
    // Fetch target lines and interventions for all stages
    const stageIds = rows.map(r => r.id)
    const placeholders = stageIds.map(() => '?').join(',')
    db.all(`SELECT * FROM target_lines WHERE stage_id IN (${placeholders}) ORDER BY line_order`, stageIds, (err2, allLines) => {
      if (err2) {
        logger.error('GET /api/stages lines error:', err2.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      // Fetch interventions
      db.all(`SELECT * FROM stage_interventions WHERE stage_id IN (${placeholders}) ORDER BY display_order`, stageIds, (err3, allInterventions) => {
        if (err3) {
          logger.error('GET /api/stages interventions error:', err3.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        // Group lines and interventions by stage_id
        const linesByStage = {}
        for (const line of allLines) {
          if (!linesByStage[line.stage_id]) linesByStage[line.stage_id] = []
          linesByStage[line.stage_id].push(line)
        }
        const interventionsByStage = {}
        for (const intervention of allInterventions) {
          if (!interventionsByStage[intervention.stage_id]) interventionsByStage[intervention.stage_id] = []
          interventionsByStage[intervention.stage_id].push(intervention)
        }
        const stages = rows.map(row => stageToCamel(row, linesByStage[row.id] || [], interventionsByStage[row.id] || []))
        res.json(stages)
      })
    })
  })
})

// GET /api/stages/all — list all stages (admin)
app.get('/api/stages/all', authenticate, (req, res) => {
  db.all('SELECT * FROM game_stages ORDER BY difficulty, title', [], (err, rows) => {
    if (err) {
      logger.error('GET /api/stages/all error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!rows || rows.length === 0) return res.json([])
    // Fetch target lines and interventions for all stages
    const stageIds = rows.map(r => r.id)
    const placeholders = stageIds.map(() => '?').join(',')
    db.all(`SELECT * FROM target_lines WHERE stage_id IN (${placeholders}) ORDER BY line_order`, stageIds, (err2, allLines) => {
      if (err2) {
        logger.error('GET /api/stages/all lines error:', err2.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      // Fetch interventions
      db.all(`SELECT * FROM stage_interventions WHERE stage_id IN (${placeholders}) ORDER BY display_order`, stageIds, (err3, allInterventions) => {
        if (err3) {
          logger.error('GET /api/stages/all interventions error:', err3.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        // Group lines and interventions by stage_id
        const linesByStage = {}
        for (const line of allLines) {
          if (!linesByStage[line.stage_id]) linesByStage[line.stage_id] = []
          linesByStage[line.stage_id].push(line)
        }
        const interventionsByStage = {}
        for (const intervention of allInterventions) {
          if (!interventionsByStage[intervention.stage_id]) interventionsByStage[intervention.stage_id] = []
          interventionsByStage[intervention.stage_id].push(intervention)
        }
        const stages = rows.map(row => stageToCamel(row, linesByStage[row.id] || [], interventionsByStage[row.id] || []))
        res.json(stages)
      })
    })
  })
})

// GET /api/stages/:id — get stage with target_lines (public)
app.get('/api/stages/:id', (req, res) => {
  db.get('SELECT * FROM game_stages WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      logger.error('GET /api/stages/:id error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!row) return res.status(404).json({ error: 'Stage not found' })
    // Fetch target lines
    db.all('SELECT * FROM target_lines WHERE stage_id = ? ORDER BY line_order', [row.id], (err2, lines) => {
      if (err2) {
        logger.error('GET /api/stages/:id lines error:', err2.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      // Fetch interventions
      db.all('SELECT * FROM stage_interventions WHERE stage_id = ? ORDER BY display_order', [row.id], (err3, interventions) => {
        if (err3) {
          logger.error('GET /api/stages/:id interventions error:', err3.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        res.json(stageToCamel(row, lines, interventions))
      })
    })
  })
})

// POST /api/stages — create stage (admin)
app.post('/api/stages',
  authenticate,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('category').isIn(VALID_CATEGORIES).withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('scammerLine').trim().notEmpty().withMessage('Scammer line is required'),
  body('correctIntervention').trim().notEmpty().withMessage('Correct intervention is required'),
  body('whyText').trim().notEmpty().withMessage('Why text is required'),
  body('doText').trim().notEmpty().withMessage('Do text is required'),
  body('dontText').trim().notEmpty().withMessage('Don\'t text is required'),
  handleValidation,
  (req, res) => {
    const { title, category, description, difficulty, scammerLine, correctIntervention, whyText, doText, dontText, assets, targetLines, interventions } = req.body
    const id = `stage-${Date.now()}`
    const now = new Date().toISOString()
    db.run(
      'INSERT INTO game_stages (id, title, category, description, difficulty, scammer_line, correct_intervention, why_text, do_text, dont_text, assets, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
      [id, title, category, description || null, difficulty || 1, scammerLine, correctIntervention, whyText, doText, dontText, assets ? JSON.stringify(assets) : null, now, now],
      function (err) {
        if (err) {
          logger.error('POST /api/stages error:', err.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        // Insert target lines if provided
        if (targetLines && Array.isArray(targetLines)) {
          targetLines.forEach((line, index) => {
            const lineId = `tl-${id}-${index + 1}`
            db.run(
              'INSERT INTO target_lines (id, stage_id, line_text, line_order) VALUES (?, ?, ?, ?)',
              [lineId, id, line.lineText, line.lineOrder || index + 1]
            )
          })
        }
        // Insert interventions if provided
        if (interventions && Array.isArray(interventions)) {
          interventions.forEach((intervention, index) => {
            const intId = `int-${id}-${index + 1}`
            db.run(
              'INSERT INTO stage_interventions (id, stage_id, intervention_text, is_correct, display_order) VALUES (?, ?, ?, ?, ?)',
              [intId, id, intervention.interventionText, intervention.isCorrect ? 1 : 0, intervention.displayOrder || index + 1]
            )
          })
        }
        logger.info(`Stage created: ${id}`)
        res.status(201).json({ id, title, category, createdAt: now })
      }
    )
  }
)

// PUT /api/stages/:id — update stage (admin)
app.put('/api/stages/:id',
  authenticate,
  body('title').optional().trim().notEmpty(),
  body('category').optional().isIn(VALID_CATEGORIES),
  body('scammerLine').optional().trim().notEmpty(),
  body('correctIntervention').optional().trim().notEmpty(),
  body('whyText').optional().trim().notEmpty(),
  body('doText').optional().trim().notEmpty(),
  body('dontText').optional().trim().notEmpty(),
  handleValidation,
  (req, res) => {
    const { title, category, description, difficulty, scammerLine, correctIntervention, whyText, doText, dontText, assets, targetLines, interventions } = req.body
    const stageId = req.params.id

    // Check stage exists first
    db.get('SELECT id FROM game_stages WHERE id = ?', [stageId], (err, stage) => {
      if (err) {
        logger.error('PUT /api/stages/:id check error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      if (!stage) return res.status(404).json({ error: 'Stage not found' })

      // Update stage fields
      const fields = []
      const values = []
      if (title !== undefined) { fields.push('title = ?'); values.push(title) }
      if (category !== undefined) { fields.push('category = ?'); values.push(category) }
      if (description !== undefined) { fields.push('description = ?'); values.push(description) }
      if (difficulty !== undefined) { fields.push('difficulty = ?'); values.push(difficulty) }
      if (scammerLine !== undefined) { fields.push('scammer_line = ?'); values.push(scammerLine) }
      if (correctIntervention !== undefined) { fields.push('correct_intervention = ?'); values.push(correctIntervention) }
      if (whyText !== undefined) { fields.push('why_text = ?'); values.push(whyText) }
      if (doText !== undefined) { fields.push('do_text = ?'); values.push(doText) }
      if (dontText !== undefined) { fields.push('dont_text = ?'); values.push(dontText) }
      if (assets !== undefined) { fields.push('assets = ?'); values.push(JSON.stringify(assets)) }

      if (fields.length === 0 && targetLines === undefined && interventions === undefined) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      // Run stage update if there are fields to update
      const updateStage = (callback) => {
        if (fields.length === 0) return callback()
        fields.push('updated_at = ?')
        values.push(new Date().toISOString())
        values.push(stageId)
        db.run(
          `UPDATE game_stages SET ${fields.join(', ')} WHERE id = ?`,
          values,
          function (err) {
            if (err) {
              logger.error('PUT /api/stages/:id update error:', err.message)
              return res.status(500).json({ error: 'Internal server error' })
            }
            callback()
          }
        )
      }

      // Replace target lines if provided
      const updateTargetLines = (callback) => {
        if (targetLines === undefined || !Array.isArray(targetLines)) return callback()
        // Delete existing target lines
        db.run('DELETE FROM target_lines WHERE stage_id = ?', [stageId], (err) => {
          if (err) {
            logger.error('PUT /api/stages/:id delete lines error:', err.message)
            return res.status(500).json({ error: 'Internal server error' })
          }
          // Insert new target lines
          if (targetLines.length === 0) return callback()
          let inserted = 0
          targetLines.forEach((line, index) => {
            const lineId = `tl-${stageId}-${index + 1}`
            db.run(
              'INSERT INTO target_lines (id, stage_id, line_text, line_order) VALUES (?, ?, ?, ?)',
              [lineId, stageId, line.lineText, line.lineOrder || index + 1],
              function () {
                inserted++
                if (inserted === targetLines.length) callback()
              }
            )
          })
        })
      }

      // Replace interventions if provided
      const updateInterventions = (callback) => {
        if (interventions === undefined || !Array.isArray(interventions)) return callback()
        // Delete existing interventions
        db.run('DELETE FROM stage_interventions WHERE stage_id = ?', [stageId], (err) => {
          if (err) {
            logger.error('PUT /api/stages/:id delete interventions error:', err.message)
            return res.status(500).json({ error: 'Internal server error' })
          }
          // Insert new interventions
          if (interventions.length === 0) return callback()
          let inserted = 0
          interventions.forEach((intervention, index) => {
            const intId = `int-${stageId}-${index + 1}`
            db.run(
              'INSERT INTO stage_interventions (id, stage_id, intervention_text, is_correct, display_order) VALUES (?, ?, ?, ?, ?)',
              [intId, stageId, intervention.interventionText, intervention.isCorrect ? 1 : 0, intervention.displayOrder || index + 1],
              function () {
                inserted++
                if (inserted === interventions.length) callback()
              }
            )
          })
        })
      }

      // Execute updates in sequence
      updateStage(() => {
        updateTargetLines(() => {
          updateInterventions(() => {
            logger.info(`Stage updated: ${stageId}`)
            res.json({ success: true })
          })
        })
      })
    })
  }
)

// DELETE /api/stages/:id — delete stage (admin)
app.delete('/api/stages/:id', authenticate, (req, res) => {
  db.run('DELETE FROM game_stages WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      logger.error('DELETE /api/stages/:id error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Stage not found' })
    logger.info(`Stage deleted: ${req.params.id}`)
    res.json({ success: true })
  })
})

// PATCH /api/stages/:id/publish — toggle publish state (admin)
app.patch('/api/stages/:id/publish', authenticate, (req, res) => {
  db.get('SELECT is_published FROM game_stages WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      logger.error('PATCH /api/stages/:id/publish error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!row) return res.status(404).json({ error: 'Stage not found' })
    const newState = row.is_published ? 0 : 1
    db.run('UPDATE game_stages SET is_published = ?, updated_at = ? WHERE id = ?',
      [newState, new Date().toISOString(), req.params.id],
      function (err2) {
        if (err2) {
          logger.error('PATCH /api/stages/:id/publish update error:', err2.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        logger.info(`Stage ${req.params.id} publish state: ${newState}`)
        res.json({ isPublished: newState ? true : false })
      }
    )
  })
})

// POST /api/stages/:id/lines — add target line (admin)
app.post('/api/stages/:id/lines',
  authenticate,
  body('lineText').trim().notEmpty().withMessage('Line text is required'),
  handleValidation,
  (req, res) => {
    const { lineText, lineOrder } = req.body
    // Check stage exists
    db.get('SELECT id FROM game_stages WHERE id = ?', [req.params.id], (err, stage) => {
      if (err) {
        logger.error('POST /api/stages/:id/lines check error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      if (!stage) return res.status(404).json({ error: 'Stage not found' })
      // Get max order if not provided
      const getOrder = lineOrder
        ? Promise.resolve(lineOrder)
        : new Promise((resolve) => {
            db.get('SELECT MAX(line_order) as maxOrder FROM target_lines WHERE stage_id = ?', [req.params.id], (err2, row) => {
              resolve((row?.maxOrder || 0) + 1)
            })
          })
      getOrder.then(order => {
        const id = `tl-${req.params.id}-${Date.now()}`
        db.run(
          'INSERT INTO target_lines (id, stage_id, line_text, line_order) VALUES (?, ?, ?, ?)',
          [id, req.params.id, lineText, order],
          function (err3) {
            if (err3) {
              logger.error('POST /api/stages/:id/lines insert error:', err3.message)
              return res.status(500).json({ error: 'Internal server error' })
            }
            logger.info(`Target line created: ${id}`)
            res.status(201).json({ id, lineText, lineOrder: order })
          }
        )
      })
    })
  }
)

// PUT /api/stages/:id/lines/:lineId — update target line (admin)
app.put('/api/stages/:id/lines/:lineId',
  authenticate,
  body('lineText').trim().notEmpty().withMessage('Line text is required'),
  handleValidation,
  (req, res) => {
    const { lineText, lineOrder } = req.body
    const fields = ['line_text = ?']
    const values = [lineText]
    if (lineOrder !== undefined) { fields.push('line_order = ?'); values.push(lineOrder) }
    values.push(req.params.lineId)
    db.run(
      `UPDATE target_lines SET ${fields.join(', ')} WHERE id = ? AND stage_id = ?`,
      [...values.slice(0, -1), req.params.lineId, req.params.id],
      function (err) {
        if (err) {
          logger.error('PUT /api/stages/:id/lines/:lineId error:', err.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        if (this.changes === 0) return res.status(404).json({ error: 'Line not found' })
        logger.info(`Target line updated: ${req.params.lineId}`)
        res.json({ success: true })
      }
    )
  }
)

// DELETE /api/stages/:id/lines/:lineId — delete target line (admin)
app.delete('/api/stages/:id/lines/:lineId', authenticate, (req, res) => {
  db.run('DELETE FROM target_lines WHERE id = ? AND stage_id = ?', [req.params.lineId, req.params.id], function (err) {
    if (err) {
      logger.error('DELETE /api/stages/:id/lines/:lineId error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Line not found' })
    logger.info(`Target line deleted: ${req.params.lineId}`)
    res.json({ success: true })
  })
})

// ─── Stage Interventions (admin CRUD) ───────────────────────

// GET /api/stages/:id/interventions — get interventions for a stage (public)
app.get('/api/stages/:id/interventions', (req, res) => {
  db.all('SELECT * FROM stage_interventions WHERE stage_id = ? ORDER BY display_order', [req.params.id], (err, rows) => {
    if (err) {
      logger.error('GET /api/stages/:id/interventions error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows.map(r => ({
      id: r.id,
      interventionText: r.intervention_text,
      isCorrect: r.is_correct ? true : false,
      displayOrder: r.display_order,
    })))
  })
})

// POST /api/stages/:id/interventions — add intervention (admin)
app.post('/api/stages/:id/interventions',
  authenticate,
  body('interventionText').trim().notEmpty().withMessage('Intervention text is required'),
  handleValidation,
  (req, res) => {
    const { interventionText, isCorrect, displayOrder } = req.body
    // Check stage exists
    db.get('SELECT id FROM game_stages WHERE id = ?', [req.params.id], (err, stage) => {
      if (err) {
        logger.error('POST /api/stages/:id/interventions check error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      if (!stage) return res.status(404).json({ error: 'Stage not found' })
      // Get max order if not provided
      const getOrder = displayOrder !== undefined
        ? Promise.resolve(displayOrder)
        : new Promise((resolve) => {
            db.get('SELECT MAX(display_order) as maxOrder FROM stage_interventions WHERE stage_id = ?', [req.params.id], (err2, row) => {
              resolve((row?.maxOrder || 0) + 1)
            })
          })
      getOrder.then(order => {
        // If marking as correct, unmark any existing correct ones
        if (isCorrect) {
          db.run('UPDATE stage_interventions SET is_correct = 0 WHERE stage_id = ?', [req.params.id])
        }
        const id = `int-${req.params.id}-${Date.now()}`
        db.run(
          'INSERT INTO stage_interventions (id, stage_id, intervention_text, is_correct, display_order) VALUES (?, ?, ?, ?, ?)',
          [id, req.params.id, interventionText, isCorrect ? 1 : 0, order],
          function (err3) {
            if (err3) {
              logger.error('POST /api/stages/:id/interventions insert error:', err3.message)
              return res.status(500).json({ error: 'Internal server error' })
            }
            logger.info(`Intervention created: ${id}`)
            res.status(201).json({ id, interventionText, isCorrect: isCorrect ? true : false, displayOrder: order })
          }
        )
      })
    })
  }
)

// PUT /api/stages/:id/interventions/:interventionId — update intervention (admin)
app.put('/api/stages/:id/interventions/:interventionId',
  authenticate,
  body('interventionText').trim().notEmpty().withMessage('Intervention text is required'),
  handleValidation,
  (req, res) => {
    const { interventionText, isCorrect, displayOrder } = req.body
    // If marking as correct, unmark any existing correct ones
    if (isCorrect) {
      db.run('UPDATE stage_interventions SET is_correct = 0 WHERE stage_id = ? AND id != ?', [req.params.id, req.params.interventionId])
    }
    const fields = ['intervention_text = ?']
    const values = [interventionText]
    if (isCorrect !== undefined) { fields.push('is_correct = ?'); values.push(isCorrect ? 1 : 0) }
    if (displayOrder !== undefined) { fields.push('display_order = ?'); values.push(displayOrder) }
    values.push(req.params.interventionId)
    db.run(
      `UPDATE stage_interventions SET ${fields.join(', ')} WHERE id = ? AND stage_id = ?`,
      [...values.slice(0, -1), req.params.interventionId, req.params.id],
      function (err) {
        if (err) {
          logger.error('PUT /api/stages/:id/interventions/:interventionId error:', err.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        if (this.changes === 0) return res.status(404).json({ error: 'Intervention not found' })
        logger.info(`Intervention updated: ${req.params.interventionId}`)
        res.json({ success: true })
      }
    )
  }
)

// DELETE /api/stages/:id/interventions/:interventionId — delete intervention (admin)
app.delete('/api/stages/:id/interventions/:interventionId', authenticate, (req, res) => {
  db.run('DELETE FROM stage_interventions WHERE id = ? AND stage_id = ?', [req.params.interventionId, req.params.id], function (err) {
    if (err) {
      logger.error('DELETE /api/stages/:id/interventions/:interventionId error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Intervention not found' })
    logger.info(`Intervention deleted: ${req.params.interventionId}`)
    res.json({ success: true })
  })
})

// ─── Fraud City: World Maps ───────────────────────────────────

// GET /api/worlds — list all world maps
app.get('/api/worlds', (req, res) => {
  db.all('SELECT * FROM world_maps ORDER BY name', [], (err, rows) => {
    if (err) {
      logger.error('GET /api/worlds error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      displayName: r.display_name,
      description: r.description,
      width: r.width,
      height: r.height,
      tileSize: r.tile_size,
      bgColor: r.bg_color,
      ambientLight: r.ambient_light,
      musicTrack: r.music_track,
    })))
  })
})

// GET /api/worlds/:id — get single world map
app.get('/api/worlds/:id', (req, res) => {
  db.get('SELECT * FROM world_maps WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      logger.error('GET /api/worlds/:id error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!row) return res.status(404).json({ error: 'World not found' })
    res.json({
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      width: row.width,
      height: row.height,
      tileSize: row.tile_size,
      bgColor: row.bg_color,
      ambientLight: row.ambient_light,
      musicTrack: row.music_track,
    })
  })
})

// GET /api/worlds/:id/objects — get all objects in a world
app.get('/api/worlds/:id/objects', (req, res) => {
  db.all('SELECT * FROM world_objects WHERE map_id = ? ORDER BY y, x', [req.params.id], (err, rows) => {
    if (err) {
      logger.error('GET /api/worlds/:id/objects error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows.map(r => ({
      id: r.id,
      mapId: r.map_id,
      objectType: r.object_type,
      name: r.name,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      solid: r.solid ? true : false,
      interactive: r.interactive ? true : false,
      interactionType: r.interaction_type,
      data: r.data ? JSON.parse(r.data) : null,
      sprite: r.sprite,
    })))
  })
})

// GET /api/worlds/:id/npcs — get all NPCs in a world
app.get('/api/worlds/:id/npcs', (req, res) => {
  db.all('SELECT * FROM world_npcs WHERE map_id = ? AND is_visible = 1', [req.params.id], (err, rows) => {
    if (err) {
      logger.error('GET /api/worlds/:id/npcs error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      npcType: r.npc_type,
      mapId: r.map_id,
      x: r.x,
      y: r.y,
      sprite: r.sprite,
      patrolX1: r.patrol_x1,
      patrolY1: r.patrol_y1,
      patrolX2: r.patrol_x2,
      patrolY2: r.patrol_y2,
      dialogueId: r.dialogue_id,
      trustLevel: r.trust_level,
    })))
  })
})

// ─── Fraud City: NPC Dialogues ───────────────────────────────

// GET /api/npcs/:id/dialogue — get available dialogue for an NPC
app.get('/api/npcs/:id/dialogue', (req, res) => {
  const npcId = req.params.id
  // Get the first available dialogue for this NPC
  db.get(
    'SELECT * FROM dialogues WHERE npc_id = ? AND is_available = 1 ORDER BY created_at LIMIT 1',
    [npcId],
    (err, row) => {
      if (err) {
        logger.error('GET /api/npcs/:id/dialogue error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      if (!row) return res.status(404).json({ error: 'No dialogue available' })
      res.json({
        id: row.id,
        npcId: row.npc_id,
        chapter: row.chapter,
        title: row.title,
        lines: JSON.parse(row.lines),
        choices: row.choices ? JSON.parse(row.choices) : null,
        isAvailable: row.is_available ? true : false,
        prereqDialogueId: row.prereq_dialogue_id,
      })
    }
  )
})

// GET /api/npcs/:id/dialogues — get all dialogues for an NPC
app.get('/api/npcs/:id/dialogues', (req, res) => {
  db.all(
    'SELECT * FROM dialogues WHERE npc_id = ? ORDER BY created_at',
    [req.params.id],
    (err, rows) => {
      if (err) {
        logger.error('GET /api/npcs/:id/dialogues error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      res.json(rows.map(r => ({
        id: r.id,
        npcId: r.npc_id,
        chapter: r.chapter,
        title: r.title,
        lines: JSON.parse(r.lines),
        choices: r.choices ? JSON.parse(r.choices) : null,
        isAvailable: r.is_available ? true : false,
        prereqDialogueId: r.prereq_dialogue_id,
      })))
    }
  )
})

// POST /api/npcs/:id/talk — record a talk event, update trust
app.post('/api/npcs/:id/talk', (req, res) => {
  const npcId = req.params.id
  const playerId = req.body.playerId || 'player-1'
  const trustChange = req.body.trustChange || 0
  const relId = `rel-${playerId}-${npcId}`
  const now = new Date().toISOString()

  // Upsert relationship
  db.get('SELECT * FROM npc_relationships WHERE player_id = ? AND npc_id = ?', [playerId, npcId], (err, existing) => {
    if (err) {
      logger.error('POST /api/npcs/:id/talk check error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }

    if (existing) {
      // Update existing relationship
      const newTrust = Math.max(0, Math.min(100, existing.trust_level + trustChange))
      db.run(
        'UPDATE npc_relationships SET trust_level = ?, total_talks = total_talks + 1, met = 1, last_talk_at = ? WHERE id = ?',
        [newTrust, now, existing.id],
        function (err2) {
          if (err2) {
            logger.error('POST /api/npcs/:id/talk update error:', err2.message)
            return res.status(500).json({ error: 'Internal server error' })
          }
          res.json({ trustLevel: newTrust, totalTalks: existing.total_talks + 1 })
        }
      )
    } else {
      // Create new relationship
      const newTrust = Math.max(0, Math.min(100, 50 + trustChange))
      db.run(
        'INSERT INTO npc_relationships (id, player_id, npc_id, trust_level, met, total_talks, last_talk_at, created_at) VALUES (?, ?, ?, ?, 1, 1, ?, ?)',
        [relId, playerId, npcId, newTrust, now, now],
        function (err2) {
          if (err2) {
            logger.error('POST /api/npcs/:id/talk insert error:', err2.message)
            return res.status(500).json({ error: 'Internal server error' })
          }
          res.json({ trustLevel: newTrust, totalTalks: 1 })
        }
      )
    }
  })
})

// GET /api/npcs/:id/relationship — get player's relationship with NPC
app.get('/api/npcs/:id/relationship', (req, res) => {
  const playerId = req.query.playerId || 'player-1'
  db.get(
    'SELECT * FROM npc_relationships WHERE player_id = ? AND npc_id = ?',
    [playerId, req.params.id],
    (err, row) => {
      if (err) {
        logger.error('GET /api/npcs/:id/relationship error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      if (!row) return res.json({ trustLevel: 50, met: false, totalTalks: 0 })
      res.json({
        trustLevel: row.trust_level,
        met: row.met ? true : false,
        totalTalks: row.total_talks,
        lastTalkAt: row.last_talk_at,
      })
    }
  )
})

// GET /api/relationships — get all player relationships
app.get('/api/relationships', (req, res) => {
  const playerId = req.query.playerId || 'player-1'
  db.all(
    'SELECT r.*, n.name as npc_name, n.npc_type FROM npc_relationships r JOIN world_npcs n ON r.npc_id = n.id WHERE r.player_id = ?',
    [playerId],
    (err, rows) => {
      if (err) {
        logger.error('GET /api/relationships error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      res.json(rows.map(r => ({
        npcId: r.npc_id,
        npcName: r.npc_name,
        npcType: r.npc_type,
        trustLevel: r.trust_level,
        met: r.met ? true : false,
        totalTalks: r.total_talks,
        lastTalkAt: r.last_talk_at,
      })))
    }
  )
})

// ─── Fraud City: Chapters & Missions ─────────────────────────

// GET /api/chapters — list all chapters
app.get('/api/chapters', (req, res) => {
  db.all('SELECT * FROM chapters ORDER BY chapter_order', [], (err, rows) => {
    if (err) {
      logger.error('GET /api/chapters error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      chapterOrder: r.chapter_order,
      unlockedBy: r.unlocked_by,
      isUnlocked: r.is_unlocked ? true : false,
    })))
  })
})

// GET /api/chapters/:id — get single chapter with missions
app.get('/api/chapters/:id', (req, res) => {
  db.get('SELECT * FROM chapters WHERE id = ?', [req.params.id], (err, chapter) => {
    if (err) {
      logger.error('GET /api/chapters/:id error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' })

    db.all('SELECT * FROM missions WHERE chapter_id = ? ORDER BY mission_order', [req.params.id], (err2, missions) => {
      if (err2) {
        logger.error('GET /api/chapters/:id missions error:', err2.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      res.json({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        chapterOrder: chapter.chapter_order,
        unlockedBy: chapter.unlocked_by,
        isUnlocked: chapter.is_unlocked ? true : false,
        missions: missions.map(m => ({
          id: m.id,
          chapterId: m.chapter_id,
          title: m.title,
          description: m.description,
          missionType: m.mission_type,
          fraudType: m.fraud_type,
          objectives: JSON.parse(m.objectives),
          rewards: JSON.parse(m.rewards),
          mapId: m.map_id,
          npcId: m.npc_id,
          triggerDialogueId: m.trigger_dialogue_id,
          isAvailable: m.is_available ? true : false,
          missionOrder: m.mission_order,
        })),
      })
    })
  })
})

// GET /api/missions — list all available missions
app.get('/api/missions', (req, res) => {
  const chapterId = req.query.chapterId
  const playerId = req.query.playerId || 'player-1'
  let query = `
    SELECT m.*, p.status as player_status, p.objectives_complete, p.xp_earned
    FROM missions m
    LEFT JOIN player_progress p ON m.id = p.mission_id AND p.player_id = ?
    WHERE m.is_available = 1
  `
  const params = [playerId]
  if (chapterId) {
    query += ' AND m.chapter_id = ?'
    params.push(chapterId)
  }
  query += ' ORDER BY m.mission_order'

  db.all(query, params, (err, rows) => {
    if (err) {
      logger.error('GET /api/missions error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows.map(r => ({
      id: r.id,
      chapterId: r.chapter_id,
      title: r.title,
      description: r.description,
      missionType: r.mission_type,
      fraudType: r.fraud_type,
      objectives: JSON.parse(r.objectives),
      rewards: JSON.parse(r.rewards),
      mapId: r.map_id,
      npcId: r.npc_id,
      triggerDialogueId: r.trigger_dialogue_id,
      missionOrder: r.mission_order,
      playerStatus: r.player_status || 'locked',
      objectivesComplete: r.objectives_complete ? JSON.parse(r.objectives_complete) : [],
      xpEarned: r.xp_earned || 0,
    })))
  })
})

// POST /api/missions/:id/accept — accept a mission
app.post('/api/missions/:id/accept', (req, res) => {
  const missionId = req.params.id
  const playerId = req.body.playerId || 'player-1'
  const progressId = `prog-${playerId}-${missionId}`
  const now = new Date().toISOString()

  db.get('SELECT * FROM missions WHERE id = ?', [missionId], (err, mission) => {
    if (err) {
      logger.error('POST /api/missions/:id/accept check error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!mission) return res.status(404).json({ error: 'Mission not found' })

    db.get('SELECT * FROM player_progress WHERE player_id = ? AND mission_id = ?', [playerId, missionId], (err2, existing) => {
      if (err2) {
        logger.error('POST /api/missions/:id/accept progress error:', err2.message)
        return res.status(500).json({ error: 'Internal server error' })
      }

      if (existing && existing.status !== 'locked') {
        return res.status(400).json({ error: 'Mission already accepted or completed' })
      }

      if (existing) {
        db.run('UPDATE player_progress SET status = ?, started_at = ? WHERE id = ?', ['active', now, existing.id], function (err3) {
          if (err3) {
            logger.error('POST /api/missions/:id/accept update error:', err3.message)
            return res.status(500).json({ error: 'Internal server error' })
          }
          res.json({ status: 'active', startedAt: now })
        })
      } else {
        db.run(
          'INSERT INTO player_progress (id, player_id, mission_id, status, objectives_complete, started_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [progressId, playerId, missionId, 'active', '[]', now, now],
          function (err3) {
            if (err3) {
              logger.error('POST /api/missions/:id/accept insert error:', err3.message)
              return res.status(500).json({ error: 'Internal server error' })
            }
            res.json({ status: 'active', startedAt: now })
          }
        )
      }
    })
  })
})

// POST /api/missions/:id/complete — complete an objective
app.post('/api/missions/:id/complete', (req, res) => {
  const missionId = req.params.id
  const playerId = req.body.playerId || 'player-1'
  const objectiveId = req.body.objectiveId
  const now = new Date().toISOString()

  db.get('SELECT * FROM player_progress WHERE player_id = ? AND mission_id = ?', [playerId, missionId], (err, progress) => {
    if (err) {
      logger.error('POST /api/missions/:id/complete check error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!progress || progress.status === 'locked') {
      return res.status(400).json({ error: 'Mission not active' })
    }
    if (progress.status === 'completed') {
      return res.status(400).json({ error: 'Mission already completed' })
    }

    let objectivesComplete = progress.objectives_complete ? JSON.parse(progress.objectives_complete) : []
    if (objectiveId && !objectivesComplete.includes(objectiveId)) {
      objectivesComplete.push(objectiveId)
    }

    db.get('SELECT * FROM missions WHERE id = ?', [missionId], (err2, mission) => {
      if (err2) {
        logger.error('POST /api/missions/:id/complete mission error:', err2.message)
        return res.status(500).json({ error: 'Internal server error' })
      }

      const allObjectives = JSON.parse(mission.objectives)
      const allDone = allObjectives.every(obj => objectivesComplete.includes(obj.id))

      if (allDone) {
        const rewards = JSON.parse(mission.rewards)
        db.run(
          'UPDATE player_progress SET status = ?, objectives_complete = ?, completed_at = ?, xp_earned = ? WHERE id = ?',
          ['completed', JSON.stringify(objectivesComplete), now, rewards.xp || 0, progress.id],
          function (err3) {
            if (err3) {
              logger.error('POST /api/missions/:id/complete update error:', err3.message)
              return res.status(500).json({ error: 'Internal server error' })
            }
            res.json({ status: 'completed', objectivesComplete, rewards })
          }
        )
      } else {
        db.run(
          'UPDATE player_progress SET objectives_complete = ? WHERE id = ?',
          [JSON.stringify(objectivesComplete), progress.id],
          function (err3) {
            if (err3) {
              logger.error('POST /api/missions/:id/complete objectives error:', err3.message)
              return res.status(500).json({ error: 'Internal server error' })
            }
            res.json({ status: 'active', objectivesComplete, allDone: false })
          }
        )
      }
    })
  })
})

// GET /api/progress — get all player progress
app.get('/api/progress', (req, res) => {
  const playerId = req.query.playerId || 'player-1'
  db.all(
    `SELECT p.*, m.title as mission_title, m.chapter_id, m.xp_earned as mission_xp
     FROM player_progress p
     JOIN missions m ON p.mission_id = m.id
     WHERE p.player_id = ?`,
    [playerId],
    (err, rows) => {
      if (err) {
        logger.error('GET /api/progress error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      res.json(rows.map(r => ({
        missionId: r.mission_id,
        missionTitle: r.mission_title,
        chapterId: r.chapter_id,
        status: r.status,
        objectivesComplete: r.objectives_complete ? JSON.parse(r.objectives_complete) : [],
        xpEarned: r.xp_earned,
        startedAt: r.started_at,
        completedAt: r.completed_at,
      })))
    }
  )
})

// ─── Fraud City: Evidence & Bosses ───────────────────────────

// GET /api/evidence — list all player evidence
app.get('/api/evidence', (req, res) => {
  const playerId = req.query.playerId || 'player-1'
  db.all(
    'SELECT * FROM evidence WHERE player_id = ? ORDER BY collected_at DESC',
    [playerId],
    (err, rows) => {
      if (err) {
        logger.error('GET /api/evidence error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      res.json(rows.map(r => ({
        id: r.id,
        evidenceType: r.evidence_type,
        title: r.title,
        description: r.description,
        content: r.content ? JSON.parse(r.content) : null,
        sourceNpcId: r.source_npc_id,
        sourceMissionId: r.source_mission_id,
        mapId: r.map_id,
        locationX: r.location_x,
        locationY: r.location_y,
        isRead: r.is_read ? true : false,
        collectedAt: r.collected_at,
      })))
    }
  )
})

// POST /api/evidence/collect — collect a piece of evidence
app.post('/api/evidence/collect', (req, res) => {
  const playerId = req.body.playerId || 'player-1'
  const { evidenceType, title, description, content, sourceMissionId, mapId, locationX, locationY } = req.body

  if (!evidenceType || !title) {
    return res.status(400).json({ error: 'evidenceType and title are required' })
  }

  const evidenceId = `ev-${Date.now()}`
  const now = new Date().toISOString()

  db.run(
    `INSERT INTO evidence (id, player_id, evidence_type, title, description, content, source_mission_id, map_id, location_x, location_y, is_read, collected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [evidenceId, playerId, evidenceType, title, description || null, content ? JSON.stringify(content) : null,
     sourceMissionId || null, mapId || null, locationX || null, locationY || null, now],
    function (err) {
      if (err) {
        logger.error('POST /api/evidence/collect error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      res.status(201).json({ id: evidenceId, collectedAt: now })
    }
  )
})

// PUT /api/evidence/:id/read — mark evidence as read
app.put('/api/evidence/:id/read', (req, res) => {
  db.run('UPDATE evidence SET is_read = 1 WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      logger.error('PUT /api/evidence/:id/read error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Evidence not found' })
    res.json({ success: true })
  })
})

// GET /api/bosses — list all bosses
app.get('/api/bosses', (req, res) => {
  const chapterId = req.query.chapterId
  let query = 'SELECT * FROM bosses'
  const params = []
  if (chapterId) {
    query += ' WHERE chapter_id = ?'
    params.push(chapterId)
  }
  query += ' ORDER BY created_at'

  db.all(query, params, (err, rows) => {
    if (err) {
      logger.error('GET /api/bosses error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      title: r.title,
      bossType: r.boss_type,
      chapterId: r.chapter_id,
      mapId: r.map_id,
      x: r.x,
      y: r.y,
      sprite: r.sprite,
      hp: r.hp,
      weakness: r.weakness,
      evidenceRequired: JSON.parse(r.evidence_required),
      defeatDialogue: r.defeat_dialogue ? JSON.parse(r.defeat_dialogue) : null,
      rewardXp: r.reward_xp,
      isDefeated: r.is_defeated ? true : false,
    })))
  })
})

// GET /api/bosses/:id — get single boss
app.get('/api/bosses/:id', (req, res) => {
  const playerId = req.query.playerId || 'player-1'
  db.get('SELECT * FROM bosses WHERE id = ?', [req.params.id], (err, boss) => {
    if (err) {
      logger.error('GET /api/bosses/:id error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!boss) return res.status(404).json({ error: 'Boss not found' })

    // Get evidence player has presented
    db.all(
      'SELECT evidence_id FROM player_evidence WHERE player_id = ? AND boss_id = ?',
      [playerId, req.params.id],
      (err2, presented) => {
        if (err2) {
          logger.error('GET /api/bosses/:id evidence error:', err2.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        const presentedIds = presented.map(p => p.evidence_id)
        const requiredIds = JSON.parse(boss.evidence_required)
        const canConfront = requiredIds.every(id => presentedIds.includes(id))

        res.json({
          id: boss.id,
          name: boss.name,
          title: boss.title,
          bossType: boss.boss_type,
          chapterId: boss.chapter_id,
          mapId: boss.map_id,
          x: boss.x,
          y: boss.y,
          sprite: boss.sprite,
          hp: boss.hp,
          weakness: boss.weakness,
          evidenceRequired: requiredIds,
          evidencePresented: presentedIds,
          canConfront,
          defeatDialogue: boss.defeat_dialogue ? JSON.parse(boss.defeat_dialogue) : null,
          rewardXp: boss.reward_xp,
          isDefeated: boss.is_defeated ? true : false,
        })
      }
    )
  })
})

// POST /api/bosses/:id/present — present evidence to boss
app.post('/api/bosses/:id/present', (req, res) => {
  const bossId = req.params.id
  const playerId = req.body.playerId || 'player-1'
  const evidenceId = req.body.evidenceId
  const now = new Date().toISOString()

  if (!evidenceId) {
    return res.status(400).json({ error: 'evidenceId is required' })
  }

  // Check boss exists
  db.get('SELECT * FROM bosses WHERE id = ?', [bossId], (err, boss) => {
    if (err) {
      logger.error('POST /api/bosses/:id/present boss error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!boss) return res.status(404).json({ error: 'Boss not found' })
    if (boss.is_defeated) return res.status(400).json({ error: 'Boss already defeated' })

    // Check if already presented
    db.get(
      'SELECT * FROM player_evidence WHERE player_id = ? AND boss_id = ? AND evidence_id = ?',
      [playerId, bossId, evidenceId],
      (err2, existing) => {
        if (err2) {
          logger.error('POST /api/bosses/:id/present check error:', err2.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        if (existing) return res.status(400).json({ error: 'Evidence already presented' })

        // Check evidence is in required list
        const requiredIds = JSON.parse(boss.evidence_required)
        if (!requiredIds.includes(evidenceId)) {
          return res.status(400).json({ error: 'This evidence is not relevant to this boss' })
        }

        // Present the evidence
        const peId = `pe-${playerId}-${bossId}-${evidenceId}`
        db.run(
          'INSERT INTO player_evidence (id, player_id, boss_id, evidence_id, presented_at) VALUES (?, ?, ?, ?, ?)',
          [peId, playerId, bossId, evidenceId, now],
          function (err3) {
            if (err3) {
              logger.error('POST /api/bosses/:id/present insert error:', err3.message)
              return res.status(500).json({ error: 'Internal server error' })
            }

            // Check if all evidence presented
            db.all(
              'SELECT evidence_id FROM player_evidence WHERE player_id = ? AND boss_id = ?',
              [playerId, bossId],
              (err4, allPresented) => {
                if (err4) {
                  logger.error('POST /api/bosses/:id/present check all error:', err4.message)
                  return res.status(500).json({ error: 'Internal server error' })
                }

                const presentedIds = allPresented.map(p => p.evidence_id)
                const allDone = requiredIds.every(id => presentedIds.includes(id))

                if (allDone) {
                  // Boss defeated!
                  db.run(
                    'UPDATE bosses SET is_defeated = 1 WHERE id = ?',
                    [bossId],
                    function (err5) {
                      if (err5) {
                        logger.error('POST /api/bosses/:id/present defeat error:', err5.message)
                        return res.status(500).json({ error: 'Internal server error' })
                      }
                      res.json({
                        presented: true,
                        bossDefeated: true,
                        hpRemaining: 0,
                        rewardXp: boss.reward_xp,
                        defeatDialogue: boss.defeat_dialogue ? JSON.parse(boss.defeat_dialogue) : null,
                      })
                    }
                  )
                } else {
                  // More evidence needed
                  const hpRemaining = boss.hp - presentedIds.length
                  res.json({
                    presented: true,
                    bossDefeated: false,
                    hpRemaining: Math.max(1, hpRemaining),
                    evidencePresented: presentedIds.length,
                    evidenceRequired: requiredIds.length,
                  })
                }
              }
            )
          }
        )
      }
    )
  })
})

// ─── Fraud City: Player Progression ──────────────────────────

// GET /api/player/stats — get player stats
app.get('/api/player/stats', (req, res) => {
  const playerId = req.query.playerId || 'player-1'
  db.get('SELECT * FROM player_stats WHERE player_id = ?', [playerId], (err, row) => {
    if (err) {
      logger.error('GET /api/player/stats error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!row) return res.status(404).json({ error: 'Player not found' })
    res.json({
      playerId: row.player_id,
      level: row.level,
      xp: row.xp,
      xpToNext: row.xp_to_next,
      totalXp: row.total_xp,
      skillPoints: row.skill_points,
      skills: JSON.parse(row.skills),
      reputation: JSON.parse(row.reputation),
      titles: JSON.parse(row.titles),
      achievements: JSON.parse(row.achievements),
      playTime: row.play_time,
      scamsPrevented: row.scams_prevented,
      citizensHelped: row.citizens_helped,
    })
  })
})

// POST /api/player/xp — add XP and check for level up
app.post('/api/player/xp', (req, res) => {
  const playerId = req.body.playerId || 'player-1'
  const amount = req.body.amount || 0
  const now = new Date().toISOString()

  db.get('SELECT * FROM player_stats WHERE player_id = ?', [playerId], (err, stats) => {
    if (err) {
      logger.error('POST /api/player/xp error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!stats) return res.status(404).json({ error: 'Player not found' })

    let newXp = stats.xp + amount
    let newTotalXp = stats.total_xp + amount
    let newLevel = stats.level
    let newXpToNext = stats.xp_to_next
    let newSkillPoints = stats.skill_points
    let leveledUp = false

    // Level up loop
    while (newXp >= newXpToNext) {
      newXp -= newXpToNext
      newLevel++
      newSkillPoints++
      newXpToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1))
      leveledUp = true
    }

    // Determine new title based on level
    let titles = JSON.parse(stats.titles)
    const levelTitles = {
      5: "Junior Detective",
      10: "Fraud Analyst",
      15: "Security Expert",
      20: "Cyber Guardian",
      25: "Fraud Buster",
      30: "City Protector",
    }
    if (levelTitles[newLevel] && !titles.includes(levelTitles[newLevel])) {
      titles.push(levelTitles[newLevel])
    }

    db.run(
      'UPDATE player_stats SET xp = ?, level = ?, xp_to_next = ?, total_xp = ?, skill_points = ?, titles = ?, updated_at = ? WHERE player_id = ?',
      [newXp, newLevel, newXpToNext, newTotalXp, newSkillPoints, JSON.stringify(titles), now, playerId],
      function (err2) {
        if (err2) {
          logger.error('POST /api/player/xp update error:', err2.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        res.json({
          xp: newXp,
          level: newLevel,
          xpToNext: newXpToNext,
          totalXp: newTotalXp,
          skillPoints: newSkillPoints,
          leveledUp,
          newTitle: leveledUp ? levelTitles[newLevel] : null,
        })
      }
    )
  })
})

// POST /api/player/skill — upgrade a skill
app.post('/api/player/skill', (req, res) => {
  const playerId = req.body.playerId || 'player-1'
  const skill = req.body.skill
  const validSkills = ['investigation', 'communication', 'trust', 'technology']

  if (!skill || !validSkills.includes(skill)) {
    return res.status(400).json({ error: `Invalid skill. Must be one of: ${validSkills.join(', ')}` })
  }

  const now = new Date().toISOString()

  db.get('SELECT * FROM player_stats WHERE player_id = ?', [playerId], (err, stats) => {
    if (err) {
      logger.error('POST /api/player/skill error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!stats) return res.status(404).json({ error: 'Player not found' })
    if (stats.skill_points <= 0) return res.status(400).json({ error: 'No skill points available' })

    const skills = JSON.parse(stats.skills)
    const currentLevel = skills[skill] || 0
    if (currentLevel >= 10) return res.status(400).json({ error: 'Skill already at max level' })

    // nosemgrep: javascript.express.security.audit.remote-property-injection
    // `skill` is validated against a whitelist (validSkills) above, safe as object key
    skills[skill] = currentLevel + 1

    db.run(
      'UPDATE player_stats SET skills = ?, skill_points = skill_points - 1, updated_at = ? WHERE player_id = ?',
      [JSON.stringify(skills), now, playerId],
      function (err2) {
        if (err2) {
          logger.error('POST /api/player/skill update error:', err2.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        res.json({ skills, skillPoints: stats.skill_points - 1 })
      }
    )
  })
})

// POST /api/player/reputation — update reputation for a location
app.post('/api/player/reputation', (req, res) => {
  const playerId = req.body.playerId || 'player-1'
  const location = req.body.location
  const change = req.body.change || 0
  const now = new Date().toISOString()

  // Validate location: must be alphanumeric with hyphens, max 50 chars
  if (!location || !/^[a-z0-9-]{1,50}$/i.test(location)) {
    return res.status(400).json({ error: 'location is required and must be alphanumeric with hyphens (max 50 chars)' })
  }

  db.get('SELECT * FROM player_stats WHERE player_id = ?', [playerId], (err, stats) => {
    if (err) {
      logger.error('POST /api/player/reputation error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!stats) return res.status(404).json({ error: 'Player not found' })

    const reputation = JSON.parse(stats.reputation)
    const current = reputation[location] || 50
    // nosemgrep: javascript.express.security.audit.remote-property-injection
    // `location` is validated via regex (/^[a-z0-9-]{1,50}$/i) above, safe as object key
    reputation[location] = Math.max(0, Math.min(100, current + change))

    db.run(
      'UPDATE player_stats SET reputation = ?, updated_at = ? WHERE player_id = ?',
      [JSON.stringify(reputation), now, playerId],
      function (err2) {
        if (err2) {
          logger.error('POST /api/player/reputation update error:', err2.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        res.json({ reputation })
      }
    )
  })
})

// POST /api/player/stats/update — update general stats
app.post('/api/player/stats/update', (req, res) => {
  const playerId = req.body.playerId || 'player-1'
  const { scamsPrevented, citizensHelped, playTime } = req.body
  const now = new Date().toISOString()

  const fields = []
  const values = []
  if (scamsPrevented !== undefined) { fields.push('scams_prevented = ?'); values.push(scamsPrevented) }
  if (citizensHelped !== undefined) { fields.push('citizens_helped = ?'); values.push(citizensHelped) }
  if (playTime !== undefined) { fields.push('play_time = ?'); values.push(playTime) }
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' })

  fields.push('updated_at = ?')
  values.push(now)
  values.push(playerId)

  db.run(`UPDATE player_stats SET ${fields.join(', ')} WHERE player_id = ?`, values, function (err) {
    if (err) {
      logger.error('POST /api/player/stats/update error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json({ success: true })
  })
})

// ─── Fraud City: Save/Load System ────────────────────────────

// GET /api/saves — list all save slots for player
app.get('/api/saves', (req, res) => {
  const playerId = req.query.playerId || 'player-1'
  db.all('SELECT * FROM save_slots WHERE player_id = ? ORDER BY slot_number', [playerId], (err, rows) => {
    if (err) {
      logger.error('GET /api/saves error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    res.json(rows.map(r => ({
      id: r.id,
      slotName: r.slot_name,
      slotNumber: r.slot_number,
      level: r.level,
      playTime: r.play_time,
      location: r.location,
      thumbnail: r.thumbnail ? JSON.parse(r.thumbnail) : null,
      hasData: r.save_data !== '{}',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })))
  })
})

// POST /api/saves — save game to a slot
app.post('/api/saves', (req, res) => {
  const playerId = req.body.playerId || 'player-1'
  const slotNumber = req.body.slotNumber || 1
  const saveData = req.body.saveData
  const now = new Date().toISOString()

  if (!saveData) return res.status(400).json({ error: 'saveData is required' })

  // Gather current game state
  const gatherState = () => {
    return new Promise((resolve, reject) => {
      const state = { playerStats: null, progress: [], relationships: [], evidence: [] }
      let pending = 4

      db.get('SELECT * FROM player_stats WHERE player_id = ?', [playerId], (err, stats) => {
        if (stats) state.playerStats = {
          level: stats.level, xp: stats.xp, xpToNext: stats.xp_to_next,
          totalXp: stats.total_xp, skillPoints: stats.skill_points,
          skills: JSON.parse(stats.skills), reputation: JSON.parse(stats.reputation),
          titles: JSON.parse(stats.titles), achievements: JSON.parse(stats.achievements),
          playTime: stats.play_time, scamsPrevented: stats.scams_prevented,
          citizensHelped: stats.citizens_helped,
        }
        if (--pending === 0) resolve(state)
      })

      db.all('SELECT * FROM player_progress WHERE player_id = ?', [playerId], (err, rows) => {
        state.progress = (rows || []).map(r => ({
          missionId: r.mission_id, status: r.status,
          objectivesComplete: r.objectives_complete ? JSON.parse(r.objectives_complete) : [],
          xpEarned: r.xp_earned,
        }))
        if (--pending === 0) resolve(state)
      })

      db.all('SELECT * FROM npc_relationships WHERE player_id = ?', [playerId], (err, rows) => {
        state.relationships = (rows || []).map(r => ({
          npcId: r.npc_id, trustLevel: r.trust_level,
          met: r.met ? true : false, totalTalks: r.total_talks,
        }))
        if (--pending === 0) resolve(state)
      })

      db.all('SELECT * FROM evidence WHERE player_id = ?', [playerId], (err, rows) => {
        state.evidence = (rows || []).map(r => ({
          id: r.id, evidenceType: r.evidence_type, title: r.title,
          description: r.description, content: r.content ? JSON.parse(r.content) : null,
          isRead: r.is_read ? true : false, collectedAt: r.collected_at,
        }))
        if (--pending === 0) resolve(state)
      })
    })
  }

  gatherState().then(state => {
    const level = state.playerStats?.level || 1
    const playTime = state.playerStats?.playTime || 0
    const location = saveData.currentLocation || 'neighborhood'
    const thumbnail = {
      level, location, playTime,
      missionsCompleted: state.progress.filter(p => p.status === 'completed').length,
      evidenceCount: state.evidence.length,
    }

    // Upsert save slot
    db.get('SELECT * FROM save_slots WHERE player_id = ? AND slot_number = ?', [playerId, slotNumber], (err, existing) => {
      if (existing) {
        db.run(
          'UPDATE save_slots SET save_data = ?, level = ?, play_time = ?, location = ?, thumbnail = ?, updated_at = ? WHERE id = ?',
          [JSON.stringify(state), level, playTime, location, JSON.stringify(thumbnail), now, existing.id],
          function (err2) {
            if (err2) {
              logger.error('POST /api/saves update error:', err2.message)
              return res.status(500).json({ error: 'Internal server error' })
            }
            res.json({ id: existing.id, slotNumber, updatedAt: now })
          }
        )
      } else {
        const saveId = `save-${playerId}-${slotNumber}-${Date.now()}`
        db.run(
          'INSERT INTO save_slots (id, player_id, slot_name, slot_number, save_data, level, play_time, location, thumbnail, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [saveId, playerId, `Slot ${slotNumber}`, slotNumber, JSON.stringify(state), level, playTime, location, JSON.stringify(thumbnail), now, now],
          function (err2) {
            if (err2) {
              logger.error('POST /api/saves insert error:', err2.message)
              return res.status(500).json({ error: 'Internal server error' })
            }
            res.status(201).json({ id: saveId, slotNumber, createdAt: now })
          }
        )
      }
    })
  }).catch(err => {
    logger.error('POST /api/saves gather error:', err.message)
    res.status(500).json({ error: 'Failed to gather save data' })
  })
})

// POST /api/saves/:id/load — load game from a save slot
app.post('/api/saves/:id/load', (req, res) => {
  const playerId = req.body.playerId || 'player-1'
  const saveId = req.params.id

  db.get('SELECT * FROM save_slots WHERE id = ? AND player_id = ?', [saveId, playerId], (err, save) => {
    if (err) {
      logger.error('POST /api/saves/:id/load error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!save) return res.status(404).json({ error: 'Save not found' })
    if (save.save_data === '{}') return res.status(400).json({ error: 'Save slot is empty' })

    const state = JSON.parse(save.save_data)
    const now = new Date().toISOString()

    // Restore player stats
    if (state.playerStats) {
      const s = state.playerStats
      db.run(
        `UPDATE player_stats SET level = ?, xp = ?, xp_to_next = ?, total_xp = ?, skill_points = ?,
         skills = ?, reputation = ?, titles = ?, achievements = ?, play_time = ?,
         scams_prevented = ?, citizens_helped = ?, updated_at = ? WHERE player_id = ?`,
        [s.level, s.xp, s.xpToNext, s.totalXp, s.skillPoints,
         JSON.stringify(s.skills), JSON.stringify(s.reputation),
         JSON.stringify(s.titles), JSON.stringify(s.achievements),
         s.playTime, s.scamsPrevented, s.citizensHelped, now, playerId]
      )
    }

    // Restore mission progress
    if (state.progress && state.progress.length > 0) {
      db.run('DELETE FROM player_progress WHERE player_id = ?', [playerId])
      state.progress.forEach(p => {
        const progId = `prog-${playerId}-${p.missionId}`
        db.run(
          'INSERT INTO player_progress (id, player_id, mission_id, status, objectives_complete, xp_earned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [progId, playerId, p.missionId, p.status, JSON.stringify(p.objectivesComplete), p.xpEarned || 0, now]
        )
      })
    }

    // Restore relationships
    if (state.relationships && state.relationships.length > 0) {
      db.run('DELETE FROM npc_relationships WHERE player_id = ?', [playerId])
      state.relationships.forEach(r => {
        const relId = `rel-${playerId}-${r.npcId}`
        db.run(
          'INSERT INTO npc_relationships (id, player_id, npc_id, trust_level, met, total_talks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [relId, playerId, r.npcId, r.trustLevel, r.met ? 1 : 0, r.totalTalks, now]
        )
      })
    }

    // Restore evidence
    if (state.evidence && state.evidence.length > 0) {
      db.run('DELETE FROM evidence WHERE player_id = ?', [playerId])
      state.evidence.forEach(ev => {
        db.run(
          'INSERT INTO evidence (id, player_id, evidence_type, title, description, content, is_read, collected_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [ev.id, playerId, ev.evidenceType, ev.title, ev.description,
           ev.content ? JSON.stringify(ev.content) : null, ev.isRead ? 1 : 0, ev.collectedAt]
        )
      })
    }

    res.json({
      success: true,
      level: state.playerStats?.level || 1,
      location: save.location,
      playTime: save.play_time,
    })
  })
})

// DELETE /api/saves/:id — delete a save slot
app.delete('/api/saves/:id', (req, res) => {
  db.get('SELECT * FROM save_slots WHERE id = ?', [req.params.id], (err, save) => {
    if (err) {
      logger.error('DELETE /api/saves/:id error:', err.message)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!save) return res.status(404).json({ error: 'Save not found' })

    // Reset to empty rather than delete
    db.run(
      'UPDATE save_slots SET save_data = ?, level = 1, play_time = 0, location = ?, thumbnail = ?, updated_at = ? WHERE id = ?',
      ['{}', 'neighborhood', null, new Date().toISOString(), req.params.id],
      function (err2) {
        if (err2) {
          logger.error('DELETE /api/saves/:id reset error:', err2.message)
          return res.status(500).json({ error: 'Internal server error' })
        }
        res.json({ success: true })
      }
    )
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
