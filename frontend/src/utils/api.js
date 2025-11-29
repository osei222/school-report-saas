import axios from 'axios'

// Dynamic base resolution for development and production
const explicit = import.meta.env.VITE_API_BASE
const isDev = import.meta.env.DEV
const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'

let base
if (explicit) {
  // Use explicit API URL from environment
  base = explicit.endsWith('/') ? explicit.slice(0, -1) : explicit
} else if (isDev) {
  // Development mode
  if (host && host !== 'localhost' && !host.startsWith('127.')) {
    base = `http://${host}:8000/api`
  } else {
    base = 'http://localhost:8000/api'
  }
} else {
  // Production mode - will be set via environment variable
  base = import.meta.env.VITE_API_BASE || 'https://school-report-saas.onrender.com/api'
}

const api = axios.create({ baseURL: base })

// Attach token per request (resilient even if context header lost)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sr_token') || localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (config.url && !config.url.includes('/auth/')) {
    // Only log for non-auth requests
    console.warn('No authentication token found for API request')
  }
  // Normalize trailing slashes for non-GET methods to play nice with DRF DefaultRouter
  try {
    const method = (config.method || 'get').toLowerCase()
    const needsSlash = method !== 'get' && typeof config.url === 'string'
      && !/^https?:\/\//i.test(config.url)
      && !config.url.endsWith('/')
    if (needsSlash) config.url = config.url + '/'
  } catch {}
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Handle 401 authentication errors specifically
    if (error.response?.status === 401 && !error.config?._retry) {
      console.warn('Authentication failed - attempting token refresh')
      
      const refreshToken = localStorage.getItem('sr_refresh')
      if (refreshToken && !error.config.url?.includes('/auth/token/refresh/')) {
        try {
          // Mark this request as retried to prevent loops
          error.config._retry = true
          
          // Attempt to refresh token
          const refreshRes = await api.post('/auth/token/refresh/', { refresh: refreshToken })
          const { access } = refreshRes.data
          
          // Update token in localStorage and headers
          localStorage.setItem('sr_token', access)
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`
          error.config.headers.Authorization = `Bearer ${access}`
          
          console.log('Token refreshed successfully')
          
          // Retry the original request
          return api.request(error.config)
        } catch (refreshError) {
          console.warn('Token refresh failed, clearing auth data')
          localStorage.removeItem('sr_token')
          localStorage.removeItem('sr_refresh')
          localStorage.removeItem('sr_user')
          
          // Don't auto-redirect on mobile to prevent loops
          if (window.innerWidth > 768 && !window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }
      } else {
        console.warn('No refresh token available, clearing auth data')
        localStorage.removeItem('sr_token')
        localStorage.removeItem('sr_refresh')
        localStorage.removeItem('sr_user')
        
        // Don't auto-redirect on mobile to prevent loops
        if (window.innerWidth > 768 && !window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }
    
    // Normalize error into error.normalizedMessage
    let message = 'Request failed'
    if (error.response) {
      const data = error.response.data
      message = data?.detail || data?.message || message
      if (message === 'Request failed' && data && typeof data === 'object') {
        const parts = []
        for (const [k, v] of Object.entries(data)) {
          if (k === 'detail' || k === 'message') continue
          if (Array.isArray(v) && v.length) parts.push(`${k}: ${v[0]}`)
          else if (typeof v === 'string') parts.push(`${k}: ${v}`)
        }
        if (parts.length) message = parts.join(' | ')
      }
      message = `${message}`
    } else if (error.request) {
      message = 'No response from server (network)' 
    } else {
      message = error.message
    }
    error.normalizedMessage = message
    return Promise.reject(error)
  }
)

export default api
