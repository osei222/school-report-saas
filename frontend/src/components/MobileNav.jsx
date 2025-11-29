import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { FaTachometerAlt, FaUserGraduate, FaBookOpen, FaFileInvoice, FaChalkboardTeacher, FaSchool, FaLayerGroup, FaBook, FaCog } from 'react-icons/fa'

export default function MobileNav() {
  const { user } = useAuth()
  const location = useLocation()

  const Item = ({ to, Icon, label, badge }) => (
    <Link to={to} className={`bottom-nav-item${location.pathname.startsWith(to) ? ' active' : ''}`}>
      <div className="nav-icon-container">
        <Icon size={20} />
        {badge && <span className="nav-badge">{badge}</span>}
      </div>
      <span className="nav-label">{label}</span>
    </Link>
  )

  // Filter items based on user role for cleaner mobile experience
  const getNavItems = () => {
    const baseItems = [
      { to: "/dashboard", Icon: FaTachometerAlt, label: "Home" }
    ]

    if (user?.role === 'TEACHER') {
      return [
        ...baseItems,
        { to: "/classes", Icon: FaLayerGroup, label: "Classes" },
        { to: "/scores", Icon: FaBookOpen, label: "Enter Scores" },
        { to: "/reports", Icon: FaFileInvoice, label: "Reports" }
      ]
    } else {
      return [
        ...baseItems,
        { to: "/classes", Icon: FaLayerGroup, label: "Classes" },
        { to: "/students", Icon: FaUserGraduate, label: "Students" },
        { to: "/subjects", Icon: FaBook, label: "Subjects" },
        { to: "/reports", Icon: FaFileInvoice, label: "Reports" }
      ]
    }
  }

  return (
    <nav className="bottom-nav">
      {getNavItems().map(item => (
        <Item key={item.to} {...item} />
      ))}
    </nav>
  )
}
