import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sr_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('sr_token'))
  const [loading, setLoading] = useState(false)

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('sr_refresh')
      if (!refreshTokenValue) {
        logout()
        return false
      }
      
      const res = await api.post('/auth/token/refresh/', { refresh: refreshTokenValue })
      const { access } = res.data
      
      setToken(access)
      localStorage.setItem('sr_token', access)
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`
      
      return true
    } catch (err) {
      console.warn('Token refresh failed:', err)
      logout()
      return false
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('sr_token')
    localStorage.removeItem('sr_refresh')
    localStorage.removeItem('sr_user')
  }

  // Check token validity on load
  useEffect(() => {
    const checkToken = async () => {
      const savedToken = localStorage.getItem('sr_token')
      if (savedToken) {
        try {
          // Try a simple API call to verify token
          await api.get('/auth/user/')
        } catch (error) {
          if (error.response?.status === 401) {
            console.log('Token expired, attempting refresh...')
            await refreshToken()
          }
        }
      }
    }
    checkToken()
  }, [])

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/login/', { email, password })
      const { access, refresh, user } = res.data
      setToken(access)
      setUser(user)
      localStorage.setItem('sr_token', access)
      localStorage.setItem('sr_refresh', refresh)
      localStorage.setItem('sr_user', JSON.stringify(user))
      return { ok: true }
    } catch (err) {
      const message = err?.normalizedMessage || err?.response?.data?.detail || 'Login failed'
      return { ok: false, message }
    } finally {
      setLoading(false)
    }
  }



  const registerSchool = async ({ school_name, admin_email, password, password_confirm, levels = ['BOTH'], first_name = 'Admin', last_name = 'User' }) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/register-school/', { school_name, admin_email, password, password_confirm, levels, first_name, last_name })
      const { access, refresh, user } = res.data
      setToken(access)
      setUser(user)
      localStorage.setItem('sr_token', access)
      localStorage.setItem('sr_refresh', refresh)
      localStorage.setItem('sr_user', JSON.stringify(user))
      return { ok: true }
    } catch (err) {
      const message = err?.normalizedMessage || err?.response?.data || { detail: 'Registration failed' }
      return { ok: false, message }
    } finally {
      setLoading(false)
    }
  }

  const value = useMemo(() => ({ user, token, login, logout, registerSchool, refreshToken, loading }), [user, token, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
