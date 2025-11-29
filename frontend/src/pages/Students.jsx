import { useEffect, useState, useCallback, useMemo } from 'react'
import api from '../utils/api'
import { FaUserGraduate, FaPlus, FaUpload, FaSync, FaSearch, FaTimes, FaSave, FaUser } from 'react-icons/fa'
import { useAuth } from '../state/AuthContext'
import ScrollableSelect from '../components/ScrollableSelect'
import ImageCaptureInput from '../components/ImageCaptureInput'

export default function Students() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [error, setError] = useState(null)
  const [classes, setClasses] = useState([])
  const [classFilter, setClassFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [bulkMessage, setBulkMessage] = useState('')
  const [bulkFile, setBulkFile] = useState(null)
  const [addForm, setAddForm] = useState({
    student_id: '', first_name: '', last_name: '', other_names: '', gender: 'M', date_of_birth: '',
    current_class: '', guardian_name: '', guardian_phone: '', guardian_email: '', guardian_address: '',
    admission_date: '', photo: null
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Responsive design constants
  const isMobile = window.innerWidth <= 768
  const isTablet = window.innerWidth <= 1024
  const isSmallMobile = window.innerWidth <= 480

  // Enhanced mobile keyboard handling
  useEffect(() => {
    if (showAdd && window.innerWidth <= 768) {
      // Prevent background scroll
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      // Handle viewport height changes (keyboard appearance)
      const handleResize = () => {
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
      }
      
      handleResize()
      window.addEventListener('resize', handleResize)
      window.addEventListener('orientationchange', handleResize)
      
      return () => {
        // Restore scroll position
        const scrollY = document.body.style.top
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
        
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleResize)
      }
    }
  }, [showAdd])

  const teacherClasses = useMemo(() => {
    if (user?.role !== 'TEACHER') return []
    return (classes || []).filter(c => String(c.class_teacher) === String(user.id))
  }, [classes, user])

  // Auto-fill defaults for new form
  const initializeForm = () => {
    const today = new Date().toISOString().split('T')[0]
    const teacherClassId = user?.role === 'TEACHER' && teacherClasses.length === 1 
      ? String(teacherClasses[0].id) 
      : ''
    
    // Generate suggested student ID
    const currentYear = new Date().getFullYear()
    const classLevel = teacherClasses.length === 1 ? teacherClasses[0].level : ''
    const nextNumber = (students.length + 1).toString().padStart(3, '0')
    const suggestedId = `${currentYear}${classLevel}${nextNumber}`
    
    setAddForm({
      student_id: suggestedId, first_name: '', last_name: '', other_names: '', gender: 'M', 
      date_of_birth: '', current_class: teacherClassId, guardian_name: '', 
      guardian_phone: '', guardian_email: '', guardian_address: '', 
      admission_date: today, photo: null
    })
    setFormErrors({})
    setSubmitting(false)
  }

  // Validation helper
  const validateField = (name, value) => {
    const errors = { ...formErrors }
    
    switch (name) {
      case 'student_id':
        if (!value.trim()) errors.student_id = 'Student ID is required'
        else delete errors.student_id
        break
      case 'first_name':
        if (!value.trim()) errors.first_name = 'First name is required'
        else delete errors.first_name
        break
      case 'last_name':
        if (!value.trim()) errors.last_name = 'Last name is required'
        else delete errors.last_name
        break
      case 'date_of_birth':
        if (!value) errors.date_of_birth = 'Date of birth is required'
        else delete errors.date_of_birth
        break
      case 'guardian_name':
        if (!value.trim()) errors.guardian_name = 'Guardian name is required'
        else delete errors.guardian_name
        break
      case 'guardian_phone':
        if (!value.trim()) errors.guardian_phone = 'Guardian phone is required'
        else delete errors.guardian_phone
        break
      case 'guardian_address':
        if (!value.trim()) errors.guardian_address = 'Guardian address is required'
        else delete errors.guardian_address
        break
      case 'admission_date':
        if (!value) errors.admission_date = 'Admission date is required'
        else delete errors.admission_date
        break
      case 'guardian_email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.guardian_email = 'Please enter a valid email address'
        } else {
          delete errors.guardian_email
        }
        break
    }
    
    setFormErrors(errors)
  }

  const load = useCallback(async () => {
    try {
      setError(null)
      const [studRes, classRes] = await Promise.all([
        api.get(classFilter ? `/students/?class_id=${classFilter}` : '/students/'),
        api.get('/schools/classes/')
      ])
      const data = studRes.data.results || studRes.data
      const cls = classRes.data.results || classRes.data
      setStudents(data)
      setFiltered(data)
      setClasses(cls)
      if (user?.role === 'TEACHER') {
        const mine = (cls || []).find(c => String(c.class_teacher) === String(user.id))
        if (mine && String(classFilter) !== String(mine.id)) {
          setClassFilter(String(mine.id))
        }
      }
    } catch (e) {
      setError(e.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [classFilter, user])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!query) { setFiltered(students); return }
    const q = query.toLowerCase()
    setFiltered(students.filter(s => (
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.student_id || '').toLowerCase().includes(q) ||
      (s.class_name || '').toLowerCase().includes(q)
    )))
  }, [query, students])

  if (loading) return <div className="container"><p>Loading…</p></div>

  const openAdd = () => {
    setError('') // Clear any previous errors
    if (user?.role === 'TEACHER') {
      if (teacherClasses.length === 1) {
        initializeForm()
        setShowAdd(true)
        return
      }
      if (teacherClasses.length === 0) {
        alert('You are not assigned as class teacher to any class yet.')
        return
      }
      // multiple classes – require explicit selection
      setShowAdd(true)
      return
    }
    setShowAdd(true)
  }

  return (
    <div className="container" style={{
      maxWidth: 1400,
      margin: '0 auto',
      padding: window.innerWidth <= 768 ? '20px 12px' : '24px 20px',
      paddingTop: window.innerWidth <= 768 ? '100px' : '24px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div className="mobile-card" style={{ 
        marginBottom: '20px',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(16px)',
        borderRadius: window.innerWidth <= 768 ? 16 : 20,
        padding: window.innerWidth <= 768 ? '20px 16px' : '24px 20px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="page-header" style={{ 
          marginBottom: 0,
          display: 'flex',
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
          alignItems: window.innerWidth <= 768 ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: window.innerWidth <= 768 ? 16 : 12
        }}>
          <h1 style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: window.innerWidth <= 768 ? 12 : 16, 
            fontSize: window.innerWidth <= 640 ? '20px' : window.innerWidth <= 768 ? '24px' : '28px',
            margin: 0,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              borderRadius: 12,
              padding: window.innerWidth <= 768 ? '10px' : '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)'
            }}>
              <FaUserGraduate size={window.innerWidth <= 768 ? 18 : 22} color="white" />
            </div>
            Students
            <div style={{
              fontSize: window.innerWidth <= 768 ? '12px' : '14px',
              color: '#94a3b8',
              fontWeight: 500,
              marginLeft: window.innerWidth <= 768 ? 0 : 8
            }}>
              ({filtered.length} {filtered.length === 1 ? 'student' : 'students'})
            </div>
          </h1>
          <div className="actions" style={{ 
            gap: window.innerWidth <= 640 ? '12px' : '8px',
            display: 'flex',
            flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
            width: window.innerWidth <= 768 ? '100%' : 'auto'
          }}>
            <button 
              className="btn primary quick-action-btn" 
              onClick={openAdd}
              style={{ 
                minWidth: window.innerWidth <= 640 ? '100%' : 'auto',
                fontSize: window.innerWidth <= 640 ? '14px' : '16px',
                padding: window.innerWidth <= 768 ? '14px 18px' : '12px 16px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: 10,
                color: 'white',
                fontWeight: 600,
                minHeight: window.innerWidth <= 768 ? 48 : 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              <FaPlus size={window.innerWidth <= 768 ? 16 : 14} />
              {window.innerWidth <= 640 ? 'Add' : 'Add Student'}
            </button>
            {user?.role !== 'TEACHER' && (
              <button 
                className="btn" 
                onClick={() => setShowBulk(true)}
                style={{ 
                  fontSize: window.innerWidth <= 640 ? '14px' : '16px',
                  padding: window.innerWidth <= 768 ? '14px 18px' : '12px 16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 10,
                  color: '#60a5fa',
                  fontWeight: 600,
                  minHeight: window.innerWidth <= 768 ? 48 : 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  minWidth: window.innerWidth <= 640 ? '100%' : 'auto',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaUpload size={window.innerWidth <= 768 ? 16 : 14} />
                {window.innerWidth <= 640 ? 'Bulk' : 'Bulk Upload'}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="toolbar" style={{
        gap: 12, 
        flexWrap: 'wrap',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: window.innerWidth <= 768 ? 12 : 16,
        padding: window.innerWidth <= 768 ? '16px 12px' : '20px 16px',
        marginBottom: window.innerWidth <= 768 ? 20 : 24,
        border: '1px solid rgba(71, 85, 105, 0.3)',
        display: 'flex',
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
        alignItems: window.innerWidth <= 768 ? 'stretch' : 'center'
      }}>
        <div className="input-with-icon" style={{ 
          minWidth: window.innerWidth <= 640 ? '100%' : 280,
          position: 'relative',
          flex: window.innerWidth <= 768 ? 'none' : 1,
          maxWidth: window.innerWidth <= 768 ? '100%' : 400
        }}>
          <FaSearch style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b',
            fontSize: 14,
            zIndex: 2
          }} />
          <input
            placeholder={window.innerWidth <= 640 ? "Search students..." : "Search by name, ID or class"}
            value={query}
            onChange={e=>setQuery(e.target.value)}
            style={{ 
              width: '100%',
              padding: window.innerWidth <= 768 ? '16px 16px 16px 44px' : '14px 14px 14px 42px',
              fontSize: 16,
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: 10,
              background: 'rgba(30, 41, 59, 0.8)',
              color: 'white',
              outline: 'none',
              transition: 'all 0.3s ease',
              fontWeight: 500
            }}
          />
        </div>
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
          gap: window.innerWidth <= 768 ? 12 : 8,
          flex: window.innerWidth <= 768 ? 'none' : 'initial',
          width: window.innerWidth <= 768 ? '100%' : 'auto'
        }}>
          <ScrollableSelect
            value={classFilter}
            onChange={(v)=>{ setClassFilter(v); setLoading(true) }}
            disabled={user?.role==='TEACHER'}
            options={[{value:'',label:'All classes'}, ...classes.map(c=>({
              value:String(c.id),
              label:`${c.level_display || c.level}${c.section?` ${c.section}`:''}`
            }))]}
            sizeThreshold={10}
            style={{
              minWidth: window.innerWidth <= 768 ? '100%' : 160,
              height: window.innerWidth <= 768 ? 48 : 44
            }}
          />
          <button 
            className="btn" 
            onClick={()=>{setLoading(true); load()}} 
            style={{ 
              minHeight: window.innerWidth <= 768 ? 48 : 44,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: window.innerWidth <= 768 ? '16px 18px' : '12px 16px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 10,
              color: '#60a5fa',
              fontWeight: 600,
              fontSize: window.innerWidth <= 768 ? 14 : 15,
              justifyContent: 'center',
              width: window.innerWidth <= 768 ? '100%' : 'auto',
              transition: 'all 0.3s ease'
            }}
          >
            <FaSync size={window.innerWidth <= 768 ? 16 : 14} />
            Refresh
          </button>
        </div>
      </div>
      {user?.role==='TEACHER' && classFilter && (
        <div style={{
          marginTop: -6, 
          marginBottom: 16,
          color: '#94a3b8',
          fontSize: window.innerWidth <= 768 ? 13 : 14,
          fontStyle: 'italic',
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          📚 You are viewing students in your class only.
        </div>
      )}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          color: '#fca5a5',
          fontSize: 14
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {/* Desktop Table View */}
      {window.innerWidth > 768 && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(71, 85, 105, 0.3)',
          marginBottom: '24px',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ overflowX: 'auto', maxHeight: '70vh', overflowY: 'auto' }}>
            <table className="table" style={{ margin: 0, borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
                  <th style={{ padding: '16px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left', borderBottom: '2px solid #475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</th>
                  <th style={{ padding: '16px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'left', borderBottom: '2px solid #475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                  <th style={{ padding: '16px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'center', borderBottom: '2px solid #475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Class</th>
                  <th style={{ padding: '16px 12px', color: 'white', fontWeight: '600', fontSize: '13px', textAlign: 'center', borderBottom: '2px solid #475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gender</th>
                </tr>
              </thead>
            <tbody>
              {filtered.map((s, index) => (
                <tr 
                  key={s.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e0f2fe'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <td style={{ padding: '16px 12px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>{s.student_id}</td>
                  <td style={{ padding: '16px 12px', color: '#1f2937', fontSize: '14px', fontWeight: '500' }}>{s.full_name}</td>
                  <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                    <span style={{
                      background: s.class_name ? 'linear-gradient(135deg, #10b981, #059669)' : '#ef4444',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'inline-block',
                      minWidth: '60px'
                    }}>
                      {s.class_name || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                    <span style={{
                      background: s.gender === 'M' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #ec4899, #db2777)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'inline-block',
                      minWidth: '50px'
                    }}>
                      {s.gender === 'M' ? 'Male' : 'Female'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
      
      <div 
        className="student-cards" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '16px', 
          marginTop: '20px' 
        }}
      >
        {filtered.map(s => (
          <div 
            className="student-card" 
            key={'card-'+s.id}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            <div className="name" style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>{s.full_name}</div>
            <div className="meta" style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '600', color: '#374151' }}>ID:</span> {s.student_id}
            </div>
            <div className="meta" style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '600', color: '#374151' }}>Class:</span> 
              <span style={{
                background: s.class_name ? 'linear-gradient(135deg, #10b981, #059669)' : '#ef4444',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {s.class_name || 'N/A'}
              </span>
            </div>
            <div className="meta" style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '600', color: '#374151' }}>Gender:</span>
              <span style={{
                background: s.gender === 'M' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #ec4899, #db2777)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {s.gender === 'M' ? 'Male' : 'Female'}
              </span>
            </div>
          </div>
        ))}
      </div>
      {!filtered.length && <p>No students found.</p>}

      {/* Add Student Modal */}
      {showAdd && (
        <div 
          className="modal" 
          onClick={() => setShowAdd(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: window.innerWidth <= 768 ? 'stretch' : 'center',
            justifyContent: 'center',
            padding: window.innerWidth <= 768 ? '0' : '16px',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            overflow: 'hidden'
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: window.innerWidth <= 768 ? '100%' : '90%',
              height: window.innerWidth <= 768 ? '100%' : 'auto',
              maxWidth: window.innerWidth <= 768 ? 'none' : '800px',
              maxHeight: window.innerWidth <= 768 ? 'none' : '95vh',
              background: window.innerWidth <= 768 ? 'rgba(15, 23, 42, 1)' : 'rgba(15, 23, 42, 0.95)',
              border: window.innerWidth <= 768 ? 'none' : '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: window.innerWidth <= 768 ? 0 : 12,
              backdropFilter: 'blur(20px)',
              color: 'white',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              margin: window.innerWidth <= 768 ? '0' : 'auto'
            }}
          >
            <div 
              className="modal-header"
              style={{
                flexShrink: 0,
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: 'white',
                padding: window.innerWidth <= 768 ? '20px 20px 16px' : '20px 24px',
                margin: window.innerWidth <= 768 ? '0' : '-20px -24px 0 -24px',
                borderRadius: window.innerWidth <= 768 ? 0 : '12px 12px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                position: window.innerWidth <= 768 ? 'sticky' : 'static',
                top: 0,
                zIndex: 10
              }}
            >
              <h3 style={{
                margin: 0, 
                fontSize: window.innerWidth <= 768 ? '18px' : '20px', 
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FaUserGraduate style={{fontSize: window.innerWidth <= 768 ? '18px' : '22px'}}/>
                Add New Student
              </h3>
              <button 
                onClick={() => setShowAdd(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  width: window.innerWidth <= 768 ? '40px' : '36px',
                  height: window.innerWidth <= 768 ? '40px' : '36px',
                  borderRadius: window.innerWidth <= 768 ? '10px' : '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: window.innerWidth <= 768 ? '16px' : '18px',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaTimes/>
              </button>
            </div>
            
            <div 
              className="scroll-container"
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: window.innerWidth <= 768 ? '16px 20px 20px' : '20px 24px',
                margin: window.innerWidth <= 768 ? '0' : '0 -24px',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(59, 130, 246, 0.3) transparent',
                scrollBehavior: 'smooth',
                minHeight: window.innerWidth <= 768 ? '0' : 'auto',
                // Enhanced mobile viewport calculations
                height: window.innerWidth <= 768 ? {
                  '--safe-area-inset-top': 'env(safe-area-inset-top, 0px)',
                  '--safe-area-inset-bottom': 'env(safe-area-inset-bottom, 0px)',
                  height: 'calc(100vh - var(--safe-area-inset-top, 0px) - var(--safe-area-inset-bottom, 0px) - 160px)'
                }.height : 'auto',
                // Better scroll container for mobile
                ...(window.innerWidth <= 768 && {
                  position: 'relative',
                  paddingBottom: '100px', // Space for sticky footer
                  marginBottom: '-80px' // Offset to maintain proper footer positioning
                })
              }}
              // Enhanced scroll handling for mobile
              onTouchStart={(e) => {
                if (window.innerWidth <= 768) {
                  // Store initial touch position
                  e.currentTarget.dataset.touchStartY = e.touches[0].clientY
                }
              }}
              onTouchMove={(e) => {
                if (window.innerWidth <= 768) {
                  const scrollContainer = e.currentTarget
                  const touchStartY = parseFloat(scrollContainer.dataset.touchStartY || '0')
                  const touchCurrentY = e.touches[0].clientY
                  const touchDelta = touchCurrentY - touchStartY
                  
                  // Prevent overscroll bounce on iOS
                  const isScrollable = scrollContainer.scrollHeight > scrollContainer.clientHeight
                  const isAtTop = scrollContainer.scrollTop <= 0
                  const isAtBottom = scrollContainer.scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight
                  
                  if (!isScrollable || (isAtTop && touchDelta > 0) || (isAtBottom && touchDelta < 0)) {
                    e.preventDefault()
                  }
                }
              }}
            >
              <form onSubmit={async (e) => {
              e.preventDefault()
              
              // Final validation
              const requiredFields = ['student_id', 'first_name', 'last_name', 'date_of_birth', 'guardian_name', 'guardian_phone', 'guardian_address', 'admission_date']
              const errors = {}
              
              requiredFields.forEach(field => {
                const value = addForm[field]
                if (!value || (typeof value === 'string' && !value.trim())) {
                  errors[field] = `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is required`
                }
              })
              
              // Validate email format if provided
              if (addForm.guardian_email && addForm.guardian_email.trim()) {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.guardian_email)) {
                  errors.guardian_email = 'Please enter a valid email address'
                }
              }
              
              // Validate dates
              if (addForm.date_of_birth) {
                const birthDate = new Date(addForm.date_of_birth)
                const today = new Date()
                if (birthDate > today) {
                  errors.date_of_birth = 'Birth date cannot be in the future'
                }
              }
              
              if (addForm.admission_date) {
                const admissionDate = new Date(addForm.admission_date)
                const today = new Date()
                today.setDate(today.getDate() + 1) // Allow today and future dates
                if (admissionDate > today) {
                  errors.admission_date = 'Admission date cannot be more than 1 day in the future'
                }
              }
              
              // Ensure current_class is set for teachers
              if (user?.role === 'TEACHER' && teacherClasses.length === 1 && !addForm.current_class) {
                console.log('Auto-setting teacher class:', teacherClasses[0].id)
                setAddForm(f => ({...f, current_class: String(teacherClasses[0].id)}))
              }
              
              // Validate student ID uniqueness
              if (addForm.student_id) {
                const existingStudent = students.find(s => s.student_id === addForm.student_id)
                if (existingStudent) {
                  errors.student_id = `Student ID '${addForm.student_id}' already exists. Please use a different ID.`
                }
              }
              
              console.log('Form validation failed with', Object.keys(errors).length, 'errors')
              
              setFormErrors(errors)
              if (Object.keys(errors).length > 0) return
              
              setSubmitting(true)
              try {
                const fd = new FormData()
                console.log('Form data before processing:', addForm)
                
                Object.entries(addForm).forEach(([k,v]) => {
                  console.log(`Processing field ${k}:`, v)
                  if (v === null || v === undefined || v === '') {
                    console.log(`Skipping empty field: ${k}`)
                    return
                  }
                  if (k === 'photo') {
                    // Support either File/Blob or our { blob, fileName } shape
                    if (v && v.blob) {
                      console.log('Adding photo blob:', v.fileName || 'photo.jpg')
                      fd.append('photo', v.blob, v.fileName || 'photo.jpg')
                    } else if (v instanceof File) {
                      console.log('Adding photo file:', v.name)
                      fd.append('photo', v)
                    } else {
                      console.log('Skipping invalid photo format:', typeof v)
                    }
                    return
                  }
                  fd.append(k, v)
                })
                
                // Log all form data entries
                console.log('FormData prepared for submission')
                
                const response = await api.post('/students/', fd)
                console.log('Student created successfully:', response.data)
                setShowAdd(false)
                initializeForm()
                setLoading(true); await load()
              } catch (err) {
                console.error('Add student error:', err)
                console.error('Error response:', err?.response)
                console.error('Error data:', err?.response?.data)
                console.log('Form data that was sent:')
                for (let [key, value] of fd.entries()) {
                  console.log(`${key}:`, value)
                }
                
                let errorMessage = 'Failed to create student'
                
                if (err?.response?.status === 400) {
                  const errorData = err?.response?.data
                  if (errorData && typeof errorData === 'object') {
                    // Handle field-specific errors
                    const fieldErrors = []
                    Object.entries(errorData).forEach(([field, errors]) => {
                      if (field === 'student_id' && Array.isArray(errors)) {
                        fieldErrors.push(`Student ID '${addForm.student_id}' already exists. Please use a different ID.`)
                      } else if (Array.isArray(errors)) {
                        fieldErrors.push(`${field.replace('_', ' ')}: ${errors.join(', ')}`)
                      } else if (typeof errors === 'string') {
                        fieldErrors.push(`${field.replace('_', ' ')}: ${errors}`)
                      }
                    })
                    if (fieldErrors.length > 0) {
                      errorMessage = fieldErrors.join('\n')
                    }
                  } else if (errorData?.detail) {
                    errorMessage = errorData.detail
                  } else if (errorData?.error) {
                    errorMessage = errorData.error
                  } else {
                    errorMessage = 'Bad Request - Please check your input data'
                  }
                } else if (err?.response?.data?.detail) {
                  errorMessage = err.response.data.detail
                } else if (err?.response?.data?.error) {
                  errorMessage = err.response.data.error
                } else if (err?.message) {
                  errorMessage = err.message
                }
                
                alert(`Error creating student:\n${errorMessage}`)
                setError(errorMessage)
              } finally {
                setSubmitting(false)
              }
            }}>
                {error && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    marginBottom: '12px',
                    color: '#fca5a5',
                    fontSize: '13px'
                  }}>
                    {error}
                  </div>
                )}
                <div className="form add-student-form" style={{
                  '--mobile-input-padding': window.innerWidth <= 768 ? '14px 16px' : '12px 16px',
                  '--mobile-input-font-size': window.innerWidth <= 768 ? '16px' : '14px',
                  '--mobile-input-min-height': window.innerWidth <= 768 ? '48px' : '40px'
                }}>
                  <style>
                    {`
                      .add-student-form input,
                      .add-student-form select,
                      .add-student-form textarea {
                        width: 100%;
                        padding: var(--mobile-input-padding);
                        font-size: var(--mobile-input-font-size);
                        min-height: var(--mobile-input-min-height);
                        border: 2px solid #d1d5db;
                        border-radius: 8px;
                        background: #ffffff;
                        transition: all 0.2s ease;
                        outline: none;
                        box-sizing: border-box;
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        appearance: none;
                      }
                      
                      .add-student-form input:focus,
                      .add-student-form select:focus,
                      .add-student-form textarea:focus {
                        border-color: #3b82f6;
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                      }
                      
                      .add-student-form input.error,
                      .add-student-form select.error,
                      .add-student-form textarea.error {
                        border-color: #ef4444;
                      }
                      
                      .add-student-form input.error:focus,
                      .add-student-form select.error:focus,
                      .add-student-form textarea.error:focus {
                        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                      }
                      
                      .field-error {
                        color: #ef4444;
                        font-size: 12px;
                        margin-top: 6px;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                      }
                      
                      .form-section h4 {
                        margin: 10px 0 6px;
                        color: var(--text);
                        font-size: 13px;
                        font-weight: 600;
                        border-bottom: 1px solid #374151;
                        padding-bottom: 2px;
                      }
                      
                      @media (max-width: 768px) {
                        .add-student-form .form-row {
                          grid-template-columns: 1fr !important;
                          gap: 16px !important;
                        }
                        
                        .add-student-form .field {
                          margin-bottom: 20px !important;
                        }
                      }
                    `}
                  </style>
                  <div className="form-row">
                    <div className="field" style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>Student ID <span style={{color: '#ef4444', fontSize: '16px'}}>*</span></label>
                      <input 
                        value={addForm.student_id} 
                        onChange={(e) => {
                          setAddForm(f => ({...f, student_id: e.target.value}))
                          validateField('student_id', e.target.value)
                        }}
                        className={formErrors.student_id ? 'error' : ''}
                        placeholder="Enter unique student ID (e.g., 2024001)"
                        required 
                      />
                      {formErrors.student_id && (
                        <div className="field-error">
                          ⚠️ {formErrors.student_id}
                        </div>
                      )}
                    </div>

                    <div className="field" style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>Gender</label>
                      <select 
                        value={addForm.gender} 
                        onChange={(e)=>setAddForm(f=>({...f,gender:e.target.value}))}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          fontSize: '14px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          background: '#ffffff',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                          e.target.style.border = '2px solid #3b82f6'
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '2px solid #d1d5db'
                          e.target.style.boxShadow = 'none'
                        }}
                      >
                        <option value="M">👨 Male</option>
                        <option value="F">👩 Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field" style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>First Name <span style={{color: '#ef4444', fontSize: '16px'}}>*</span></label>
                      <input 
                        value={addForm.first_name} 
                        onChange={(e) => {
                          setAddForm(f => ({...f, first_name: e.target.value}))
                          validateField('first_name', e.target.value)
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          fontSize: '14px',
                          border: formErrors.first_name ? '2px solid #ef4444' : '2px solid #d1d5db',
                          borderRadius: '8px',
                          background: '#ffffff',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                          if (!formErrors.first_name) {
                            e.target.style.border = '2px solid #3b82f6'
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                          }
                        }}
                        onBlur={(e) => {
                          if (!formErrors.first_name) {
                            e.target.style.border = '2px solid #d1d5db'
                            e.target.style.boxShadow = 'none'
                          }
                        }}
                        placeholder="Enter student's first name"
                        required 
                      />
                      {formErrors.first_name && (
                        <div style={{
                          color: '#ef4444',
                          fontSize: '12px',
                          marginTop: '6px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          ⚠️ {formErrors.first_name}
                        </div>
                      )}
                    </div>

                    <div className="field" style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>Last Name <span style={{color: '#ef4444', fontSize: '16px'}}>*</span></label>
                      <input 
                        value={addForm.last_name} 
                        onChange={(e) => {
                          setAddForm(f => ({...f, last_name: e.target.value}))
                          validateField('last_name', e.target.value)
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          fontSize: '14px',
                          border: formErrors.last_name ? '2px solid #ef4444' : '2px solid #d1d5db',
                          borderRadius: '8px',
                          background: '#ffffff',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                          if (!formErrors.last_name) {
                            e.target.style.border = '2px solid #3b82f6'
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                          }
                        }}
                        onBlur={(e) => {
                          if (!formErrors.last_name) {
                            e.target.style.border = '2px solid #d1d5db'
                            e.target.style.boxShadow = 'none'
                          }
                        }}
                        placeholder="Enter student's last name"
                        required 
                      />
                      {formErrors.last_name && (
                        <div style={{
                          color: '#ef4444',
                          fontSize: '12px',
                          marginTop: '6px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          ⚠️ {formErrors.last_name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Other Names</label>
                      <input 
                        value={addForm.other_names} 
                        onChange={(e)=>setAddForm(f=>({...f,other_names:e.target.value}))}
                        placeholder="Enter other names (optional)"
                      />
                    </div>

                    <div className="field">
                      <label>Date of Birth <span style={{color: '#ef4444'}}>*</span></label>
                      <input 
                        type="date" 
                        value={addForm.date_of_birth} 
                        onChange={(e) => {
                          setAddForm(f => ({...f, date_of_birth: e.target.value}))
                          validateField('date_of_birth', e.target.value)
                        }}
                        className={formErrors.date_of_birth ? 'error' : ''}
                        required 
                      />
                      {formErrors.date_of_birth && <span className="field-error">{formErrors.date_of_birth}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Class</label>
                      {user?.role === 'TEACHER' && teacherClasses.length === 1 ? (
                        <div style={{
                          padding: '10px 12px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid #10b981',
                          borderRadius: '8px',
                          color: '#86efac',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <FaUser style={{fontSize: '12px'}}/>
                          {teacherClasses[0].level_display || teacherClasses[0].level}{teacherClasses[0].section ? ` ${teacherClasses[0].section}` : ''}
                          <span style={{color: 'var(--muted)', fontSize: '12px'}}>(Your Class)</span>
                        </div>
                      ) : (
                        <ScrollableSelect
                          value={addForm.current_class}
                          onChange={(v)=>setAddForm(f=>({...f,current_class:v}))}
                          options={[{value:'',label:'Unassigned'}, ...classes.map(c=>({
                            value:String(c.id),
                            label:`${c.level_display || c.level}${c.section?` ${c.section}`:''}`
                          }))]}
                          sizeThreshold={8}
                        />
                      )}
                    </div>

                    <div className="field">
                      <label>Admission Date <span style={{color: '#ef4444'}}>*</span></label>
                      <input 
                        type="date" 
                        value={addForm.admission_date} 
                        onChange={(e) => {
                          setAddForm(f => ({...f, admission_date: e.target.value}))
                          validateField('admission_date', e.target.value)
                        }}
                        className={formErrors.admission_date ? 'error' : ''}
                        required 
                      />
                      {formErrors.admission_date && <span className="field-error">{formErrors.admission_date}</span>}
                    </div>
                  </div>

                  <div className="form-section">
                    <h4 style={{margin: '10px 0 6px', color: 'var(--text)', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid #374151', paddingBottom: '2px'}}>Guardian Information</h4>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Guardian Name <span style={{color: '#ef4444'}}>*</span></label>
                      <input 
                        value={addForm.guardian_name} 
                        onChange={(e) => {
                          setAddForm(f => ({...f, guardian_name: e.target.value}))
                          validateField('guardian_name', e.target.value)
                        }}
                        className={formErrors.guardian_name ? 'error' : ''}
                        placeholder="Enter guardian full name"
                        required 
                      />
                      {formErrors.guardian_name && <span className="field-error">{formErrors.guardian_name}</span>}
                    </div>

                    <div className="field">
                      <label>Guardian Phone <span style={{color: '#ef4444'}}>*</span></label>
                      <input 
                        value={addForm.guardian_phone} 
                        onChange={(e) => {
                          setAddForm(f => ({...f, guardian_phone: e.target.value}))
                          validateField('guardian_phone', e.target.value)
                        }}
                        className={formErrors.guardian_phone ? 'error' : ''}
                        placeholder="Enter phone number"
                        required 
                      />
                      {formErrors.guardian_phone && <span className="field-error">{formErrors.guardian_phone}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Guardian Email</label>
                      <input 
                        type="email" 
                        value={addForm.guardian_email} 
                        onChange={(e) => {
                          setAddForm(f => ({...f, guardian_email: e.target.value}))
                          validateField('guardian_email', e.target.value)
                        }}
                        className={formErrors.guardian_email ? 'error' : ''}
                        placeholder="Enter email address (optional)"
                      />
                      {formErrors.guardian_email && <span className="field-error">{formErrors.guardian_email}</span>}
                    </div>

                    <div className="field">
                      <label>Guardian Address <span style={{color: '#ef4444'}}>*</span></label>
                      <input 
                        value={addForm.guardian_address} 
                        onChange={(e) => {
                          setAddForm(f => ({...f, guardian_address: e.target.value}))
                          validateField('guardian_address', e.target.value)
                        }}
                        className={formErrors.guardian_address ? 'error' : ''}
                        placeholder="Enter home address"
                        required 
                      />
                      {formErrors.guardian_address && <span className="field-error">{formErrors.guardian_address}</span>}
                    </div>
                  </div>

                  <div className="form-section" style={{ marginBottom: '24px' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                      color: 'white',
                      padding: '12px 16px',
                      margin: '0 -20px 20px -20px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}>
                        📷
                      </div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Student Photo</h4>
                    </div>
                  </div>

                  <div className="form-row" style={{ marginBottom: '30px' }}>
                    <div 
                      className="field photo-field" 
                      style={{
                        minHeight: '120px',
                        background: '#f8fafc',
                        border: '2px dashed #cbd5e1',
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        marginBottom: '20px'
                      }}
                    >
                      <ImageCaptureInput
                        label=""
                        onChange={(fileInfo)=> setAddForm(f=>({ ...f, photo: fileInfo }))}
                      />
                      <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#64748b',
                        textAlign: 'center',
                        lineHeight: '1.4'
                      }}>
                        Click "Capture / Upload" to add a student photo.<br/>
                        Supports camera capture and file upload.
                      </p>
                    </div>
                  </div>
                </div>
              
                <div 
                  className="modal-actions"
                  style={{
                    flexShrink: 0,
                    padding: window.innerWidth <= 768 ? '16px 20px' : '20px 24px',
                    borderTop: '1px solid #e5e7eb',
                    background: window.innerWidth <= 768 ? 'rgba(248, 250, 252, 0.98)' : '#f8fafc',
                    backdropFilter: window.innerWidth <= 768 ? 'blur(16px)' : 'none',
                    margin: window.innerWidth <= 768 ? '0 -20px -20px -20px' : '0 -24px -20px -24px',
                    borderRadius: window.innerWidth <= 768 ? 0 : '0 0 12px 12px',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    // Enhanced sticky positioning for mobile
                    ...(window.innerWidth <= 768 && {
                      position: 'sticky',
                      bottom: 0,
                      zIndex: 30,
                      boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
                      borderTop: '2px solid rgba(59, 130, 246, 0.2)'
                    })
                  }}
                >
                  <button 
                    type="button" 
                    onClick={()=>setShowAdd(false)} 
                    disabled={submitting}
                    style={{
                      background: 'white',
                      color: '#64748b',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: '100px',
                      justifyContent: 'center',
                      opacity: submitting ? 0.6 : 1
                    }}
                  >
                    <FaTimes style={{fontSize: '12px'}}/>Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    style={{
                      background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #059669, #047857)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: '120px',
                      justifyContent: 'center',
                      boxShadow: submitting ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <FaSave style={{fontSize: '12px'}}/>
                    {submitting ? 'Saving...' : 'Save Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulk && (
        <div className="modal" onClick={() => setShowBulk(false)}>
          <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Upload Students (Excel)</h3>
              <button className="btn" onClick={() => setShowBulk(false)}><FaTimes/></button>
            </div>
            <div className="muted" style={{marginBottom:8}}>Upload an .xlsx file with columns: student_id, first_name, last_name, other_names, gender, date_of_birth (YYYY-MM-DD), current_class_id, guardian_name, guardian_phone, guardian_email, guardian_address, admission_date (YYYY-MM-DD).</div>
            <div style={{display:'flex', gap:10, alignItems:'center'}}>
              <input type="file" accept=".xlsx,.xls" onChange={(e)=>setBulkFile(e.target.files?.[0] || null)} />
              <button className="btn primary" onClick={async ()=>{
                setBulkMessage('')
                if (!bulkFile) { setBulkMessage('Choose a file'); return }
                try {
                  const fd = new FormData(); fd.append('file', bulkFile)
                  const res = await api.post('/students/bulk_upload/', fd)
                  setBulkMessage(res.data?.message || 'Uploaded')
                  setLoading(true); await load()
                } catch (err) {
                  const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to upload (install openpyxl on backend to enable)'
                  setBulkMessage(msg)
                }
              }}>Upload</button>
            </div>
            {bulkMessage && <div className="alert" style={{marginTop:12}}>{bulkMessage}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
