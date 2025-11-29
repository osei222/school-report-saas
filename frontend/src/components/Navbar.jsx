import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../state/AuthContext'
import { FaTachometerAlt, FaUserGraduate, FaBookOpen, FaFileInvoice, FaChalkboardTeacher, FaSignOutAlt, FaSchool, FaLayerGroup, FaBook, FaCog } from 'react-icons/fa'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const link = (to, label, Icon) => {
    const isActive = location.pathname.startsWith(to)
    return (
      <Link 
        className={`nav-link${isActive ? ' active' : ''}`} 
        to={to}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 6 : 8,
          padding: isMobile ? '10px 12px' : '8px 12px',
          borderRadius: isMobile ? 10 : 8,
          fontSize: isMobile ? 14 : 15,
          fontWeight: isActive ? 600 : 500,
          transition: 'all 0.3s ease',
          minHeight: isMobile ? 44 : 'auto',
          justifyContent: isMobile ? 'center' : 'flex-start'
        }}
      >
        {Icon && <Icon style={{ fontSize: isMobile ? 16 : 14 }} />}
        <span style={{ display: isMobile ? 'none' : 'inline' }}>{label}</span>
      </Link>
    )
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout()
    }
  }

  return (
    <header className="navbar" style={{
      background: isMobile ? 'rgba(17,24,39,.95)' : 'rgba(17,24,39,.7)',
      padding: isMobile ? '12px 16px' : '10px 16px',
      borderBottom: '1px solid #374151',
      backdropFilter: 'blur(16px)',
      boxShadow: isMobile ? '0 2px 10px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div className="brand" style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 8 : 10,
        fontSize: isMobile ? 16 : 18,
        fontWeight: 700,
        color: '#60a5fa'
      }}>
        <FaSchool size={isMobile ? 20 : 24} />
        <span style={{ display: isMobile ? 'none' : 'inline' }}>School Report SaaS</span>
        <span style={{ display: isMobile ? 'inline' : 'none' }}>SRS</span>
      </div>
      
      <nav className="nav" style={{
        display: isMobile ? 'none' : 'flex',
        gap: 8,
        flex: 1,
        justifyContent: 'center',
        maxWidth: '600px'
      }}>
        {link('/dashboard', 'Dashboard', FaTachometerAlt)}
        {link('/classes', 'Classes', FaLayerGroup)}
        {(user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL') && link('/subjects', 'Subjects', FaBook)}
        {link('/students', 'Students', FaUserGraduate)}
        {user?.role === 'TEACHER' && link('/scores', 'Enter Scores', FaBookOpen)}
        {link('/reports', 'Reports', FaFileInvoice)}
        {(user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL') && link('/teachers', 'Teachers', FaChalkboardTeacher)}
        {(user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL') && link('/settings', 'Settings', FaCog)}
      </nav>
      
      <div className="user" style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 8 : 12
      }}>
        <span style={{
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14
        }}>
          <span>{user?.first_name} {user?.last_name}</span>
          <span className="chip" style={{
            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {user?.role === 'SCHOOL_ADMIN' ? 'ADMIN' : user?.role === 'PRINCIPAL' ? 'PRINCIPAL' : 'TEACHER'}
          </span>
        </span>
        <button 
          className="btn" 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 4 : 6,
            padding: isMobile ? '8px 10px' : '8px 12px',
            fontSize: isMobile ? 13 : 14,
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            border: 'none',
            color: 'white',
            borderRadius: isMobile ? 8 : 8,
            fontWeight: 600,
            minHeight: isMobile ? 40 : 'auto',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            if (!isMobile) {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)'
            }
          }}
          onMouseLeave={e => {
            if (!isMobile) {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }
          }}
        >
          <FaSignOutAlt size={isMobile ? 14 : 16} />
          <span style={{ display: isMobile ? 'none' : 'inline' }}>Logout</span>
        </button>
      </div>
    </header>
  )
}
