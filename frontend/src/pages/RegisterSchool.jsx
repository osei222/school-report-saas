import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { FaSchool, FaEnvelope, FaUser, FaLock, FaRocket } from 'react-icons/fa'

export default function RegisterSchool() {
  const { registerSchool, loading } = useAuth()
  const [form, setForm] = useState({
    school_name: '',
    admin_email: '',
    password: '',
    password_confirm: '',
    first_name: 'Admin',
    last_name: 'User',
    levels: ['BOTH']
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const res = await registerSchool(form)
    if (res.ok) navigate('/dashboard')
    else setError(res.message?.detail || JSON.stringify(res.message))
  }

  return (
    <div className="centered">
      <form className="card" onSubmit={handleSubmit} style={{width: 460}}>
        <h2 style={{display:'flex',alignItems:'center',gap:10}}><FaSchool color="#60a5fa"/> Create School Account</h2>
        {error && <div className="alert">{error}</div>}

        <label>School Name</label>
        <div className="input-with-icon">
          <FaSchool className="input-icon" />
          <input name="school_name" value={form.school_name} onChange={handleChange} required />
        </div>

        <label>Admin Email</label>
        <div className="input-with-icon">
          <FaEnvelope className="input-icon" />
          <input type="email" name="admin_email" value={form.admin_email} onChange={handleChange} required />
        </div>

        <label>Admin First Name</label>
        <div className="input-with-icon">
          <FaUser className="input-icon" />
          <input name="first_name" value={form.first_name} onChange={handleChange} />
        </div>

        <label>Admin Last Name</label>
        <div className="input-with-icon">
          <FaUser className="input-icon" />
          <input name="last_name" value={form.last_name} onChange={handleChange} />
        </div>

        <label>Password</label>
        <div className="input-with-icon">
          <FaLock className="input-icon" />
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </div>

        <label>Confirm Password</label>
        <div className="input-with-icon">
          <FaLock className="input-icon" />
          <input type="password" name="password_confirm" value={form.password_confirm} onChange={handleChange} required />
        </div>

        <button className="btn primary" type="submit" disabled={loading}><FaRocket style={{marginRight:6,verticalAlign:'-2px'}}/>{loading ? 'Creating…' : 'Create School'}</button>
        <div style={{marginTop:12, color:'#9ca3af', fontSize:13}}>Already have an account? <a href="/login">Login</a></div>
      </form>
    </div>
  )
}
