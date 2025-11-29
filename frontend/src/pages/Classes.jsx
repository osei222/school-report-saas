import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../state/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { FaLayerGroup, FaPlus, FaTrash, FaUserTie, FaChalkboard, FaSave, FaGraduationCap, FaBookOpen, FaArrowRight } from 'react-icons/fa'

const LEVELS = [
  { value: 'BASIC_1', label: 'Basic 1' },
  { value: 'BASIC_2', label: 'Basic 2' },
  { value: 'BASIC_3', label: 'Basic 3' },
  { value: 'BASIC_4', label: 'Basic 4' },
  { value: 'BASIC_5', label: 'Basic 5' },
  { value: 'BASIC_6', label: 'Basic 6' },
  { value: 'BASIC_7', label: 'Basic 7 (JHS 1)' },
  { value: 'BASIC_8', label: 'Basic 8 (JHS 2)' },
  { value: 'BASIC_9', label: 'Basic 9 (JHS 3)' },
]

export default function Classes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [form, setForm] = useState({ level: 'BASIC_1', section: '', capacity: 30, class_teacher: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [assignFor, setAssignFor] = useState(null) // class id
  const [assignments, setAssignments] = useState([])
  const [assignForm, setAssignForm] = useState({ subject: '', teacher: '' })
  const [editingClass, setEditingClass] = useState(null)
  const [teacherAssignments, setTeacherAssignments] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [classStudents, setClassStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  const load = async () => {
    try {
      const [cls, tRes, sRes] = await Promise.all([
        api.get('/schools/classes/'),
        api.get('/auth/users/'),
        api.get('/schools/subjects/')
      ])
      setClasses(cls.data.results || cls.data)
      const allUsers = tRes.data.results || tRes.data
      setTeachers((allUsers || []).filter(u => u.role === 'TEACHER'))
      setSubjects(sRes.data.results || sRes.data)
      
      // Load teacher assignments if user is a teacher
      if (user?.role === 'TEACHER') {
        await loadTeacherAssignments()
      }
    } catch (e) {}
  }

  const loadClassStudents = async (classId) => {
    setLoadingStudents(true)
    try {
      const res = await api.get(`/students/?class_id=${classId}`)
      const students = res.data.results || res.data || []
      setClassStudents(students)
      console.log(`Loaded ${students.length} students for class ${classId}`)
    } catch (e) {
      console.error('Failed to load class students:', e)
      setClassStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const loadTeacherAssignments = async () => {
    try {
      console.log('Loading teacher assignments for user:', user.id)
      
      // Get classes where user is class teacher
      const classTeacherRes = await api.get(`/schools/classes/`)
      const allClasses = classTeacherRes.data.results || classTeacherRes.data || []
      const classTeacherClasses = allClasses.filter(cls => cls.class_teacher === user.id)
      console.log('Classes where user is class teacher:', classTeacherClasses)
      
      // Get subject assignments for this teacher
      const subjectRes = await api.get(`/schools/class-subjects/`)
      const allSubjectAssignments = subjectRes.data.results || subjectRes.data || []
      const subjectAssignments = allSubjectAssignments.filter(assignment => assignment.teacher === user.id)
      console.log('Subject assignments for teacher:', subjectAssignments)
      
      // Combine both types of assignments - only show classes with actual assignments
      const allAssignments = []
      const processedClasses = new Set()
      
      // Add form classes (where teacher is class teacher)
      classTeacherClasses.forEach(cls => {
        allAssignments.push({
          id: `class_${cls.id}`,
          class: cls,
          type: 'form_class',
          subject: null,
          class_name: cls.name,
          isFormClass: true
        })
        processedClasses.add(cls.id)
      })
      
      // Add subject-specific assignments
      subjectAssignments.forEach(assignment => {
        if (assignment.class_instance && assignment.subject) {
          allAssignments.push({
            id: `subject_${assignment.id}`,
            class: assignment.class_instance,
            type: 'subject_class',
            subject: assignment.subject,
            assignment: assignment,
            class_name: assignment.class_instance?.name || 'Unknown Class',
            isFormClass: processedClasses.has(assignment.class_instance.id)
          })
        }
      })
      
      console.log('Final teacher assignments:', allAssignments)
      
      // Filter to only show classes where teacher has assignments
      const classesWithAssignments = allAssignments.filter(assignment => 
        assignment.type === 'form_class' || 
        (assignment.type === 'subject_class' && assignment.subject && assignment.class)
      )
      
      setTeacherAssignments(classesWithAssignments)
    } catch (e) {
      console.error('Failed to load teacher assignments:', e)
    }
  }

  const loadAssignments = async (classId) => {
    try {
      const res = await api.get(`/schools/class-subjects/?class_instance=${classId}`)
      setAssignments((res.data.results || res.data).filter(cs => cs.class_instance === classId || cs.class_instance?.id === classId))
    } catch (e) {
      setAssignments([])
    }
  }

  useEffect(() => { load() }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }
  const handleAssignChange = (e) => {
    const { name, value } = e.target
    setAssignForm((f) => ({ ...f, [name]: value }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      // Sanitize inputs
      const sectionClean = (form.section || '').trim()
      let capacityVal = parseInt(form.capacity, 10)
      if (isNaN(capacityVal) || capacityVal < 1) capacityVal = 30

      // Prevent duplicates client-side for better UX
      const exists = classes.some(c => (c.level === form.level) && ((c.section || '') === sectionClean))
      if (exists) {
        setError('A class with this Level and Section already exists')
        return
      }
      const payload = {
        level: form.level,
        section: sectionClean,
        capacity: capacityVal,
        class_teacher: form.class_teacher ? Number(form.class_teacher) : null,
      }
      setSaving(true)
      await api.post('/schools/classes/', payload)
      setForm({ level: 'BASIC_1', section: '', capacity: 30, class_teacher: '' })
      await load()
      setMessage('Class created')
    } catch (e) {
      const status = e?.response?.status
      const data = e?.response?.data
      // Log full error for debugging
      try { console.error('Create class error:', { status, data, error: e?.message }) } catch {}
      const friendly = data?.level?.[0] || data?.section?.[0] || data?.capacity?.[0] || data?.non_field_errors?.[0] || data?.detail
      let msg = friendly
      if (!msg) {
        if (typeof data === 'string') {
          // Likely a Django HTML error page; avoid dumping markup into the UI
          msg = status ? `Server error (${status}). Please try again.` : 'Server error. Please try again.'
        } else if (data && typeof data === 'object') {
          msg = JSON.stringify(data)
        } else {
          msg = e?.message || 'Failed to create class'
        }
      }
      setError(msg)
    }
    finally { setSaving(false) }
  }

  const handleDeleteClass = async (id) => {
    if (!confirm('Delete this class?')) return
    try {
      await api.delete(`/schools/classes/${id}/`)
      await load()
    } catch {}
  }

  const handleEditClass = (classObj) => {
    setEditingClass(classObj)
    setForm({
      level: classObj.level,
      section: classObj.section || '',
      capacity: classObj.capacity,
      class_teacher: classObj.class_teacher || ''
    })
  }

  const handleUpdateClass = async (e) => {
    e.preventDefault()
    if (!editingClass) return
    setMessage('')
    setError('')
    try {
      const payload = {
        capacity: parseInt(form.capacity, 10) || 30,
        class_teacher: form.class_teacher ? Number(form.class_teacher) : null,
      }
      setSaving(true)
      await api.patch(`/schools/classes/${editingClass.id}/`, payload)
      setEditingClass(null)
      setForm({ level: 'BASIC_1', section: '', capacity: 30, class_teacher: '' })
      await load()
      setMessage('Class updated successfully')
    } catch (e) {
      const data = e?.response?.data
      const msg = data?.detail || data?.capacity?.[0] || data?.class_teacher?.[0] || 'Failed to update class'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditingClass(null)
    setForm({ level: 'BASIC_1', section: '', capacity: 30, class_teacher: '' })
  }

  const openAssign = async (c) => {
    setAssignFor(c)
    setAssignForm({ subject: '', teacher: '' })
    await loadAssignments(c.id)
  }

  const handleAddAssignment = async (e) => {
    e.preventDefault()
    if (!assignFor) return
    try {
      await api.post('/schools/class-subjects/', {
        class_instance: assignFor.id,
        subject: Number(assignForm.subject),
        teacher: assignForm.teacher ? Number(assignForm.teacher) : null,
      })
      await loadAssignments(assignFor.id)
      setAssignForm({ subject: '', teacher: '' })
    } catch {}
  }

  const handleRemoveAssignment = async (id) => {
    try {
      await api.delete(`/schools/class-subjects/${id}/`)
      await loadAssignments(assignFor.id)
    } catch {}
  }

  const claimSubject = async (assignment, claim) => {
    if (!assignment) return
    try {
      // PATCH teacher field only
      await api.patch(`/schools/class-subjects/${assignment.id}/`, { teacher: claim ? user.id : null })
      await loadAssignments(assignFor.id)
    } catch (e) {
      console.error('Claim subject error', e?.response?.data || e?.message)
    }
  }

  const teacherOptions = useMemo(() => teachers.map(t => ({ id: t.id, name: `${t.first_name} ${t.last_name}`.trim() || t.email })), [teachers])
  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'PRINCIPAL'
  const isTeacher = user?.role === 'TEACHER'
  const canCreateClass = isAdmin // only admin/principal
  const canManageAssignmentsFor = (cls) => {
    if (isAdmin) return true
    if (isTeacher && cls.class_teacher === user.id) return true
    return false
  }
  // Determine category for a class level
  const levelToCategory = (level) => {
    if (!level) return null
    try {
      const num = parseInt(level.split('_')[1], 10)
      if (!isNaN(num)) {
        if (num <= 6) return 'PRIMARY'
        if (num >= 7) return 'JHS'
      }
    } catch {}
    return null
  }
  const filteredSubjects = useMemo(() => {
    if (!assignFor) return []
    const cat = levelToCategory(assignFor.level)
    return subjects.filter(s => s.category === 'BOTH' || s.category === cat)
  }, [assignFor, subjects])

  return (
    <div className="container">
      <div 
        className="page-header"
        style={{
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h1 style={{display:'flex',alignItems:'center',gap:12, margin: 0, fontSize: '24px', fontWeight: '700'}}>
          <FaLayerGroup style={{fontSize: '28px'}}/> 
          {isTeacher ? 'My Classes & Subjects' : 'Classes Management'}
        </h1>
        {isTeacher && (
          <p style={{margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9}}>
            Select a class and subject to enter student scores
          </p>
        )}
      </div>

      {/* Teacher Interface - Class and Subject Selection */}
      {isTeacher && (
        <div className="mobile-card" style={{
          marginBottom: '24px'
        }}>
          <h3 style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text)',
            marginBottom: '20px'
          }}>
            <FaGraduationCap style={{color: 'var(--green)'}}/> 
            Select Class & Subject
          </h3>
          
          {teacherAssignments.length === 0 ? (
            <div className="mobile-card" style={{
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              border: '2px solid #f59e0b',
              textAlign: 'center'
            }}>
              <p style={{margin: 0, color: '#92400e', fontWeight: '500', lineHeight: '1.5'}}>
                No class or subject assignments found. Please contact your administrator to assign you to classes.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {/* Class Selection */}
              <div>
                    <label style={{
                      display: 'block',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--text)',
                      marginBottom: '12px'
                    }}>
                      Your Assigned Classes ({Array.from(new Set(teacherAssignments.map(a => a.class.id))).length}):
                    </label>
                    <div className="dashboard-grid">
                      {Array.from(new Set(teacherAssignments.map(a => a.class.id))).map(classId => {
                        const classObj = teacherAssignments.find(a => a.class.id === classId)?.class
                        if (!classObj) return null
                        
                        const isFormClass = teacherAssignments.some(a => a.class.id === classId && a.type === 'form_class')
                        const subjectCount = teacherAssignments.filter(a => a.class.id === classId && a.type === 'subject_class').length
                        const isSelected = selectedClass?.id === classId
                        
                        return (
                          <div
                            key={classId}
                            onClick={() => {
                              setSelectedClass(classObj)
                              setSelectedSubject('')
                              loadClassStudents(classId)
                            }}
                            className="mobile-card"
                            style={{
                              border: isSelected ? '2px solid var(--green)' : '2px solid #374151',
                              background: isSelected ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(5, 150, 105, 0.05))' : 'var(--card)',
                              cursor: 'pointer',
                              textAlign: 'center',
                              boxShadow: isSelected 
                                ? '0 8px 25px rgba(5, 150, 105, 0.25)' 
                                : '0 4px 12px rgba(0, 0, 0, 0.1)',
                              transform: isSelected ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.target.style.borderColor = '#059669'
                                e.target.style.background = '#f0fdf4'
                                e.target.style.transform = 'translateY(-2px)'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.target.style.borderColor = '#e5e7eb'
                                e.target.style.background = 'white'
                                e.target.style.transform = 'translateY(0)'
                              }
                            }}
                          >
                            <div style={{
                              fontSize: '18px', 
                              fontWeight: '700', 
                              color: isSelected ? 'var(--green)' : 'var(--text)', 
                              marginBottom: '12px'
                            }}>
                              {classObj.name}
                            </div>
                            {/* Teacher Role Title */}
                            <div style={{fontSize: '14px', fontWeight: '600', color: isSelected ? '#065f46' : '#4b5563', marginBottom: '8px'}}>
                              {isFormClass && subjectCount > 0 ? (
                                <>🏫 Form Teacher + 📚 Subject Teacher</>
                              ) : isFormClass ? (
                                <>🏫 Form Teacher</>
                              ) : (
                                <>📚 Subject Teacher ({subjectCount} subject{subjectCount !== 1 ? 's' : ''})</>
                              )}
                            </div>
                            <div style={{display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px'}}>
                              {isFormClass && 
                                <span style={{
                                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                                  color: 'white', 
                                  padding: '3px 8px', 
                                  borderRadius: '6px', 
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}>
                                  Form Class
                                </span>
                              }
                              {subjectCount > 0 &&
                                <span style={{
                                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', 
                                  color: 'white', 
                                  padding: '3px 8px', 
                                  borderRadius: '6px', 
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}>
                                  {subjectCount} Subject{subjectCount > 1 ? 's' : ''}
                                </span>
                              }
                            </div>
                            <div style={{fontSize: '12px', color: '#6b7280'}}>
                              Click to select this class
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Student List Display */}
                  {selectedClass && (
                    <div style={{
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '20px',
                      marginTop: '20px'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                        color: 'white',
                        padding: '16px 20px',
                        margin: '-20px -20px 20px -20px',
                        borderRadius: '12px 12px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                          <FaGraduationCap style={{fontSize: '24px'}}/>
                          <div>
                            <h3 style={{margin: 0, fontSize: '20px', fontWeight: '700'}}>
                              {selectedClass.name}
                            </h3>
                            <p style={{margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9}}>
                              {loadingStudents ? 'Loading students...' : `${classStudents.length} student${classStudents.length !== 1 ? 's' : ''} enrolled`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedClass(null)
                            setSelectedSubject('')
                            setClassStudents([])
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: 'white',
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                          title="Go back to class selection"
                        >
                          ✕
                        </button>
                      </div>

                      {loadingStudents ? (
                        <div style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>
                          <div style={{fontSize: '18px', marginBottom: '8px'}}>📚</div>
                          Loading students...
                        </div>
                      ) : classStudents.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '40px',
                          background: '#fef3c7',
                          borderRadius: '8px',
                          border: '1px solid #f59e0b'
                        }}>
                          <div style={{fontSize: '24px', marginBottom: '12px'}}>📋</div>
                          <p style={{margin: 0, color: '#92400e', fontWeight: '500'}}>
                            No students enrolled in this class yet.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: '12px',
                            marginBottom: '24px'
                          }}>
                            {classStudents.slice(0, 6).map((student, index) => (
                              <div
                                key={student.id}
                                style={{
                                  padding: '12px',
                                  background: '#f8fafc',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px'
                                }}
                              >
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '16px',
                                  fontWeight: '600'
                                }}>
                                  {(student.first_name || student.full_name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div style={{flex: 1}}>
                                  <div style={{fontWeight: '600', color: '#1f2937', fontSize: '14px'}}>
                                    {student.full_name || `${student.first_name} ${student.last_name}`}
                                  </div>
                                  <div style={{fontSize: '12px', color: '#6b7280'}}>
                                    ID: {student.student_id}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {classStudents.length > 6 && (
                            <div style={{
                              textAlign: 'center',
                              padding: '12px',
                              background: '#f1f5f9',
                              borderRadius: '6px',
                              color: '#64748b',
                              fontSize: '14px',
                              marginBottom: '20px'
                            }}>
                              ... and {classStudents.length - 6} more student{classStudents.length - 6 !== 1 ? 's' : ''}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

              {/* Enter Scores Button */}
              {selectedClass && classStudents.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                  border: '2px solid #059669',
                  borderRadius: '12px',
                  padding: '24px',
                  marginTop: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{marginBottom: '16px'}}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#059669'
                    }}>
                      Ready to Enter Scores? 📝
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      color: '#047857',
                      lineHeight: '1.4'
                    }}>
                      You will enter scores for <strong>{selectedClass.name}</strong> with <strong>{classStudents.length} students</strong>
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      // Determine teacher type for this class
                      const isFormTeacher = teacherAssignments.some(a => a.class.id === selectedClass.id && a.type === 'form_class')
                      const subjectAssignments = teacherAssignments.filter(a => a.class.id === selectedClass.id && a.type === 'subject_class')
                      
                      navigate('/enter-scores', { 
                        state: { 
                          classId: selectedClass.id,
                          className: selectedClass.name,
                          students: classStudents,
                          isFormTeacher: isFormTeacher,
                          subjectAssignments: subjectAssignments.map(a => ({
                            id: a.assignment.id,
                            subjectId: a.subject.id,
                            subjectName: a.subject.name
                          }))
                        }
                      })
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '18px 36px',
                      fontSize: '18px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      margin: '0 auto',
                      boxShadow: '0 6px 12px -2px rgba(5, 150, 105, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-3px) scale(1.02)'
                      e.target.style.boxShadow = '0 8px 16px -4px rgba(5, 150, 105, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0) scale(1)'
                      e.target.style.boxShadow = '0 6px 12px -2px rgba(5, 150, 105, 0.3)'
                    }}
                  >
                    <FaGraduationCap style={{fontSize: '22px'}}/>
                    Proceed to Enter Scores
                    <FaArrowRight style={{fontSize: '18px'}}/>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin Interface - Class Management */}
      {!isTeacher && (
        <>
        {/* Left: Create form and class list */}
        <div className="panel">
          {canCreateClass && (
            <>
              <h3 style={{display:'flex',alignItems:'center',gap:8}}>
                <FaLayerGroup/> {editingClass ? 'Edit Class' : 'Create Class'}
              </h3>
              <form className="grid form" onSubmit={editingClass ? handleUpdateClass : handleCreate}>
                <label>Level</label>
                <select name="level" value={form.level} onChange={handleChange} disabled={!!editingClass}>
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <label>Section</label>
                <input name="section" value={form.section} onChange={handleChange} placeholder="A / Blue / Gold" disabled={!!editingClass} />
                <label>Capacity</label>
                <input name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} />
                <label>Class Teacher</label>
                <select name="class_teacher" value={form.class_teacher} onChange={handleChange}>
                  <option value="">Unassigned</option>
                  {teacherOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn primary" type="submit" disabled={saving}>
                    <FaSave style={{marginRight:6,verticalAlign:'-2px'}}/>
                    {saving ? 'Saving…' : (editingClass ? 'Update Class' : 'Create Class')}
                  </button>
                  {editingClass && (
                    <button type="button" className="btn" onClick={cancelEdit}>Cancel</button>
                  )}
                </div>
              </form>
            </>
          )}
          {error && <div className="alert" style={{marginTop:12, background:'#7f1d1d', color:'#fecaca'}}>{error}</div>}
          {message && <div className="alert" style={{marginTop:12, background:'#14532d', color:'#bbf7d0'}}>{message}</div>}

          <h3 style={{marginTop:16}}>Your Classes</h3>
          <div className="table-wrap">
            <table className="table row-selectable">
              <thead>
                <tr><th>Level</th><th>Section</th><th>Teacher</th><th>Capacity</th><th>Students</th><th style={{width:200}}>Actions</th></tr>
              </thead>
              <tbody>
                {classes.map(c => {
                  const selected = assignFor?.id === c.id
                  return (
                    <tr key={c.id} className={selected ? 'selected' : ''} onClick={() => { if (canManageAssignmentsFor(c)) openAssign(c) }}>
                      <td>{c.level_display || c.level}</td>
                      <td>{c.section || '-'}</td>
                      <td>{c.class_teacher_name || '-'}</td>
                      <td>{c.capacity}</td>
                      <td>{c.student_count ?? '-'}</td>
                      <td style={{display:'flex', gap:8}}>
                        {canManageAssignmentsFor(c) && <button className="btn" onClick={(e) => { e.stopPropagation(); openAssign(c) }} title="Manage Subjects"><FaChalkboard style={{verticalAlign:'-2px'}}/> Assign</button>}
                        {canCreateClass && <button className="btn" onClick={(e) => { e.stopPropagation(); handleEditClass(c) }} title="Edit Class"><FaUserTie style={{verticalAlign:'-2px'}}/> Edit</button>}
                        {canCreateClass && <button className="btn" onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id) }} title="Delete"><FaTrash style={{verticalAlign:'-2px'}}/></button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Assignment panel */}
        <div className="panel">
          <div className="header">
            <h3 style={{display:'flex',alignItems:'center',gap:8}}>
              <FaChalkboard color="#93c5fd"/> Assign Subjects
            </h3>
            {assignFor && (
              <span className="chip">{assignFor.level_display || assignFor.level}{assignFor.section ? ` ${assignFor.section}` : ''}</span>
            )}
          </div>
          {!assignFor && <p className="muted">Select a class from the list to manage its subjects and teachers.</p>}
          {assignFor && (
            <>
              {canManageAssignmentsFor(assignFor) && (
                <form className="grid form" onSubmit={handleAddAssignment}>
                  <label>Subject</label>
                  <select name="subject" value={assignForm.subject} onChange={handleAssignChange} required>
                    <option value="">Select subject</option>
                    {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <label>Teacher</label>
                  <select name="teacher" value={assignForm.teacher} onChange={handleAssignChange}>
                    <option value="">Unassigned</option>
                    {teacherOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button className="btn primary" type="submit"><FaPlus style={{marginRight:6,verticalAlign:'-2px'}}/>Add</button>
                </form>
              )}
              <div className="table-wrap" style={{marginTop:12}}>
                <table className="table">
                  <thead><tr><th>Subject</th><th>Teacher</th><th style={{width:100}}>Actions</th></tr></thead>
                  <tbody>
                    {assignments.map(a => {
                      const isOwner = a.teacher_name && a.teacher_name.trim().length > 0
                      const canClaim = canManageAssignmentsFor(assignFor) && isTeacher && !isOwner
                      const canUnclaim = canManageAssignmentsFor(assignFor) && isTeacher && isOwner && a.teacher_name === `${user.first_name} ${user.last_name}`.trim()
                      return (
                        <tr key={a.id}>
                          <td>{a.subject_name || a.subject?.name}</td>
                          <td>{a.teacher_name || '-'}</td>
                          <td style={{display:'flex',gap:6}}>
                            {canManageAssignmentsFor(assignFor) && isAdmin && <button className="btn" onClick={() => handleRemoveAssignment(a.id)} title="Remove"><FaTrash/></button>}
                            {canClaim && <button className="btn" onClick={() => claimSubject(a, true)}>Claim</button>}
                            {canUnclaim && <button className="btn" onClick={() => claimSubject(a, false)}>Unclaim</button>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        </>
      )}
    </div>
  )
}
