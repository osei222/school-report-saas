import { useEffect, useState } from 'react'
import api from '../utils/api'
import { FaChalkboardTeacher, FaPlus, FaSync, FaLock, FaEnvelope, FaUser, FaCalendarAlt, FaGraduationCap, FaPhone, FaUserGraduate, FaSave, FaTimes } from 'react-icons/fa'
import ScrollableSelect from '../components/ScrollableSelect'
import ImageCaptureInput from '../components/ImageCaptureInput'
import { useAuth } from '../state/AuthContext'

export default function Teachers() {
  const { user } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState({ 
    email: '', 
    first_name: '', 
    last_name: '', 
    password: '', 
    password_confirm: '', 
    employee_id: '',
    phone_number: '',
    hire_date: '',
    qualification: '',
    experience_years: 0,
    emergency_contact: '',
    address: '',
    specializations: [],
    class_id: ''
  })
  const [studentForm, setStudentForm] = useState({
    student_id: '', 
    first_name: '', 
    last_name: '', 
    other_names: '', 
    gender: 'M', 
    date_of_birth: '',
    current_class: '', 
    guardian_name: '', 
    guardian_phone: '', 
    guardian_email: '', 
    guardian_address: '',
    admission_date: '', 
    photo: null
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [studentLoading, setStudentLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [showSchedule, setShowSchedule] = useState(false)
  
  // Dynamic responsive state with resize listener
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevent body scroll when modal is open on mobile
  useEffect(() => {
    if (showCreate && windowWidth <= 768) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.height = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }
  }, [showCreate, windowWidth])

  // Responsive design constants
  const isMobile = windowWidth <= 768
  const isTablet = windowWidth <= 1024
  const isSmallMobile = windowWidth <= 480

  const load = async () => {
    try {
      setError('')
      const [teachersRes, classesRes, subjectsRes] = await Promise.all([
        api.get('/teachers/'),
        api.get('/schools/classes/'),
        api.get('/schools/subjects/')
      ])
      
      setTeachers(teachersRes.data.results || teachersRes.data)
      setClasses(classesRes.data.results || classesRes.data)
      setSubjects(subjectsRes.data.results || subjectsRes.data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load teachers')
    }
  }

  useEffect(() => { load() }, [])

  // Ensure latest classes are available when opening the modal
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/schools/classes/')
        setClasses(res.data.results || res.data)
      } catch {}
    }
    if (showCreate && !classes.length) fetchClasses()
  }, [showCreate])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    if (type === 'number') {
      setForm((f) => ({ ...f, [name]: parseInt(value) || 0 }))
    } else {
      setForm((f) => ({ ...f, [name]: value }))
    }
  }

  const handleSpecializationChange = (selectedIds) => {
    setForm((f) => ({ ...f, specializations: selectedIds }))
  }

  const resetForm = () => {
    setForm({
      email: '', 
      first_name: '', 
      last_name: '', 
      password: '', 
      password_confirm: '', 
      employee_id: '',
      phone_number: '',
      hire_date: '',
      qualification: '',
      experience_years: 0,
      emergency_contact: '',
      address: '',
      specializations: [],
      class_id: ''
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    
    if (form.password !== form.password_confirm) { 
      setError('Passwords do not match')
      return 
    }
    
    if (!form.hire_date) {
      setError('Hire date is required')
      return
    }
    
    setLoading(true)
    try {
      await api.post('/teachers/', form)
      resetForm()
      await load()
      setMessage('Teacher created successfully')
      setShowCreate(false)
    } catch (e2) {
      const data = e2?.response?.data
      if (typeof data === 'object' && data !== null) {
        const errors = Object.entries(data).map(([field, messages]) => 
          `${field}: ${Array.isArray(messages) ? messages[0] : messages}`
        ).join(', ')
        setError(errors)
      } else {
        setError('Failed to create teacher')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="container" 
      style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: isMobile ? '20px 12px' : isTablet ? '24px 16px' : '32px 20px',
        paddingTop: isMobile ? '90px' : '24px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        minHeight: '100vh',
        color: 'white',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Add mobile-specific style injection */}
      {isMobile && (
        <style>
          {`
            @media screen and (max-width: 768px) {
              .container { 
                padding: 20px 12px !important; 
                padding-top: 90px !important; 
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
                color: white !important;
              }
              .page-header { 
                flex-direction: column !important; 
                background: rgba(15, 23, 42, 0.8) !important;
                border-radius: 16px !important;
                padding: 20px 16px !important;
                gap: 16px !important;
              }
              .btn { 
                width: 100% !important; 
                min-height: 48px !important;
                font-size: 16px !important;
                margin-bottom: 12px !important;
              }
              table { display: none !important; }
            }
          `}
        </style>
      )}
      {/* Enhanced Header with Mobile-First Design */}
      <div className="page-header" style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(16px)',
        borderRadius: isMobile ? 16 : 20,
        padding: isMobile ? '20px 16px' : isTablet ? '24px 20px' : '28px 24px',
        marginBottom: isMobile ? 20 : 24,
        border: '1px solid rgba(34, 197, 94, 0.2)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 16 : 12
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 12 : 16
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: 12,
            padding: isMobile ? '12px' : '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(34, 197, 94, 0.4)'
          }}>
            <FaChalkboardTeacher size={isMobile ? 20 : 24} color="white" />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? 22 : isTablet ? 26 : 32,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #86efac, #22c55e)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2
            }}>Teachers</h1>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: isMobile ? 13 : 14,
              color: '#94a3b8',
              fontWeight: 500
            }}>
              {teachers.length} {teachers.length === 1 ? 'teacher' : 'teachers'} registered
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 8,
          width: isMobile ? '100%' : 'auto'
        }}>
          <button
            className="btn primary"
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: isMobile ? '14px 18px' : '12px 16px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontWeight: 600,
              fontSize: isMobile ? 14 : 15,
              minHeight: isMobile ? 48 : 44,
              justifyContent: 'center',
              width: isMobile ? '100%' : 'auto',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
            }}
          >
            <FaPlus size={isMobile ? 16 : 14} />
            New Teacher
          </button>
          <button
            className="btn"
            onClick={load}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: isMobile ? '14px 18px' : '12px 16px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 10,
              color: '#86efac',
              fontWeight: 600,
              fontSize: isMobile ? 14 : 15,
              minHeight: isMobile ? 48 : 44,
              justifyContent: 'center',
              width: isMobile ? '100%' : 'auto',
              transition: 'all 0.3s ease'
            }}
          >
            <FaSync size={isMobile ? 16 : 14} />
            Refresh
          </button>
        </div>
      </div>
      {/* Enhanced Alert Messages */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#fca5a5',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          ⚠️ {error}
        </div>
      )}
      {message && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#86efac',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          ✅ {message}
        </div>
      )}

      {/* Desktop Table View */}
      {!isMobile && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(71, 85, 105, 0.3)',
          marginBottom: 24,
          backdropFilter: 'blur(12px)'
        }}>
          <table className="table" style={{ margin: 0 }}>
            <thead style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
              <tr>
                <th style={{ padding: '16px 20px', color: 'white', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 13 }}>Email</th>
                <th style={{ padding: '16px 20px', color: 'white', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 13 }}>Name</th>
                <th style={{ padding: '16px 20px', color: 'white', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 13, textAlign: 'center' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(71, 85, 105, 0.3)' }}>
                  <td style={{ padding: '16px 20px', color: 'white' }}>{t.email}</td>
                  <td style={{ padding: '16px 20px', color: 'white', fontWeight: 500 }}>{t.first_name} {t.last_name}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {t.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!teachers.length && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
              👩‍🏫 No teachers registered yet.
            </div>
          )}
        </div>
      )}

      {/* Mobile Card View */}
      {isMobile && (
        <div style={{
          display: 'grid',
          gap: 16,
          marginTop: 20
        }}>
          {teachers.map(t => (
            <div
              key={t.id}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 16,
                padding: '20px 16px',
                border: '1px solid rgba(71, 85, 105, 0.3)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 12
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  borderRadius: 10,
                  padding: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaChalkboardTeacher size={16} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'white',
                    marginBottom: 4
                  }}>
                    {t.first_name} {t.last_name}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: 13,
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <FaEnvelope size={12} />
                    {t.email}
                  </p>
                </div>
                <span style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: 'white',
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {t.role}
                </span>
              </div>
            </div>
          ))}
          {!teachers.length && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 16,
              padding: '40px 20px',
              textAlign: 'center',
              color: '#64748b',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              backdropFilter: 'blur(12px)'
            }}>
              👩‍🏫 No teachers registered yet.
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="modal" onClick={()=>setShowCreate(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'center',
          padding: isMobile ? '0' : '16px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          overflow: 'hidden'
        }}>
          <div className="modal-content" onClick={(e)=>e.stopPropagation()} style={{
            width: isMobile ? '100vw' : '90%',
            height: isMobile ? '100vh' : 'auto',
            maxWidth: isMobile ? 'none' : '700px',
            maxHeight: isMobile ? '100vh' : '90vh',
            background: isMobile ? 'rgba(15, 23, 42, 1)' : 'rgba(15, 23, 42, 0.95)',
            border: isMobile ? 'none' : '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: isMobile ? 0 : 16,
            backdropFilter: 'blur(20px)',
            color: 'white',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isMobile ? '20px 20px 16px' : '20px 24px 16px',
              borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
              background: isMobile ? 'linear-gradient(135deg, rgba(22, 163, 74, 0.15), rgba(34, 197, 94, 0.1))' : 'linear-gradient(135deg, rgba(22, 163, 74, 0.1), rgba(34, 197, 94, 0.05))',
              backdropFilter: 'blur(8px)',
              position: isMobile ? 'sticky' : 'static',
              top: 0,
              zIndex: 10
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  borderRadius: 8,
                  padding: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaChalkboardTeacher size={16} color="white" />
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: isMobile ? 18 : 20,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #86efac, #22c55e)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Create New Teacher</h3>
              </div>
              <button 
                className="btn" 
                onClick={()=>setShowCreate(false)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '2px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  padding: isMobile ? '12px 14px' : '8px 12px',
                  borderRadius: 10,
                  fontSize: isMobile ? 18 : 16,
                  fontWeight: 700,
                  minHeight: isMobile ? 44 : 'auto',
                  minWidth: isMobile ? 44 : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Error and Success Messages */}
            {(error || message) && (
              <div style={{
                padding: isMobile ? '16px 20px' : '12px 24px',
                margin: 0,
                background: error 
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))' 
                  : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.1))',
                border: error 
                  ? '2px solid rgba(239, 68, 68, 0.3)' 
                  : '2px solid rgba(34, 197, 94, 0.3)',
                borderRadius: isMobile ? 10 : 8,
                marginBottom: isMobile ? 16 : 12,
                marginLeft: isMobile ? 20 : 24,
                marginRight: isMobile ? 20 : 24,
                fontSize: isMobile ? 15 : 14,
                fontWeight: 500,
                color: error ? '#fca5a5' : '#86efac'
              }}>
                {error || message}
              </div>
            )}
            
            <form onSubmit={handleCreate} style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              height: isMobile ? 'calc(100vh - 140px)' : 'auto',
              overflow: 'hidden'
            }}>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: isMobile ? '16px 20px' : '20px 24px',
                display: isMobile ? 'flex' : 'grid',
                flexDirection: isMobile ? 'column' : 'row',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? 16 : 20,
                alignContent: 'start',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(34, 197, 94, 0.3) transparent',
                scrollBehavior: 'smooth'
              }}>
                {/* Email Field */}
                <div className="field" style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: isMobile ? 12 : 8,
                    fontSize: isMobile ? 15 : 14,
                    fontWeight: 600,
                    color: '#e2e8f0',
                    letterSpacing: '0.025em'
                  }}>
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <FaEnvelope style={{
                      position: 'absolute',
                      left: isMobile ? 16 : 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontSize: isMobile ? 16 : 14,
                      zIndex: 2
                    }} />
                    <input 
                      name="email" 
                      type="email"
                      value={form.email} 
                      onChange={handleChange} 
                      required
                      placeholder="Enter email address"
                      style={{
                        width: '100%',
                        padding: isMobile ? '16px 16px 16px 48px' : '12px 12px 12px 42px',
                        fontSize: isMobile ? 16 : 15,
                        border: '2px solid rgba(71, 85, 105, 0.4)',
                        borderRadius: isMobile ? 12 : 8,
                        background: isMobile ? 'rgba(30, 41, 59, 0.9)' : 'rgba(30, 41, 59, 0.8)',
                        color: 'white',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        minHeight: isMobile ? '52px' : 'auto',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* First Name */}
                <div className="field">
                  <label style={{
                    display: 'block',
                    marginBottom: isMobile ? 12 : 8,
                    fontSize: isMobile ? 15 : 14,
                    fontWeight: 600,
                    color: '#e2e8f0',
                    letterSpacing: '0.025em'
                  }}>
                    First Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <FaUser style={{
                      position: 'absolute',
                      left: isMobile ? 16 : 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontSize: isMobile ? 16 : 14,
                      zIndex: 2
                    }} />
                    <input 
                      name="first_name" 
                      value={form.first_name} 
                      onChange={handleChange} 
                      required
                      placeholder="Enter first name"
                      style={{
                        width: '100%',
                        padding: isMobile ? '16px 16px 16px 48px' : '12px 12px 12px 42px',
                        fontSize: isMobile ? 16 : 15,
                        border: '2px solid rgba(71, 85, 105, 0.4)',
                        borderRadius: isMobile ? 12 : 8,
                        background: isMobile ? 'rgba(30, 41, 59, 0.9)' : 'rgba(30, 41, 59, 0.8)',
                        color: 'white',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        minHeight: isMobile ? '52px' : 'auto',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="field">
                  <label style={{
                    display: 'block',
                    marginBottom: isMobile ? 12 : 8,
                    fontSize: isMobile ? 15 : 14,
                    fontWeight: 600,
                    color: '#e2e8f0',
                    letterSpacing: '0.025em'
                  }}>
                    Last Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <FaUser style={{
                      position: 'absolute',
                      left: isMobile ? 16 : 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontSize: isMobile ? 16 : 14,
                      zIndex: 2
                    }} />
                    <input 
                      name="last_name" 
                      value={form.last_name} 
                      onChange={handleChange} 
                      required
                      placeholder="Enter last name"
                      style={{
                        width: '100%',
                        padding: isMobile ? '16px 16px 16px 48px' : '12px 12px 12px 42px',
                        fontSize: isMobile ? 16 : 15,
                        border: '2px solid rgba(71, 85, 105, 0.4)',
                        borderRadius: isMobile ? 12 : 8,
                        background: isMobile ? 'rgba(30, 41, 59, 0.9)' : 'rgba(30, 41, 59, 0.8)',
                        color: 'white',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        minHeight: isMobile ? '52px' : 'auto',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Class Assignment */}
                <div className="field" style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#d1d5db'
                  }}>
                    Assign Class (Optional)
                  </label>
                  <ScrollableSelect
                    name="class_id"
                    value={form.class_id}
                    onChange={(v)=>setForm(f=>({...f,class_id:v}))}
                    options={[{value:'',label:'None'}, ...classes.map(c=>({
                      value:String(c.id),
                      label:`${c.level_display || c.level}${c.section?` ${c.section}`:''}`
                    }))]}
                    sizeThreshold={8}
                    style={{
                      height: isMobile ? 48 : 44
                    }}
                  />
                </div>

                {/* Password */}
                <div className="field">
                  <label style={{
                    display: 'block',
                    marginBottom: isMobile ? 12 : 8,
                    fontSize: isMobile ? 15 : 14,
                    fontWeight: 600,
                    color: '#e2e8f0',
                    letterSpacing: '0.025em'
                  }}>
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <FaLock style={{
                      position: 'absolute',
                      left: isMobile ? 16 : 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontSize: isMobile ? 16 : 14,
                      zIndex: 2
                    }} />
                    <input 
                      type="password" 
                      name="password" 
                      value={form.password} 
                      onChange={handleChange} 
                      required
                      placeholder="Create password"
                      style={{
                        width: '100%',
                        padding: isMobile ? '16px 16px 16px 48px' : '12px 12px 12px 42px',
                        fontSize: isMobile ? 16 : 15,
                        border: '2px solid rgba(71, 85, 105, 0.4)',
                        borderRadius: isMobile ? 12 : 8,
                        background: isMobile ? 'rgba(30, 41, 59, 0.9)' : 'rgba(30, 41, 59, 0.8)',
                        color: 'white',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        minHeight: isMobile ? '52px' : 'auto',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="field">
                  <label style={{
                    display: 'block',
                    marginBottom: isMobile ? 12 : 8,
                    fontSize: isMobile ? 15 : 14,
                    fontWeight: 600,
                    color: '#e2e8f0',
                    letterSpacing: '0.025em'
                  }}>
                    Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <FaLock style={{
                      position: 'absolute',
                      left: isMobile ? 16 : 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontSize: isMobile ? 16 : 14,
                      zIndex: 2
                    }} />
                    <input 
                      type="password" 
                      name="password_confirm" 
                      value={form.password_confirm} 
                      onChange={handleChange} 
                      required
                      placeholder="Confirm password"
                      style={{
                        width: '100%',
                        padding: isMobile ? '16px 16px 16px 48px' : '12px 12px 12px 42px',
                        fontSize: isMobile ? 16 : 15,
                        border: '2px solid rgba(71, 85, 105, 0.4)',
                        borderRadius: isMobile ? 12 : 8,
                        background: isMobile ? 'rgba(30, 41, 59, 0.9)' : 'rgba(30, 41, 59, 0.8)',
                        color: 'white',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        minHeight: isMobile ? '52px' : 'auto',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-actions" style={{
                display: 'flex',
                flexDirection: isMobile ? 'column-reverse' : 'row',
                gap: isMobile ? 16 : 8,
                padding: isMobile ? '20px 20px 24px' : '16px 24px 20px',
                borderTop: '2px solid rgba(71, 85, 105, 0.3)',
                background: isMobile 
                  ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8))' 
                  : 'rgba(15, 23, 42, 0.3)',
                justifyContent: 'flex-end',
                backdropFilter: 'blur(8px)',
                position: isMobile ? 'sticky' : 'static',
                bottom: 0,
                zIndex: 10
              }}>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={()=>setShowCreate(false)}
                  style={{
                    padding: isMobile ? '16px 20px' : '10px 16px',
                    background: 'rgba(107, 114, 128, 0.15)',
                    border: '2px solid rgba(107, 114, 128, 0.4)',
                    borderRadius: isMobile ? 12 : 8,
                    color: '#cbd5e1',
                    fontWeight: 600,
                    fontSize: isMobile ? 15 : 15,
                    minHeight: isMobile ? 54 : 40,
                    width: isMobile ? '100%' : 'auto',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cancel
                </button>
                <button 
                  disabled={loading} 
                  className="btn primary" 
                  type="submit"
                  style={{
                    padding: isMobile ? '16px 22px' : '10px 20px',
                    background: loading 
                      ? 'rgba(107, 114, 128, 0.5)' 
                      : 'linear-gradient(135deg, #22c55e, #16a34a)',
                    border: 'none',
                    borderRadius: isMobile ? 12 : 8,
                    color: 'white',
                    fontWeight: 700,
                    fontSize: isMobile ? 15 : 15,
                    minHeight: isMobile ? 54 : 40,
                    width: isMobile ? '100%' : 'auto',
                    transition: 'all 0.3s ease',
                    boxShadow: loading ? 'none' : '0 6px 16px rgba(34, 197, 94, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaSave size={14} />
                      Create Teacher
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
