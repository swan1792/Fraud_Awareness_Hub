import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
})

// Request interceptor — attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 and normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
      return Promise.reject(new Error('Session expired'))
    }
    const message = error.response?.data?.error || error.message || 'API error'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
