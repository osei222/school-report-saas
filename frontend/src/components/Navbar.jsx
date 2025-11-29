import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { FaTachometerAlt, FaUserGraduate, FaBookOpen, FaFileInvoice, FaChalkboardTeacher, FaSignOutAlt, FaSchool, FaLayerGroup, FaBook, FaCog } from 'react-icons/fa'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const link = (to, label, Icon) => (
    <Link className={`nav-link${location.pathname.startsWith(to) ? ' active' : ''}`} to={to}>
      {Icon && <Icon style={{ marginRight: 8, verticalAlign: '-2px' }} />}
      {label}
    </Link>
  )

  return (
    <header className="navbar">
      <div className="brand" style={{display:'flex',alignItems:'center',gap:8}}>
        <FaSchool color="#60a5fa" />
        School Report SaaS
      </div>
      <nav className="nav">
        {link('/dashboard', 'Dashboard', FaTachometerAlt)}
        {link('/classes', 'Classes', FaLayerGroup)}
  {(user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL') && link('/subjects', 'Subjects', FaBook)}
        {link('/students', 'Students', FaUserGraduate)}
  {user?.role === 'TEACHER' && link('/scores', 'Enter Scores', FaBookOpen)}
        {link('/reports', 'Reports', FaFileInvoice)}
        {(user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL') && link('/teachers', 'Teachers', FaChalkboardTeacher)}
        {(user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL') && link('/settings', 'Settings', FaCog)}
      </nav>
      <div className="user">
        <span>
          {user?.first_name} {user?.last_name}
          <span className="chip" style={{marginLeft:8}}>{user?.role}</span>
        </span>
        <button className="btn" onClick={logout}><FaSignOutAlt style={{marginRight:6, verticalAlign:'-2px'}} />Logout</button>
      </div>
    </header>
  )
}
