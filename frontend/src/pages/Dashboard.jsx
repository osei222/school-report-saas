import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../state/AuthContext'
import { 
  FaLayerGroup, FaGraduationCap, FaBookOpen, FaChartLine, FaArrowRight,
  FaUserGraduate, FaChalkboardTeacher, FaUsers, FaClipboardList, FaCalendarAlt,
  FaChartBar, FaTasks, FaFileAlt
} from 'react-icons/fa'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [teacherData, setTeacherData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const dashboardRes = await api.get('/schools/dashboard/')
        if (mounted) setData(dashboardRes.data)

        if (user?.role === 'TEACHER') {
          try {
            const [assignmentsRes, studentsRes] = await Promise.all([
              api.get('/teachers/assignments/'),
              api.get('/students/')
            ])
            
            console.log('Assignments response:', assignmentsRes.data)
            console.log('Students response:', studentsRes.data)
            
            const assignments = assignmentsRes.data.results || assignmentsRes.data || []
            const allStudents = studentsRes.data.results || studentsRes.data || []

            console.log('Processed assignments:', assignments)
            console.log('Processed students:', allStudents)

            const assignedClasses = [...new Set(assignments.map(a => a.class?.id).filter(Boolean))]
            const assignedSubjects = [...new Set(assignments.map(a => a.subject?.id).filter(Boolean))]
            const isFormTeacher = assignments.some(a => a.type === 'form_class')
            const formClass = assignments.find(a => a.type === 'form_class')
            const myStudents = formClass 
              ? allStudents.filter(s => s.class_instance === formClass.class?.id)
              : []

            if (mounted) setTeacherData({
              assignments,
              assignedClasses: assignedClasses.length,
              assignedSubjects: assignedSubjects.length,
              isFormTeacher,
              formClass: formClass?.class,
              myStudents: myStudents.length,
              totalAssignments: assignments.length
            })
          } catch (teacherError) {
            console.error('Teacher data error:', teacherError)
            if (mounted) setError(`Teacher data: ${teacherError?.response?.data?.detail || teacherError.message}`)
          }
        }
      } catch (e) {
        if (mounted) setError(e?.response?.data?.detail || 'Failed to load dashboard')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [user])

  if (loading) {
    return (
      <>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: 60, 
              height: 60, 
              border: '4px solid #e5e7eb', 
              borderTop: '4px solid #3b82f6', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#6b7280', fontSize: 16 }}>Loading dashboard...</p>
          </div>
        </div>
      </>
    )
  }

  if (user?.role === 'TEACHER') {
    return (
      <div className="container" style={{ 
        maxWidth: 1400, 
        margin: '0 auto',
        paddingTop: window.innerWidth <= 768 ? '80px' : '20px' // Add space for mobile navbar
      }}>
        {/* Teacher Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #5eead4 100%)',
          borderRadius: 20,
          padding: window.innerWidth <= 640 ? '28px 20px' : '40px 48px',
          marginBottom: 32,
          boxShadow: '0 20px 60px -15px rgba(20, 184, 166, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            filter: 'blur(40px)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
            filter: 'blur(30px)'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 20, flexDirection: window.innerWidth <= 640 ? 'column' : 'row', alignItems: window.innerWidth <= 640 ? 'flex-start' : 'center' }}>
            <div style={{
              width: 80,
              height: 80,
              background: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(10px)',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <FaGraduationCap style={{ fontSize: 36, color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: window.innerWidth <= 640 ? 28 : 36, 
                fontWeight: 800, 
                color: 'white',
                letterSpacing: '-0.02em'
              }}>
                Welcome back, {user.first_name}!
              </h1>
              <p style={{ 
                margin: '12px 0 0', 
                fontSize: 16, 
                color: 'rgba(255,255,255,0.95)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap'
              }}>
                {teacherData?.isFormTeacher ? (
                  <>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      padding: '4px 12px', 
                      borderRadius: 20,
                      fontSize: 14,
                      fontWeight: 600
                    }}>
                      🏫 Form Teacher
                    </span>
                    <span>{teacherData.formClass?.name}</span>
                  </>
                ) : (
                  <>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      padding: '4px 12px', 
                      borderRadius: 20,
                      fontSize: 14,
                      fontWeight: 600
                    }}>
                      📚 Subject Teacher
                    </span>
                    <span>{teacherData?.assignedSubjects} subject(s)</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: 16,
            borderRadius: 12,
            marginBottom: 24,
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        {teacherData && teacherData.assignments && (
          <>
            {/* Stats Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth <= 640 ? '1fr' : window.innerWidth <= 968 ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: 20,
              marginBottom: 32
            }}>
              {teacherData.isFormTeacher && (
                <div style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.3s ease',
                  cursor: 'default'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(59,130,246,0.15)'
                    e.currentTarget.style.transform = 'translateY(-4px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaGraduationCap style={{ fontSize: 22, color: 'white' }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Form Students</p>
                      <h3 style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 800, color: '#111827' }}>{teacherData.myStudents || 0}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                background: 'white',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(139,92,246,0.15)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FaLayerGroup style={{ fontSize: 22, color: 'white' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classes</p>
                    <h3 style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 800, color: '#111827' }}>{teacherData.assignedClasses || 0}</h3>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(236,72,153,0.15)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #ec4899, #db2777)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FaBookOpen style={{ fontSize: 22, color: 'white' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subjects</p>
                    <h3 style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 800, color: '#111827' }}>{teacherData.assignedSubjects || 0}</h3>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(245,158,11,0.15)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FaTasks style={{ fontSize: 22, color: 'white' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignments</p>
                    <h3 style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 800, color: '#111827' }}>{teacherData.totalAssignments || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Show message if no teacher data */}
        {!teacherData && !loading && (
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 32,
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🏫</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: '#111827' }}>
              Setting up your dashboard...
            </h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
              Loading your teaching assignments and class information.
            </p>
          </div>
        )}

        {teacherData && (
          <>
            {/* Teaching Load Section */}
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: window.innerWidth <= 640 ? 20 : 32,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              marginBottom: 32
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: 22, 
                  fontWeight: 800, 
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <span style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18
                  }}>
                    📊
                  </span>
                  My Teaching Load
                </h2>
                <span style={{
                  background: '#f3f4f6',
                  color: '#6b7280',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700
                }}>
                  {teacherData.assignments?.length || 0} Total
                </span>
              </div>
              
              {teacherData.assignments && teacherData.assignments.length > 0 ? (
                <div style={{ display: 'grid', gap: 16 }}>
                  {teacherData.assignments.map((assignment, idx) => (
                    <div key={idx} style={{
                      background: assignment.type === 'form_class' ? '#fef3c7' : '#dbeafe',
                      border: `2px solid ${assignment.type === 'form_class' ? '#fbbf24' : '#60a5fa'}`,
                      borderRadius: 16,
                      padding: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 16,
                      transition: 'all 0.3s ease'
                    }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateX(8px)'
                        e.currentTarget.style.boxShadow = assignment.type === 'form_class' ? '0 8px 30px rgba(251, 191, 36, 0.3)' : '0 8px 30px rgba(96, 165, 250, 0.3)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateX(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 200 }}>
                        <div style={{
                          width: 56,
                          height: 56,
                          borderRadius: 14,
                          background: assignment.type === 'form_class' ? 
                            'linear-gradient(135deg, #fbbf24, #f59e0b)' : 
                            'linear-gradient(135deg, #60a5fa, #3b82f6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 24,
                          fontWeight: 800,
                          boxShadow: assignment.type === 'form_class' ? 
                            '0 4px 14px rgba(251, 191, 36, 0.4)' : 
                            '0 4px 14px rgba(59, 130, 246, 0.4)'
                        }}>
                          {(assignment.class?.name || 'U').charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 18, color: '#111827', marginBottom: 4 }}>
                            {assignment.class?.name || 'Unknown Class'}
                          </div>
                          <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>
                            {assignment.type === 'form_class' ? '🏫 Form Teacher' : `📚 ${assignment.subject?.name || 'Subject Teacher'}`}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        background: assignment.type === 'form_class' ? 
                          'linear-gradient(135deg, #fbbf24, #f59e0b)' : 
                          'linear-gradient(135deg, #60a5fa, #3b82f6)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        boxShadow: assignment.type === 'form_class' ? 
                          '0 4px 14px rgba(251, 191, 36, 0.3)' : 
                          '0 4px 14px rgba(59, 130, 246, 0.3)'
                      }}>
                        {assignment.type === 'form_class' ? 'Primary' : 'Subject'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: 48,
                  background: '#f9fafb',
                  borderRadius: 16,
                  border: '2px dashed #d1d5db'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: 15, fontWeight: 600 }}>
                    No assignments yet. Contact your administrator.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: window.innerWidth <= 640 ? 20 : 32,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ 
                margin: '0 0 24px 0', 
                fontSize: 22, 
                fontWeight: 800, 
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <span style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18
                }}>
                  ⚡
                </span>
                Quick Actions
              </h2>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: window.innerWidth <= 640 ? '1fr' : '1fr 1fr' }}>
                <button
                  onClick={() => navigate('/classes')}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 14,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 16,
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <FaLayerGroup style={{ fontSize: 24 }} />
                    <div style={{ textAlign: 'left' }}>
                      <div>Select Class</div>
                      <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 500 }}>Choose what to work on</div>
                    </div>
                  </div>
                  <FaArrowRight style={{ fontSize: 18 }} />
                </button>
                <button
                  onClick={() => navigate('/enter-scores')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 14,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 16,
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <FaChartBar style={{ fontSize: 24 }} />
                    <div style={{ textAlign: 'left' }}>
                      <div>Enter Scores</div>
                      <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 500 }}>Direct entry</div>
                    </div>
                  </div>
                  <FaArrowRight style={{ fontSize: 18 }} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  const isMobile = window.innerWidth <= 768
  const isTablet = window.innerWidth <= 1024

  return (
    <div style={{ 
      maxWidth: 1400, 
      margin: '0 auto',
      padding: isMobile ? '0 16px' : isTablet ? '0 20px' : '0 24px',
      paddingTop: isMobile ? '80px' : '20px' // Add space for mobile navbar
    }}>
      {/* Admin Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #93c5fd 100%)',
        borderRadius: isMobile ? 16 : 20,
        padding: isMobile ? '24px 20px' : isTablet ? '32px 28px' : '40px 48px',
        marginBottom: isMobile ? 20 : 32,
        boxShadow: '0 20px 60px -15px rgba(59, 130, 246, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements - scaled for mobile */}
        <div style={{
          position: 'absolute',
          top: isMobile ? -20 : -40,
          right: isMobile ? -20 : -40,
          width: isMobile ? 120 : 180,
          height: isMobile ? 120 : 180,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: isMobile ? -10 : -20,
          left: isMobile ? -10 : -20,
          width: isMobile ? 80 : 120,
          height: isMobile ? 80 : 120,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          filter: 'blur(30px)'
        }} />
        
        <div style={{ 
          position: 'relative', 
          zIndex: 1, 
          display: 'flex', 
          gap: isMobile ? 16 : 20, 
          flexDirection: isMobile ? 'column' : 'row', 
          alignItems: isMobile ? 'flex-start' : 'center',
          textAlign: isMobile ? 'left' : 'left'
        }}>
          <div style={{
            width: isMobile ? 64 : 80,
            height: isMobile ? 64 : 80,
            background: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(10px)',
            borderRadius: isMobile ? 16 : 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            flexShrink: 0
          }}>
            <FaUsers style={{ fontSize: isMobile ? 28 : 36, color: 'white' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: isMobile ? 24 : isTablet ? 32 : 36, 
              fontWeight: 800, 
              color: 'white',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              Welcome, {user.first_name}!
            </h1>
            <div style={{ 
              margin: isMobile ? '8px 0 0' : '12px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                background: 'rgba(255,255,255,0.2)', 
                padding: isMobile ? '6px 12px' : '8px 16px', 
                borderRadius: 20,
                fontSize: isMobile ? 12 : 14,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.95)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(10px)'
              }}>
                {user.role === 'SCHOOL_ADMIN' ? '🏫 School Administrator' : '👔 Principal'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: 16,
          borderRadius: 12,
          marginBottom: 24,
          fontSize: 14
        }}>
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Overview Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 16 : 20,
            marginBottom: isMobile ? 20 : 32
          }}>
            <div style={{
              background: 'white',
              borderRadius: isMobile ? 12 : 16,
              padding: isMobile ? '20px 16px' : isTablet ? '20px' : '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'default'
            }}
              onMouseEnter={e => {
                if (!isMobile) {
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(59,130,246,0.15)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }
              }}
              onMouseLeave={e => {
                if (!isMobile) {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: isMobile ? 'flex-start' : 'center', 
                gap: isMobile ? 12 : 16, 
                marginBottom: isMobile ? 8 : 12,
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <div style={{
                  width: isMobile ? 44 : 48,
                  height: isMobile ? 44 : 48,
                  borderRadius: isMobile ? 10 : 12,
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: isMobile ? 'center' : 'flex-start'
                }}>
                  <FaUserGraduate style={{ fontSize: isMobile ? 18 : 22, color: 'white' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: isMobile ? 11 : 13, 
                    color: '#6b7280', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em' 
                  }}>Total Students</p>
                  <h3 style={{ 
                    margin: '4px 0 0', 
                    fontSize: isMobile ? 24 : 32, 
                    fontWeight: 800, 
                    color: '#111827',
                    lineHeight: 1.2
                  }}>{data.counts?.students || 0}</h3>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: isMobile ? 12 : 16,
              padding: isMobile ? '20px 16px' : isTablet ? '20px' : '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'default'
            }}
              onMouseEnter={e => {
                if (!isMobile) {
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(16,185,129,0.15)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }
              }}
              onMouseLeave={e => {
                if (!isMobile) {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: isMobile ? 'flex-start' : 'center', 
                gap: isMobile ? 12 : 16, 
                marginBottom: isMobile ? 8 : 12,
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <div style={{
                  width: isMobile ? 44 : 48,
                  height: isMobile ? 44 : 48,
                  borderRadius: isMobile ? 10 : 12,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: isMobile ? 'center' : 'flex-start'
                }}>
                  <FaChalkboardTeacher style={{ fontSize: isMobile ? 18 : 22, color: 'white' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: isMobile ? 11 : 13, 
                    color: '#6b7280', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em' 
                  }}>Teachers</p>
                  <h3 style={{ 
                    margin: '4px 0 0', 
                    fontSize: isMobile ? 24 : 32, 
                    fontWeight: 800, 
                    color: '#111827',
                    lineHeight: 1.2
                  }}>{data.counts?.teachers || 0}</h3>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: isMobile ? 12 : 16,
              padding: isMobile ? '20px 16px' : isTablet ? '20px' : '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'default'
            }}
              onMouseEnter={e => {
                if (!isMobile) {
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(139,92,246,0.15)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }
              }}
              onMouseLeave={e => {
                if (!isMobile) {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: isMobile ? 'flex-start' : 'center', 
                gap: isMobile ? 12 : 16, 
                marginBottom: isMobile ? 8 : 12,
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <div style={{
                  width: isMobile ? 44 : 48,
                  height: isMobile ? 44 : 48,
                  borderRadius: isMobile ? 10 : 12,
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: isMobile ? 'center' : 'flex-start'
                }}>
                  <FaLayerGroup style={{ fontSize: isMobile ? 18 : 22, color: 'white' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: isMobile ? 11 : 13, 
                    color: '#6b7280', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em' 
                  }}>Classes</p>
                  <h3 style={{ 
                    margin: '4px 0 0', 
                    fontSize: isMobile ? 24 : 32, 
                    fontWeight: 800, 
                    color: '#111827',
                    lineHeight: 1.2
                  }}>{data.counts?.classes || 0}</h3>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: isMobile ? 12 : 16,
              padding: isMobile ? '20px 16px' : isTablet ? '20px' : '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.3s ease',
              cursor: 'default'
            }}
              onMouseEnter={e => {
                if (!isMobile) {
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(236,72,153,0.15)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }
              }}
              onMouseLeave={e => {
                if (!isMobile) {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: isMobile ? 'flex-start' : 'center', 
                gap: isMobile ? 12 : 16, 
                marginBottom: isMobile ? 8 : 12,
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <div style={{
                  width: isMobile ? 44 : 48,
                  height: isMobile ? 44 : 48,
                  borderRadius: isMobile ? 10 : 12,
                  background: 'linear-gradient(135deg, #ec4899, #db2777)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: isMobile ? 'center' : 'flex-start'
                }}>
                  <FaBookOpen style={{ fontSize: isMobile ? 18 : 22, color: 'white' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: isMobile ? 11 : 13, 
                    color: '#6b7280', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em' 
                  }}>Subjects</p>
                  <h3 style={{ 
                    margin: '4px 0 0', 
                    fontSize: isMobile ? 24 : 32, 
                    fontWeight: 800, 
                    color: '#111827',
                    lineHeight: 1.2
                  }}>{data.counts?.subjects || 0}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* School Information & Analytics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
            gap: isMobile ? 16 : 24,
            marginBottom: isMobile ? 20 : 32
          }}>
            {/* School Info Card */}
            <div style={{
              background: 'white',
              borderRadius: isMobile ? 16 : 20,
              padding: isMobile ? '20px 16px' : isTablet ? '24px' : '32px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: isMobile ? 16 : 24,
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 12 : 0,
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: isMobile ? 18 : 22, 
                  fontWeight: 800, 
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 8 : 12,
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <span style={{
                    width: isMobile ? 36 : 40,
                    height: isMobile ? 36 : 40,
                    borderRadius: isMobile ? 8 : 10,
                    background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? 16 : 18
                  }}>
                    🏫
                  </span>
                  School Information
                </h2>
              </div>
              <div style={{ display: 'grid', gap: isMobile ? 12 : 16 }}>
                <div style={{ 
                  background: '#f8fafc', 
                  padding: isMobile ? '14px 12px' : '16px', 
                  borderRadius: isMobile ? 10 : 12,
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ 
                    fontSize: isMobile ? 11 : 13, 
                    color: '#64748b', 
                    fontWeight: 600, 
                    marginBottom: 4, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em' 
                  }}>School Name</div>
                  <div style={{ 
                    fontSize: isMobile ? 16 : 18, 
                    fontWeight: 800, 
                    color: '#0f172a',
                    wordBreak: 'break-word'
                  }}>{data.school?.name}</div>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gap: isMobile ? 8 : 12, 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
                }}>
                  <div style={{ 
                    background: '#f0f9ff', 
                    padding: isMobile ? '14px 12px' : '16px', 
                    borderRadius: isMobile ? 10 : 12,
                    border: '1px solid #bae6fd'
                  }}>
                    <div style={{ 
                      fontSize: isMobile ? 10 : 12, 
                      color: '#0284c7', 
                      fontWeight: 600, 
                      marginBottom: 4, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em' 
                    }}>Academic Year</div>
                    <div style={{ 
                      fontSize: isMobile ? 14 : 16, 
                      fontWeight: 800, 
                      color: '#0c4a6e' 
                    }}>{data.current?.academic_year || 'Not Set'}</div>
                  </div>
                  <div style={{ 
                    background: '#f0fdf4', 
                    padding: isMobile ? '14px 12px' : '16px', 
                    borderRadius: isMobile ? 10 : 12,
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ 
                      fontSize: isMobile ? 10 : 12, 
                      color: '#059669', 
                      fontWeight: 600, 
                      marginBottom: 4, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em' 
                    }}>Current Term</div>
                    <div style={{ 
                      fontSize: isMobile ? 14 : 16, 
                      fontWeight: 800, 
                      color: '#064e3b' 
                    }}>{data.current?.term || 'Not Set'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Analytics */}
            <div style={{
              background: 'white',
              borderRadius: isMobile ? 16 : 20,
              padding: isMobile ? '20px 16px' : isTablet ? '24px' : '32px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                margin: isMobile ? '0 0 16px 0' : '0 0 20px 0', 
                fontSize: isMobile ? 16 : 18, 
                fontWeight: 800, 
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 6 : 8,
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                📊 Quick Stats
              </h3>
              <div style={{ display: 'grid', gap: isMobile ? 12 : 16 }}>
                <div style={{ 
                  textAlign: 'center', 
                  padding: isMobile ? '14px 12px' : '16px', 
                  background: '#fef3c7', 
                  borderRadius: isMobile ? 10 : 12,
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}>
                  <div style={{ 
                    fontSize: isMobile ? 20 : 24, 
                    fontWeight: 800, 
                    color: '#92400e' 
                  }}>
                    {Math.round(((data.counts?.students || 0) / (data.counts?.teachers || 1)) * 10) / 10}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? 10 : 12, 
                    color: '#92400e', 
                    fontWeight: 600 
                  }}>Student-Teacher Ratio</div>
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  padding: isMobile ? '14px 12px' : '16px', 
                  background: '#e0f2fe', 
                  borderRadius: isMobile ? 10 : 12,
                  border: '1px solid rgba(6, 182, 212, 0.3)'
                }}>
                  <div style={{ 
                    fontSize: isMobile ? 20 : 24, 
                    fontWeight: 800, 
                    color: '#0e7490' 
                  }}>
                    {Math.round(((data.counts?.students || 0) / (data.counts?.classes || 1)) * 10) / 10}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? 10 : 12, 
                    color: '#0e7490', 
                    fontWeight: 600 
                  }}>Students per Class</div>
                </div>
              </div>
            </div>
          </div>

          {/* Management Actions */}
          <div style={{
            background: 'white',
            borderRadius: isMobile ? 16 : 20,
            padding: isMobile ? '20px 16px' : isTablet ? '24px' : '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ 
              margin: isMobile ? '0 0 16px 0' : '0 0 24px 0', 
              fontSize: isMobile ? 18 : 22, 
              fontWeight: 800, 
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 8 : 12,
              justifyContent: isMobile ? 'center' : 'flex-start',
              flexDirection: isMobile ? 'column' : 'row',
              textAlign: isMobile ? 'center' : 'left'
            }}>
              <span style={{
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                borderRadius: isMobile ? 8 : 10,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? 16 : 18
              }}>
                ⚡
              </span>
              Management Center
            </h2>
            <div style={{ 
              display: 'grid', 
              gap: isMobile ? 12 : 16, 
              gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? '1fr 1fr' : 'repeat(4, 1fr)'
            }}>
              <button
                onClick={() => navigate('/students')}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  border: 'none',
                  borderRadius: isMobile ? 12 : 14,
                  padding: isMobile ? '16px 12px' : '20px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: isMobile ? 8 : 12,
                  fontSize: isMobile ? 12 : 14,
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.3s ease',
                  minHeight: isMobile ? '80px' : 'auto',
                  aspectRatio: isMobile ? '1' : 'auto'
                }}
                onMouseEnter={e => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)'
                  }
                }}
              >
                <FaUserGraduate style={{ fontSize: isMobile ? 20 : 24 }} />
                <span style={{ fontSize: isMobile ? 11 : 14 }}>Students</span>
              </button>

              <button
                onClick={() => navigate('/teachers')}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: isMobile ? 12 : 14,
                  padding: isMobile ? '16px 12px' : '20px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: isMobile ? 8 : 12,
                  fontSize: isMobile ? 12 : 14,
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.3s ease',
                  minHeight: isMobile ? '80px' : 'auto',
                  aspectRatio: isMobile ? '1' : 'auto'
                }}
                onMouseEnter={e => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }
                }}
              >
                <FaChalkboardTeacher style={{ fontSize: isMobile ? 20 : 24 }} />
                <span style={{ fontSize: isMobile ? 11 : 14 }}>Teachers</span>
              </button>

              <button
                onClick={() => navigate('/classes')}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: isMobile ? 12 : 14,
                  padding: isMobile ? '16px 12px' : '20px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: isMobile ? 8 : 12,
                  fontSize: isMobile ? 12 : 14,
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                  transition: 'all 0.3s ease',
                  minHeight: isMobile ? '80px' : 'auto',
                  aspectRatio: isMobile ? '1' : 'auto'
                }}
                onMouseEnter={e => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.4)'
                  }
                }}
              >
                <FaLayerGroup style={{ fontSize: isMobile ? 20 : 24 }} />
                <span style={{ fontSize: isMobile ? 11 : 14 }}>Classes</span>
              </button>

              <button
                onClick={() => navigate('/reports')}
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #db2777)',
                  color: 'white',
                  border: 'none',
                  borderRadius: isMobile ? 12 : 14,
                  padding: isMobile ? '16px 12px' : '20px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: isMobile ? 8 : 12,
                  fontSize: isMobile ? 12 : 14,
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)',
                  transition: 'all 0.3s ease',
                  minHeight: isMobile ? '80px' : 'auto',
                  aspectRatio: isMobile ? '1' : 'auto'
                }}
                onMouseEnter={e => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(236, 72, 153, 0.5)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(236, 72, 153, 0.4)'
                  }
                }}
              >
                <FaFileAlt style={{ fontSize: isMobile ? 20 : 24 }} />
                <span style={{ fontSize: isMobile ? 11 : 14 }}>Reports</span>
              </button>
            </div>
          </div>


        </>
      )}
    </div>
  )
}