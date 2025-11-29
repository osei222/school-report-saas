import axios from 'axios'

// Production-first API base URL configuration
const getApiBaseUrl = () => {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE.replace(/\/$/, '')
  }
  
  // Check if we're in production (Netlify)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const isProduction = hostname.includes('netlify.app') || import.meta.env.PROD
  
  if (isProduction) {
    // Force production API URL
    return 'https://school-report-saas.onrender.com/api'
  }
  
  // Development fallback
  if (hostname !== 'localhost' && !hostname.startsWith('127.')) {
    // Mobile development
    return `http://${hostname}:8000/api`
  }
  
  // Local development
  return 'http://localhost:8000/api'
}

const base = getApiBaseUrl()
console.log('API Base URL:', base) // Debug log

const api = axios.create({ baseURL: base })

// CORS-enabled API call with fallback
export const corsEnabledRequest = async (endpoint, options = {}) => {
  try {
    // Try normal endpoint first
    return await api(endpoint, options)
  } catch (error) {
    if (error.message?.includes('CORS') && endpoint.includes('/teachers/')) {
      console.log('CORS blocked, trying CORS-enabled endpoint...')
      // Fallback to CORS-enabled endpoint for teachers
      const corsEndpoint = endpoint.replace('/teachers/', '/teachers/cors/')
      return await api(corsEndpoint, options)
    }
    throw error
  }
}

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
    
    // Enhanced error handling with CORS detection
    let message = 'Request failed'
    
    if (error.response) {
      // Server responded with error status
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
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      })
    } else if (error.request) {
      // Network error or CORS issue
      console.error('Network/CORS Error:', {
        message: error.message,
        request: error.request,
        config: error.config
      })
      
      if (error.message?.includes('CORS') || error.message?.includes('blocked by CORS policy')) {
        message = 'CORS policy blocked this request. Please check backend CORS configuration.'
      } else if (error.message?.includes('Network Error')) {
        message = 'Network error - unable to reach the server. Check your internet connection or server status.'
      } else {
        message = 'No response from server (network error)'
      }
    } else {
      // Request setup error
      console.error('Request Setup Error:', error.message)
      message = error.message
    }
    
    error.normalizedMessage = message
    return Promise.reject(error)
  }
)

export default api
