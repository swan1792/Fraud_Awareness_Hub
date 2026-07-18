/**
 * Simulator API Routes
 * Proxies chat requests to the Python LLM sidecar service.
 */

const express = require('express')
const router = express.Router()

const PYTHON_SIDECAR = process.env.PYTHON_SIDECAR_URL || 'http://localhost:8000'

// ─── Validation ──────────────────────────────────────────────
function validateChatRequest(req, res, next) {
  const { messages } = req.body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' })
  }

  // Validate each message
  for (const msg of messages) {
    if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
      return res.status(400).json({ error: 'Invalid message role' })
    }
    if (typeof msg.content !== 'string' || msg.content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content must be a non-empty string' })
    }
  }

  // Limit conversation length
  if (messages.length > 20) {
    return res.status(400).json({ error: 'Conversation too long (max 20 messages)' })
  }

  next()
}

// ─── Routes ──────────────────────────────────────────────────

/**
 * POST /api/simulator/chat
 * Generate scammer response (non-streaming)
 */
router.post('/chat', validateChatRequest, async (req, res) => {
  try {
    const { messages, max_tokens = 150, temperature = 0.8, language = 'en', level = 1 } = req.body

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000) // 120s timeout

    const response = await fetch(`${PYTHON_SIDECAR}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_tokens, temperature, stream: false, language, level }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const error = await response.json()
      return res.status(response.status).json(error)
    }

    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('Simulator chat error:', err.message)

    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'LLM service timeout' })
    }

    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'LLM service unavailable' })
    }

    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/simulator/chat/stream
 * Generate scammer response (SSE streaming)
 */
router.post('/chat/stream', validateChatRequest, async (req, res) => {
  try {
    const { messages, max_tokens = 150, temperature = 0.8, language = 'en', level = 1 } = req.body

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000) // 120s timeout

    const response = await fetch(`${PYTHON_SIDECAR}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_tokens, temperature, language, level }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const error = await response.json()
      return res.status(response.status).json(error)
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    // Pipe the stream
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      res.write(chunk)
    }

    res.end()
  } catch (err) {
    console.error('Simulator stream error:', err.message)

    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'LLM service timeout' })
    }

    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'LLM service unavailable' })
    }

    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/simulator/health
 * Check LLM service health
 */
router.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_SIDECAR}/health`)
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.json({ status: 'offline', model_loaded: false, error: err.message })
  }
})

module.exports = router
