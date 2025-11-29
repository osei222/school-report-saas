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
    specializations: []
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
      specializations: []
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
    <div className="container">
      <div className="page-header">
        <h1 style={{display:'flex',alignItems:'center',gap:10}}><FaChalkboardTeacher color="#86efac" /> Teachers</h1>
        <div className="actions">
          <button className="btn primary" onClick={()=>setShowCreate(true)}><FaPlus style={{marginRight:6,verticalAlign:'-2px'}}/>New Teacher</button>
          <button className="btn" onClick={load}><FaSync style={{marginRight:6,verticalAlign:'-2px'}}/>Refresh</button>
        </div>
      </div>
      {error && <div className="alert" style={{background:'#7f1d1d',color:'#fecaca'}}>{error}</div>}
      {message && <div className="alert" style={{background:'#14532d',color:'#bbf7d0'}}>{message}</div>}

      <div className="card" style={{marginTop:16}}>
        <table className="table">
          <thead>
            <tr><th>Email</th><th>Name</th><th>Role</th></tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id}><td>{t.email}</td><td>{t.first_name} {t.last_name}</td><td><span className="chip">{t.role}</span></td></tr>
            ))}
          </tbody>
        </table>
        {!teachers.length && <p style={{padding:12}}>No teachers yet.</p>}
      </div>

      {showCreate && (
        <div className="modal" onClick={()=>setShowCreate(false)}>
          <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Teacher</h3>
              <button className="btn" onClick={()=>setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form two-col dense modal-body">
                <div className="field">
                  <label>Email</label>
                  <div className="input-with-icon">
                    <FaEnvelope className="input-icon" />
                    <input name="email" value={form.email} onChange={handleChange} required />
                  </div>
                </div>

                <div className="field">
                  <label>First Name</label>
                  <div className="input-with-icon">
                    <FaUser className="input-icon" />
                    <input name="first_name" value={form.first_name} onChange={handleChange} />
                  </div>
                </div>

                <div className="field">
                  <label>Last Name</label>
                  <div className="input-with-icon">
                    <FaUser className="input-icon" />
                    <input name="last_name" value={form.last_name} onChange={handleChange} />
                  </div>
                </div>

                <div className="field">
                  <label>Assign Class (optional)</label>
                  <ScrollableSelect
                    name="class_id"
                    value={form.class_id}
                    onChange={(v)=>setForm(f=>({...f,class_id:v}))}
                    options={[{value:'',label:'None'}, ...classes.map(c=>({
                      value:String(c.id),
                      label:`${c.level_display || c.level}${c.section?` ${c.section}`:''}`
                    }))]}
                    sizeThreshold={8}
                  />
                </div>

                <div className="field">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <FaLock className="input-icon" />
                    <input type="password" name="password" value={form.password} onChange={handleChange} required />
                  </div>
                </div>

                <div className="field">
                  <label>Confirm Password</label>
                  <div className="input-with-icon">
                    <FaLock className="input-icon" />
                    <input type="password" name="password_confirm" value={form.password_confirm} onChange={handleChange} required />
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={()=>setShowCreate(false)}>Cancel</button>
                <button disabled={loading} className="btn primary" type="submit">{loading? 'Saving…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
