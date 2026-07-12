import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
})

// Request interceptor — add auth headers or other config here
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Response interceptor — normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'API error'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
