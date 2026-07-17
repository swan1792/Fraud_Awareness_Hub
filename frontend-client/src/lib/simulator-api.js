/**
 * Simulator API Client
 * Handles communication with the scammer LLM backend.
 */

import apiClient from './axios'

/**
 * Send chat message and get scammer response (non-streaming)
 * @param {Array} messages - Conversation history
 * @param {Object} options - { max_tokens, temperature, language }
 * @returns {Promise<Object>} - { message: { role, content }, usage }
 */
export async function sendChatMessage(messages, options = {}) {
  const { max_tokens = 150, temperature = 0.8, language = 'en', level = 1 } = options

  const response = await apiClient.post('/simulator/chat', {
    messages,
    max_tokens,
    temperature,
    stream: false,
    language,
    level,
  })

  return response.data
}

/**
 * Send chat message and stream scammer response
 * @param {Array} messages - Conversation history
 * @param {Function} onToken - Callback for each token
 * @param {Function} onDone - Callback when stream ends
 * @param {Function} onError - Callback on error
 * @param {Object} options - { max_tokens, temperature, language }
 */
export async function streamChatMessage(messages, { onToken, onDone, onError }, options = {}) {
  const { max_tokens = 150, temperature = 0.8, language = 'en', level = 1 } = options

  try {
    const response = await fetch(`${apiClient.defaults.baseURL}/simulator/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        max_tokens,
        temperature,
        language,
        level,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Stream request failed')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onDone()
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.token) {
              onToken(parsed.token)
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    onDone()
  } catch (err) {
    onError(err)
  }
}

/**
 * Check LLM service health
 * @returns {Promise<Object>} - { status, model_loaded }
 */
export async function checkSimulatorHealth() {
  try {
    const response = await apiClient.get('/simulator/health')
    return response.data
  } catch (err) {
    return { status: 'offline', model_loaded: false, error: err.message }
  }
}
