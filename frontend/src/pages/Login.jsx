import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { FaGraduationCap, FaEye, FaEyeSlash } from 'react-icons/fa'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await login(email, password)
    if (res.ok) navigate(from, { replace: true })
    else setError(res.message)
  }

  // Enhanced responsive breakpoints
  const screenWidth = window.innerWidth
  const isMobile = screenWidth <= 480
  const isTablet = screenWidth > 480 && screenWidth <= 768
  const isSmallMobile = screenWidth <= 375
  const isLargeMobile = screenWidth > 375 && screenWidth <= 480

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isSmallMobile ? '12px' : isMobile ? '16px' : isTablet ? '20px' : '24px'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        width: '100%',
        maxWidth: isSmallMobile ? '100%' : isMobile ? '380px' : isTablet ? '400px' : '420px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isSmallMobile ? '20px' : isMobile ? '24px' : isTablet ? '28px' : '32px'
        }}>
          <div style={{
            width: isSmallMobile ? '50px' : isMobile ? '60px' : isTablet ? '70px' : '80px',
            height: isSmallMobile ? '50px' : isMobile ? '60px' : isTablet ? '70px' : '80px',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: isSmallMobile ? '16px' : '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            <FaGraduationCap style={{ fontSize: isSmallMobile ? '24px' : isMobile ? '28px' : isTablet ? '32px' : '36px', color: 'white' }} />
          </div>
          <h1 style={{
            margin: 0,
            fontSize: isSmallMobile ? '20px' : isMobile ? '24px' : isTablet ? '28px' : '32px',
            fontWeight: '800',
            color: 'white',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            lineHeight: 1.2
          }}>Elite Tech Report</h1>
          <p style={{
            margin: '8px 0 0',
            fontSize: isSmallMobile ? '12px' : isMobile ? '14px' : isTablet ? '15px' : '16px',
            color: 'rgba(255,255,255,0.9)',
            fontWeight: '500'
          }}>Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: isSmallMobile ? '16px' : '20px',
          padding: isSmallMobile ? '20px 16px' : isMobile ? '24px 20px' : isTablet ? '28px 24px' : '32px 28px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: isSmallMobile ? '10px 14px' : isMobile ? '12px 16px' : isTablet ? '13px 17px' : '14px 18px',
              borderRadius: isSmallMobile ? '8px' : '12px',
              marginBottom: isSmallMobile ? '16px' : '20px',
              fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : isTablet ? '14.5px' : '15px',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          {/* Email Field */}
          <div style={{ marginBottom: isSmallMobile ? '16px' : '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: isSmallMobile ? '6px' : '8px',
              fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : isTablet ? '14.5px' : '15px',
              fontWeight: '600',
              color: '#374151'
            }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{
                width: '100%',
                padding: isSmallMobile 
                  ? '14px 14px' 
                  : isMobile 
                    ? '16px 16px' 
                    : isTablet 
                      ? '17px 17px' 
                      : '18px 18px',
                fontSize: '16px', // Always 16px to prevent zoom on iOS
                border: '2px solid #e5e7eb',
                borderRadius: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'white',
                color: '#1f2937',
                fontFamily: 'inherit',
                WebkitAppearance: 'none', // Remove iOS styling
                MozAppearance: 'none',
                boxSizing: 'border-box',
                // Enhanced mobile styling
                minHeight: isSmallMobile ? '48px' : isMobile ? '52px' : '56px',
                lineHeight: '1.5'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.boxShadow = isMobile 
                  ? '0 0 0 3px rgba(59,130,246,0.15)' 
                  : '0 0 0 3px rgba(59,130,246,0.1)'
                e.target.style.background = '#fefefe'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = 'none'
                e.target.style.background = 'white'
              }}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: isSmallMobile ? '20px' : '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: isSmallMobile ? '6px' : '8px',
              fontSize: isSmallMobile ? '13px' : isMobile ? '14px' : isTablet ? '14.5px' : '15px',
              fontWeight: '600',
              color: '#374151'
            }}>Password</label>
            <div style={{ 
              position: 'relative',
              width: '100%'
            }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{
                  width: '100%',
                  padding: isSmallMobile 
                    ? '14px 50px 14px 14px' 
                    : isMobile 
                      ? '16px 52px 16px 16px' 
                      : isTablet 
                        ? '17px 54px 17px 17px' 
                        : '18px 56px 18px 18px',
                  fontSize: '16px', // Fixed at 16px to prevent zoom on iOS
                  border: '2px solid #e5e7eb',
                  borderRadius: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: 'white',
                  color: '#1f2937',
                  fontFamily: 'inherit',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  boxSizing: 'border-box',
                  // Enhanced mobile styling
                  minHeight: isSmallMobile ? '48px' : isMobile ? '52px' : '56px',
                  lineHeight: '1.5'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = isMobile 
                    ? '0 0 0 3px rgba(59,130,246,0.15)' 
                    : '0 0 0 3px rgba(59,130,246,0.1)'
                  e.target.style.background = '#fefefe'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.boxShadow = 'none'
                  e.target.style.background = 'white'
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(107, 114, 128, 0.1)',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: isSmallMobile ? '36px' : isMobile ? '40px' : '44px',
                  minHeight: isSmallMobile ? '36px' : isMobile ? '40px' : '44px',
                  borderRadius: isSmallMobile ? '6px' : '8px',
                  transition: 'all 0.2s ease',
                  // Enhanced touch target for mobile
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.target.style.background = 'rgba(107, 114, 128, 0.2)'
                    e.target.style.color = '#4b5563'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.target.style.background = 'rgba(107, 114, 128, 0.1)'
                    e.target.style.color = '#6b7280'
                  }
                }}
                onTouchStart={(e) => {
                  e.target.style.background = 'rgba(107, 114, 128, 0.25)'
                  e.target.style.transform = 'translateY(-50%) scale(0.95)'
                }}
                onTouchEnd={(e) => {
                  e.target.style.background = 'rgba(107, 114, 128, 0.1)'
                  e.target.style.transform = 'translateY(-50%) scale(1)'
                }}
              >
                {showPassword ? 
                  <FaEyeSlash size={isSmallMobile ? 14 : isMobile ? 16 : 18} /> : 
                  <FaEye size={isSmallMobile ? 14 : isMobile ? 16 : 18} />
                }
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: isSmallMobile ? '16px' : isMobile ? '18px' : isTablet ? '19px' : '20px',
              fontSize: isSmallMobile ? '15px' : isMobile ? '16px' : isTablet ? '17px' : '18px',
              fontWeight: '600',
              color: 'white',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: isSmallMobile ? '8px' : isMobile ? '10px' : '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(59,130,246,0.4)',
              transform: loading ? 'scale(1)' : 'scale(1)',
              minHeight: isSmallMobile ? '52px' : isMobile ? '56px' : '60px', // Enhanced touch target
              fontFamily: 'inherit',
              touchAction: 'manipulation', // Improve touch response
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!loading && !isMobile) {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 6px 20px rgba(59,130,246,0.5)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !isMobile) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 14px rgba(59,130,246,0.4)'
              }
            }}
            onTouchStart={(e) => {
              if (!loading) {
                e.target.style.transform = 'scale(0.98)'
                e.target.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)'
              }
            }}
            onTouchEnd={(e) => {
              if (!loading) {
                e.target.style.transform = 'scale(1)'
                e.target.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)'
              }
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isSmallMobile ? '6px' : '8px' }}>
                <div style={{
                  width: isSmallMobile ? '16px' : '18px',
                  height: isSmallMobile ? '16px' : '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Signing in...
              </div>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Additional mobile optimizations */
          @media (max-width: 375px) {
            .login-form {
              margin: 0 8px;
            }
          }
          
          @media (min-width: 376px) and (max-width: 480px) {
            .login-form {
              margin: 0 12px;
            }
          }
          
          @media (min-width: 481px) and (max-width: 768px) {
            .login-form {
              margin: 0 16px;
            }
          }
          
          /* Prevent zoom on iOS when focusing inputs */
          @media screen and (-webkit-min-device-pixel-ratio: 0) {
            input[type="email"], input[type="password"] {
              font-size: 16px !important;
            }
          }
          
          /* Enhanced touch targets for mobile */
          @media (max-width: 768px) {
            button {
              min-height: 44px;
              touch-action: manipulation;
            }
            
            input {
              min-height: 48px;
              touch-action: manipulation;
            }
            
            /* Improve form field focus on mobile */
            input:focus {
              outline: none !important;
              box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
            }
            
            /* Better password field visibility toggle */
            button[type="button"] {
              -webkit-tap-highlight-color: rgba(0,0,0,0);
              user-select: none;
            }
          }
          
          /* Additional mobile-specific improvements */
          @media (max-width: 480px) {
            input {
              font-size: 16px !important;
            }
            
            /* Better spacing for very small screens */
            label {
              font-size: 14px !important;
              margin-bottom: 6px !important;
            }
            
            /* Enhanced button press feedback */
            button:active {
              transform: scale(0.98);
            }
          }
          
          /* Landscape mobile optimization */
          @media (max-height: 500px) and (orientation: landscape) {
            .login-form {
              max-height: 90vh;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
            }
          }
        `}
      </style>
    </div>
  )
}
