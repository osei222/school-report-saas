import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { FaTachometerAlt, FaUserGraduate, FaBookOpen, FaFileInvoice, FaChalkboardTeacher, FaSchool, FaLayerGroup, FaBook, FaCog, FaUsers } from 'react-icons/fa'

export default function MobileNav() {
  const { user } = useAuth()
  const location = useLocation()

  const Item = ({ to, Icon, label, badge }) => {
    const isActive = location.pathname.startsWith(to)
    return (
      <Link 
        to={to} 
        className={`bottom-nav-item${isActive ? ' active' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: isActive ? '#60a5fa' : '#9ca3af',
          textDecoration: 'none',
          padding: '10px 8px',
          borderRadius: 12,
          minWidth: 60,
          transition: 'all 0.3s ease',
          position: 'relative',
          background: isActive 
            ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(96, 165, 250, 0.05))' 
            : 'transparent',
          transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: isActive ? '0 4px 12px rgba(96, 165, 250, 0.2)' : 'none'
        }}
      >
        <div className="nav-icon-container" style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={isActive ? 22 : 20} />
          {badge && (
            <span className="nav-badge" style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: '#ef4444',
              color: 'white',
              borderRadius: 10,
              padding: '2px 6px',
              fontSize: 10,
              fontWeight: 600,
              minWidth: 16,
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {badge}
            </span>
          )}
        </div>
        <span className="nav-label" style={{
          fontSize: isActive ? 12 : 11,
          lineHeight: 1,
          fontWeight: isActive ? 600 : 500,
          textAlign: 'center',
          opacity: isActive ? 1 : 0.8
        }}>
          {label}
        </span>
      </Link>
    )
  }

  // Enhanced navigation items based on user role
  const getNavItems = () => {
    const baseItems = [
      { to: "/dashboard", Icon: FaTachometerAlt, label: "Home" }
    ]

    if (user?.role === 'TEACHER') {
      return [
        ...baseItems,
        { to: "/classes", Icon: FaLayerGroup, label: "Classes" },
        { to: "/scores", Icon: FaBookOpen, label: "Scores" },
        { to: "/reports", Icon: FaFileInvoice, label: "Reports" }
      ]
    } else if (user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL') {
      return [
        ...baseItems,
        { to: "/students", Icon: FaUserGraduate, label: "Students" },
        { to: "/teachers", Icon: FaChalkboardTeacher, label: "Teachers" },
        { to: "/reports", Icon: FaFileInvoice, label: "Reports" },
        { to: "/settings", Icon: FaCog, label: "Settings" }
      ]
    }
    
    return baseItems
  }

  return (
    <nav className="bottom-nav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 40,
      background: 'rgba(17,24,39,.98)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid #374151',
      display: window.innerWidth <= 768 ? 'flex' : 'none',
      padding: '8px 6px calc(8px + env(safe-area-inset-bottom))',
      justifyContent: 'space-around',
      boxShadow: '0 -4px 20px rgba(0,0,0,.4)'
    }}>
      {getNavItems().map(item => (
        <Item key={item.to} {...item} />
      ))}
    </nav>
  )
}
