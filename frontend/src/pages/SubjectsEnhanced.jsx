import { useEffect, useMemo, useState } from 'react'
import api from '../utils/api'
import { FaBook, FaPlus, FaTrash, FaLayerGroup, FaCheck, FaTasks, FaSpinner } from 'react-icons/fa'
import { useAuth } from '../state/AuthContext'
import ScrollableSelect from '../components/ScrollableSelect'

export default function SubjectsEnhanced() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [classAssignments, setClassAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [creating, setCreating] = useState(false)
  const [newSubj, setNewSubj] = useState({ name: '', code: '', category: 'BOTH', description: '' })
  const [assignSubjectId, setAssignSubjectId] = useState('')
  
  // Enhanced bulk state
  const [bulkLevel, setBulkLevel] = useState('PRIMARY')
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [selectedClasses, setSelectedClasses] = useState([])
  const [bulkMode, setBulkMode] = useState('assign') // 'assign' or 'remove'
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkResults, setBulkResults] = useState(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      loadClassAssignments()
    } else {
      setClassAssignments([])
    }
  }, [selectedClass])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [subsRes, classRes] = await Promise.all([
        api.get('/schools/subjects/'),
        api.get('/schools/classes/')
      ])
      setSubjects(subsRes.data.results || subsRes.data)
      const cls = classRes.data.results || classRes.data
      setClasses(cls)
      if (!selectedClass && cls?.length) setSelectedClass(String(cls[0].id))
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load subjects/classes')
    } finally {
      setLoading(false)
    }
  }

  const loadClassAssignments = async () => {
    try {
      const res = await api.get(`/schools/class-subjects/?class_instance=${selectedClass}`)
      setClassAssignments(res.data.results || res.data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load class subjects')
    }
  }

  // Get classes filtered by level group
  const classesByLevel = useMemo(() => {
    return (classes || []).filter(c => {
      const level = c.level || ''
      const n = level.startsWith('BASIC_') ? parseInt(level.split('_')[1], 10) : undefined
      if (isNaN(n)) return false
      if (bulkLevel === 'PRIMARY') return n >= 1 && n <= 6
      return n >= 7 && n <= 9
    })
  }, [classes, bulkLevel])

  // Get subjects compatible with current level
  const compatibleSubjects = useMemo(() => {
    return (subjects || []).filter(s => {
      if (bulkLevel === 'PRIMARY') return s.category === 'PRIMARY' || s.category === 'BOTH'
      if (bulkLevel === 'JHS') return s.category === 'JHS' || s.category === 'BOTH'
      return true
    })
  }, [subjects, bulkLevel])

  const selectedClassObj = useMemo(() => classes.find(c => String(c.id) === String(selectedClass)), [classes, selectedClass])

  const allowedCategory = useMemo(() => {
    if (!selectedClassObj) return 'BOTH'
    const level = selectedClassObj.level || ''
    const n = level.startsWith('BASIC_') ? parseInt(level.split('_')[1], 10) : undefined
    if (!isNaN(n)) {
      if (n <= 6) return 'PRIMARY'
      if (n >= 7) return 'JHS'
    }
    return 'BOTH'
  }, [selectedClassObj])

  const availableForClass = useMemo(() => {
    const assignedIds = new Set(classAssignments.map(a => a.subject))
    return (subjects || []).filter(s => {
      if (assignedIds.has(s.id)) return false
      if (allowedCategory === 'PRIMARY') return s.category === 'PRIMARY' || s.category === 'BOTH'
      if (allowedCategory === 'JHS') return s.category === 'JHS' || s.category === 'BOTH'
      return true
    })
  }, [subjects, classAssignments, allowedCategory])

  const createSubject = async (e) => {
    e.preventDefault()
    setError(''); setMsg(''); setCreating(true)
    try {
      const res = await api.post('/schools/subjects/', newSubj)
      setSubjects(prev => [res.data, ...prev])
      setNewSubj({ name: '', code: '', category: 'BOTH', description: '' })
      setMsg('Subject created')
    } catch (e) {
      const msg = e?.response?.data?.detail || Object.values(e?.response?.data || {})?.[0] || 'Failed to create subject'
      setError(String(msg))
    } finally {
      setCreating(false)
    }
  }

  const assignToClass = async () => {
    if (!assignSubjectId || !selectedClass) return
    setError(''); setMsg('')
    try {
      const res = await api.post('/schools/class-subjects/', { 
        class_instance: Number(selectedClass), 
        subject: Number(assignSubjectId) 
      })
      setClassAssignments(prev => [...prev, res.data])
      setAssignSubjectId('')
      setMsg('Assigned to class')
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error || 'Failed to assign (check category compatibility)'
      setError(String(msg))
    }
  }

  const removeAssignment = async (assignmentId) => {
    setError(''); setMsg('')
    try {
      await api.delete(`/schools/class-subjects/${assignmentId}/`)
      setClassAssignments(prev => prev.filter(a => a.id !== assignmentId))
      setMsg('Removed from class')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to remove assignment')
    }
  }

  const executeBulkOperation = async () => {
    if (!selectedSubjects.length || !selectedClasses.length) {
      setError('Please select both subjects and classes')
      return
    }

    setError(''); setMsg(''); setBulkRunning(true); setBulkResults(null)
    
    try {
      const endpoint = bulkMode === 'assign' ? '/schools/class-subjects/bulk_assign/' : '/schools/class-subjects/bulk_remove/'
      const res = await api.post(endpoint, {
        subject_ids: selectedSubjects,
        class_ids: selectedClasses
      })

      setBulkResults(res.data)
      
      if (bulkMode === 'assign') {
        setMsg(`Bulk assignment completed: ${res.data.summary.created_count} assigned, ${res.data.summary.skipped_count} skipped, ${res.data.summary.invalid_count} invalid`)
      } else {
        setMsg(`Bulk removal completed: ${res.data.summary.removed_count} removed`)
      }

      // Refresh current class assignments if it's in the affected classes
      if (selectedClass && selectedClasses.includes(Number(selectedClass))) {
        loadClassAssignments()
      }

      // Clear selections after successful operation
      setSelectedSubjects([])
      setSelectedClasses([])

    } catch (e) {
      setError(e?.response?.data?.detail || `Failed to ${bulkMode} subjects`)
    } finally {
      setBulkRunning(false)
    }
  }

  const toggleSubjectSelection = (subjectId) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  const toggleClassSelection = (classId) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

  const selectAllSubjects = () => {
    setSelectedSubjects(compatibleSubjects.map(s => s.id))
  }

  const selectAllClasses = () => {
    setSelectedClasses(classesByLevel.map(c => c.id))
  }

  const clearSelections = () => {
    setSelectedSubjects([])
    setSelectedClasses([])
    setBulkResults(null)
  }

  if (loading) return <div className="container"><p>Loading…</p></div>

  return (
    <div className="container full">
      <div className="page-header">
        <h1 style={{display:'flex',alignItems:'center',gap:10}}>
          <FaBook color="#34d399"/> Enhanced Subject Management
        </h1>
      </div>
      
      {(error || msg) && (
        <div className={error ? 'alert' : 'success'} style={{marginBottom:12}}>
          {error || msg}
        </div>
      )}

      <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:16}}>
        {/* Left: Subjects catalog and create form */}
        <div className="card">
          <h3 style={{marginTop:0}}>Create Subject</h3>
          <form className="grid form" onSubmit={createSubject}>
            <label>Name</label>
            <input value={newSubj.name} onChange={e=>setNewSubj(s=>({...s,name:e.target.value}))} required />
            <label>Code</label>
            <input value={newSubj.code} onChange={e=>setNewSubj(s=>({...s,code:e.target.value}))} required />
            <label>Category</label>
            <select value={newSubj.category} onChange={e=>setNewSubj(s=>({...s,category:e.target.value}))}>
              <option value="PRIMARY">PRIMARY (Basic 1-6)</option>
              <option value="JHS">JHS (Basic 7-9)</option>
              <option value="BOTH">BOTH</option>
            </select>
            <label>Description</label>
            <textarea value={newSubj.description} onChange={e=>setNewSubj(s=>({...s,description:e.target.value}))} rows={2} />
            <div style={{gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end'}}>
              <button className="btn primary" disabled={creating}>
                <FaPlus style={{marginRight:6,verticalAlign:'-2px'}}/>Create
              </button>
            </div>
          </form>

          <h3>All Subjects ({subjects.length})</h3>
          <div style={{maxHeight:300, overflowY:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.code}</td>
                    <td>
                      <span className={`badge ${s.category === 'PRIMARY' ? 'primary' : s.category === 'JHS' ? 'warning' : 'success'}`}>
                        {s.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Single class assignment */}
        <div className="card">
          <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:8}}>
            <FaLayerGroup/> Single Class Assignment
          </h3>
          <div className="grid form">
            <label>Class</label>
            <ScrollableSelect
              value={selectedClass}
              onChange={(v)=>setSelectedClass(v)}
              options={(classes||[]).map(c => ({
                value:String(c.id),
                label:`${c.level_display||c.level}${c.section?` ${c.section}`:''}`
              }))}
              sizeThreshold={10}
              placeholder="Select class…"
            />
            <label>Subject</label>
            <div style={{display:'flex', gap:8}}>
              <ScrollableSelect
                value={assignSubjectId}
                onChange={(v)=>setAssignSubjectId(v)}
                options={[{value:'',label:'Select subject…'}, ...availableForClass.map(s=>({
                  value:String(s.id),
                  label:`${s.name} (${s.category})`
                }))]}
                sizeThreshold={12}
                placeholder="Select subject…"
              />
              <button className="btn" type="button" onClick={assignToClass} disabled={!assignSubjectId || !selectedClass}>
                <FaCheck style={{marginRight:6,verticalAlign:'-2px'}}/>Add
              </button>
            </div>
            <div className="muted" style={{gridColumn:'1 / -1'}}>
              Allowed for this class: {allowedCategory === 'BOTH' ? 'PRIMARY & JHS' : allowedCategory}
            </div>
          </div>

          <h4>Assigned Subjects ({classAssignments.length})</h4>
          <div style={{maxHeight:200, overflowY:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {classAssignments.map(a => (
                  <tr key={a.id}>
                    <td>{a.subject_name || a.subject?.name}</td>
                    <td>{a.teacher_name || '-'}</td>
                    <td style={{textAlign:'right'}}>
                      <button className="btn btn-sm" onClick={()=>removeAssignment(a.id)} title="Remove">
                        <FaTrash/>
                      </button>
                    </td>
                  </tr>
                ))}
                {!classAssignments.length && (
                  <tr><td colSpan={3} className="muted">No subjects assigned yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enhanced Bulk Operations */}
      <div className="card" style={{marginTop:16}}>
        <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:8}}>
          <FaTasks color="#3b82f6"/> Enhanced Bulk Operations
        </h3>

        <div className="grid" style={{gridTemplateColumns:'auto auto auto 1fr', gap:16, alignItems:'center', marginBottom:16}}>
          <div>
            <label style={{marginRight:8}}>Level Group:</label>
            <select value={bulkLevel} onChange={(e)=>setBulkLevel(e.target.value)}>
              <option value="PRIMARY">Primary (Basic 1-6)</option>
              <option value="JHS">JHS (Basic 7-9)</option>
            </select>
          </div>
          
          <div>
            <label style={{marginRight:8}}>Operation:</label>
            <select value={bulkMode} onChange={(e)=>setBulkMode(e.target.value)}>
              <option value="assign">Assign Subjects</option>
              <option value="remove">Remove Subjects</option>
            </select>
          </div>

          <button 
            className="btn"
            onClick={clearSelections}
            disabled={!selectedSubjects.length && !selectedClasses.length}
          >
            Clear Selections
          </button>

          <button 
            className="btn primary"
            onClick={executeBulkOperation}
            disabled={bulkRunning || !selectedSubjects.length || !selectedClasses.length}
            style={{justifySelf:'end'}}
          >
            {bulkRunning ? (
              <>
                <FaSpinner className="spinner" style={{marginRight:6}}/>
                Processing...
              </>
            ) : (
              <>
                <FaTasks style={{marginRight:6,verticalAlign:'-2px'}}/>
                {bulkMode === 'assign' ? 'Bulk Assign' : 'Bulk Remove'} 
                ({selectedSubjects.length} subjects to {selectedClasses.length} classes)
              </>
            )}
          </button>
        </div>

        <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:16}}>
          {/* Subject Selection */}
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <h4 style={{margin:0}}>Select Subjects ({selectedSubjects.length}/{compatibleSubjects.length})</h4>
              <button className="btn btn-sm" onClick={selectAllSubjects} type="button">Select All</button>
            </div>
            <div style={{maxHeight:250, overflowY:'auto', border:'1px solid #ddd', padding:8}}>
              {compatibleSubjects.map(s => (
                <label key={s.id} style={{display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer'}}>
                  <input 
                    type="checkbox" 
                    checked={selectedSubjects.includes(s.id)}
                    onChange={() => toggleSubjectSelection(s.id)}
                    style={{margin:0}}
                  />
                  <span style={{fontWeight: selectedSubjects.includes(s.id) ? 'bold' : 'normal'}}>
                    {s.name} 
                    <span className={`badge ${s.category === 'PRIMARY' ? 'primary' : s.category === 'JHS' ? 'warning' : 'success'}`} style={{marginLeft:6}}>
                      {s.category}
                    </span>
                  </span>
                </label>
              ))}
              {!compatibleSubjects.length && (
                <p className="muted">No compatible subjects for {bulkLevel} level.</p>
              )}
            </div>
          </div>

          {/* Class Selection */}
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <h4 style={{margin:0}}>Select Classes ({selectedClasses.length}/{classesByLevel.length})</h4>
              <button className="btn btn-sm" onClick={selectAllClasses} type="button">Select All</button>
            </div>
            <div style={{maxHeight:250, overflowY:'auto', border:'1px solid #ddd', padding:8}}>
              {classesByLevel.map(c => (
                <label key={c.id} style={{display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer'}}>
                  <input 
                    type="checkbox" 
                    checked={selectedClasses.includes(c.id)}
                    onChange={() => toggleClassSelection(c.id)}
                    style={{margin:0}}
                  />
                  <span style={{fontWeight: selectedClasses.includes(c.id) ? 'bold' : 'normal'}}>
                    {(c.level_display||c.level)}{c.section?` ${c.section}`:''}
                  </span>
                </label>
              ))}
              {!classesByLevel.length && (
                <p className="muted">No classes found for {bulkLevel} level.</p>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Results */}
        {bulkResults && (
          <div className="card" style={{marginTop:16, backgroundColor:'#f8fafc'}}>
            <h4 style={{marginTop:0}}>Operation Results</h4>
            <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16}}>
              {bulkMode === 'assign' && (
                <>
                  <div className="stat-card success">
                    <h3>{bulkResults.summary.created_count}</h3>
                    <p>Successfully Assigned</p>
                  </div>
                  <div className="stat-card warning">
                    <h3>{bulkResults.summary.skipped_count}</h3>
                    <p>Skipped (Already Assigned)</p>
                  </div>
                  <div className="stat-card error">
                    <h3>{bulkResults.summary.invalid_count}</h3>
                    <p>Invalid (Category Mismatch)</p>
                  </div>
                </>
              )}
              {bulkMode === 'remove' && (
                <div className="stat-card info">
                  <h3>{bulkResults.summary.removed_count}</h3>
                  <p>Successfully Removed</p>
                </div>
              )}
            </div>

            {/* Detailed Results */}
            {(bulkResults.invalid?.length > 0 || bulkResults.skipped?.length > 0) && (
              <details style={{marginTop:16}}>
                <summary style={{cursor:'pointer', fontWeight:'bold'}}>View Details</summary>
                <div style={{marginTop:8, maxHeight:200, overflowY:'auto'}}>
                  {bulkResults.invalid?.length > 0 && (
                    <div style={{marginBottom:16}}>
                      <h5 style={{color:'#dc2626'}}>Invalid Assignments:</h5>
                      {bulkResults.invalid.map((item, idx) => (
                        <p key={idx} style={{fontSize:'0.9em', color:'#666'}}>
                          {item.subject} → {item.class}: {item.reason}
                        </p>
                      ))}
                    </div>
                  )}
                  {bulkResults.skipped?.length > 0 && (
                    <div>
                      <h5 style={{color:'#d97706'}}>Skipped Assignments:</h5>
                      {bulkResults.skipped.map((item, idx) => (
                        <p key={idx} style={{fontSize:'0.9em', color:'#666'}}>
                          {item.subject} → {item.class}: {item.reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}