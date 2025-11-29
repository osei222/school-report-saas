import { useEffect, useMemo, useState } from 'react'
import api from '../utils/api'
import { FaBook, FaPlus, FaTrash, FaLayerGroup, FaCheck, FaTasks } from 'react-icons/fa'
import { useAuth } from '../state/AuthContext'

export default function Subjects() {
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
  const [multiAssignMode, setMultiAssignMode] = useState(false)
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([])
  // Bulk assign state
  const [bulkLevel, setBulkLevel] = useState('PRIMARY') // PRIMARY or JHS
  const [bulkSubjectId, setBulkSubjectId] = useState('')
  const [bulkRunning, setBulkRunning] = useState(false)
  // Multi-select bulk assign
  const [multiSubjectIds, setMultiSubjectIds] = useState([])
  // Bulk remove state
  const [removeSubjectId, setRemoveSubjectId] = useState('')
  const [removeRunning, setRemoveRunning] = useState(false)

  useEffect(() => {
    (async () => {
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
    })()
  }, [])

  useEffect(() => {
    (async () => {
      if (!selectedClass) { setClassAssignments([]); return }
      try {
        const res = await api.get(`/schools/class-subjects/?class_instance=${selectedClass}`)
        setClassAssignments(res.data.results || res.data)
      } catch (e) {
        setError(e?.response?.data?.detail || 'Failed to load class subjects')
      }
    })()
  }, [selectedClass])

  const selectedClassObj = useMemo(() => classes.find(c => String(c.id) === String(selectedClass)), [classes, selectedClass])

  // Determine allowed categories for selected class
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
      const res = await api.post('/schools/class-subjects/', { class_instance: Number(selectedClass), subject: Number(assignSubjectId) })
      setClassAssignments(prev => [...prev, res.data])
      setAssignSubjectId('')
      setMsg('Assigned to class')
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error || 'Failed to assign (check category compatibility)'
      setError(String(msg))
    }
  }

  const assignMultipleToClass = async () => {
    if (!selectedSubjectIds.length || !selectedClass) return
    setError(''); setMsg('')
    try {
      let assigned = 0, skipped = 0
      for (const subjectId of selectedSubjectIds) {
        try {
          const res = await api.post('/schools/class-subjects/', { 
            class_instance: Number(selectedClass), 
            subject: Number(subjectId) 
          })
          setClassAssignments(prev => [...prev, res.data])
          assigned++
        } catch (e) {
          // Subject might already be assigned or have category mismatch
          skipped++
        }
      }
      setSelectedSubjectIds([])
      setMsg(`Assigned ${assigned} subjects, skipped ${skipped} (already assigned or incompatible)`)
      
      // Refresh assignments to get updated list
      if (selectedClass) {
        try {
          const res = await api.get(`/schools/class-subjects/?class_instance=${selectedClass}`)
          setClassAssignments(res.data.results || res.data)
        } catch {}
      }
    } catch (e) {
      setError('Failed to assign subjects')
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

  const bulkAssign = async () => {
    if (!bulkSubjectId) { setError('Choose a subject for bulk assignment'); return }
    setError(''); setMsg(''); setBulkRunning(true)
    try {
      // Determine target classes by level group
      const targetClasses = (classes || []).filter(c => {
        const level = c.level || ''
        const n = level.startsWith('BASIC_') ? parseInt(level.split('_')[1], 10) : undefined
        if (isNaN(n)) return false
        if (bulkLevel === 'PRIMARY') return n >= 1 && n <= 6
        return n >= 7 && n <= 9
      })
      let assigned = 0, skipped = 0
      for (const cls of targetClasses) {
        try {
          await api.post('/schools/class-subjects/', { class_instance: Number(cls.id), subject: Number(bulkSubjectId) })
          assigned += 1
        } catch (e) {
          // Likely already assigned or category mismatch; count as skipped
          skipped += 1
        }
      }
      setMsg(`Bulk assignment done: assigned ${assigned}, skipped ${skipped}`)
      // Refresh assignments for current selected class if it belongs to the group
      if (selectedClass) {
        const clsObj = classes.find(c => String(c.id) === String(selectedClass))
        if (clsObj) {
          const level = clsObj.level || ''
          const n = level.startsWith('BASIC_') ? parseInt(level.split('_')[1], 10) : undefined
          const inGroup = bulkLevel === 'PRIMARY' ? (n && n <= 6) : (n && n >= 7)
          if (inGroup) {
            try {
              const res = await api.get(`/schools/class-subjects/?class_instance=${selectedClass}`)
              setClassAssignments(res.data.results || res.data)
            } catch {}
          }
        }
      }
    } finally {
      setBulkRunning(false)
    }
  }

  const bulkAssignMultiple = async () => {
    if (!multiSubjectIds.length) { setError('Choose subjects for bulk assignment'); return }
    setError(''); setMsg(''); setBulkRunning(true)
    try {
      const targetClasses = (classes || []).filter(c => {
        const level = c.level || ''
        const n = level.startsWith('BASIC_') ? parseInt(level.split('_')[1], 10) : undefined
        if (isNaN(n)) return false
        if (bulkLevel === 'PRIMARY') return n >= 1 && n <= 6
        return n >= 7 && n <= 9
      })
      let totalAssigned = 0, totalSkipped = 0
      for (const subjectId of multiSubjectIds) {
        for (const cls of targetClasses) {
          try {
            await api.post('/schools/class-subjects/', { class_instance: Number(cls.id), subject: Number(subjectId) })
            totalAssigned += 1
          } catch (e) {
            totalSkipped += 1
          }
        }
      }
      setMsg(`Multi-subject bulk assignment: assigned ${totalAssigned}, skipped ${totalSkipped}`)
      setMultiSubjectIds([])
      // Refresh current class assignments if in target group
      if (selectedClass) {
        const clsObj = classes.find(c => String(c.id) === String(selectedClass))
        if (clsObj) {
          const level = clsObj.level || ''
          const n = level.startsWith('BASIC_') ? parseInt(level.split('_')[1], 10) : undefined
          const inGroup = bulkLevel === 'PRIMARY' ? (n && n <= 6) : (n && n >= 7)
          if (inGroup) {
            try {
              const res = await api.get(`/schools/class-subjects/?class_instance=${selectedClass}`)
              setClassAssignments(res.data.results || res.data)
            } catch {}
          }
        }
      }
    } finally {
      setBulkRunning(false)
    }
  }

  const bulkRemove = async () => {
    if (!removeSubjectId) { setError('Choose a subject to remove from all classes'); return }
    setError(''); setMsg(''); setRemoveRunning(true)
    try {
      const targetClasses = (classes || []).filter(c => {
        const level = c.level || ''
        const n = level.startsWith('BASIC_') ? parseInt(level.split('_')[1], 10) : undefined
        if (isNaN(n)) return false
        if (bulkLevel === 'PRIMARY') return n >= 1 && n <= 6
        return n >= 7 && n <= 9
      })
      let removed = 0
      // Get all class-subjects for these classes
      const assignments = await Promise.all(
        targetClasses.map(cls => 
          api.get(`/schools/class-subjects/?class_instance=${cls.id}`)
            .then(res => (res.data.results || res.data).filter(a => a.subject == removeSubjectId))
            .catch(() => [])
        )
      )
      const flatAssignments = assignments.flat()
      for (const assignment of flatAssignments) {
        try {
          await api.delete(`/schools/class-subjects/${assignment.id}/`)
          removed += 1
        } catch {}
      }
      setMsg(`Bulk remove: removed ${removed} assignments`)
      setRemoveSubjectId('')
      // Refresh current class assignments if in target group
      if (selectedClass) {
        const clsObj = classes.find(c => String(c.id) === String(selectedClass))
        if (clsObj) {
          const level = clsObj.level || ''
          const n = level.startsWith('BASIC_') ? parseInt(level.split('_')[1], 10) : undefined
          const inGroup = bulkLevel === 'PRIMARY' ? (n && n <= 6) : (n && n >= 7)
          if (inGroup) {
            try {
              const res = await api.get(`/schools/class-subjects/?class_instance=${selectedClass}`)
              setClassAssignments(res.data.results || res.data)
            } catch {}
          }
        }
      }
    } finally {
      setRemoveRunning(false)
    }
  }

  const toggleMultiSubject = (subjectId) => {
    setMultiSubjectIds(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  if (loading) return <div className="container"><p>Loading…</p></div>

  return (
    <div className="container full">
      <div className="page-header">
        <h1 style={{display:'flex',alignItems:'center',gap:10}}><FaBook color="#34d399"/> Subjects</h1>
        <div style={{display:'flex',gap:8}}>
          <a href="/subjects-enhanced" className="btn primary">
            <FaTasks style={{marginRight:6,verticalAlign:'-2px'}}/>Enhanced Bulk Operations
          </a>
        </div>
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
              <button className="btn primary" disabled={creating}><FaPlus style={{marginRight:6,verticalAlign:'-2px'}}/>Create</button>
            </div>
          </form>

          <h3>All Subjects</h3>
          <div style={{overflowX:'auto'}}>
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
                  <td>{s.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Right: Assign to classes */}
        <div className="card">
          <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:8}}><FaLayerGroup/> Assign to Classes</h3>
          
          <div className="grid form">
            <label>Class</label>
            <select value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)}>
              {(classes||[]).map(c => <option key={c.id} value={c.id}>{(c.level_display||c.level)}{c.section?` ${c.section}`:''}</option>)}
            </select>
            
            <div style={{gridColumn: '1 / -1'}}>
              <label>Assignment Mode</label>
              <div style={{display: 'flex', gap: '16px', margin: '8px 0'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'}}>
                  <input 
                    type="radio" 
                    checked={!multiAssignMode} 
                    onChange={() => {
                      setMultiAssignMode(false)
                      setSelectedSubjectIds([])
                    }}
                  />
                  <span>Single Subject</span>
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'}}>
                  <input 
                    type="radio" 
                    checked={multiAssignMode} 
                    onChange={() => {
                      setMultiAssignMode(true)
                      setAssignSubjectId('')
                    }}
                  />
                  <span>Multiple Subjects</span>
                </label>
              </div>
            </div>

            {!multiAssignMode ? (
              <>
                <label>Subject</label>
                <div style={{display:'flex', gap:8}}>
                  <select value={assignSubjectId} onChange={(e)=>setAssignSubjectId(e.target.value)} style={{flex:1}}>
                    <option value="">Select subject…</option>
                    {availableForClass.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                  </select>
                  <button className="btn" type="button" onClick={assignToClass} disabled={!assignSubjectId || !selectedClass}>
                    <FaCheck style={{marginRight:6,verticalAlign:'-2px'}}/>Add
                  </button>
                </div>
              </>
            ) : (
              <>
                <label>Subjects ({selectedSubjectIds.length} selected)</label>
                <div style={{
                  maxHeight: '200px', 
                  overflow: 'auto', 
                  border: '1px solid #374151', 
                  borderRadius: '6px', 
                  padding: '8px',
                  background: '#0b1220'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '4px', borderBottom: '1px solid #374151'}}>
                    <input 
                      type="checkbox"
                      checked={selectedSubjectIds.length === availableForClass.length && availableForClass.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubjectIds(availableForClass.map(s => String(s.id)))
                        } else {
                          setSelectedSubjectIds([])
                        }
                      }}
                    />
                    <strong>Select All ({availableForClass.length} available subjects)</strong>
                  </div>
                  {availableForClass.map(s => (
                    <label key={s.id} style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '6px 4px', 
                      cursor: 'pointer',
                      borderRadius: '4px',
                      ':hover': {background: '#1f2937'}
                    }}>
                      <input 
                        type="checkbox"
                        checked={selectedSubjectIds.includes(String(s.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubjectIds(prev => [...prev, String(s.id)])
                          } else {
                            setSelectedSubjectIds(prev => prev.filter(id => id !== String(s.id)))
                          }
                        }}
                      />
                      <span style={{flex: 1}}>{s.name}</span>
                      <span className="muted" style={{fontSize: '12px'}}>({s.category})</span>
                    </label>
                  ))}
                  {availableForClass.length === 0 && (
                    <div className="muted" style={{textAlign: 'center', padding: '16px'}}>
                      No compatible subjects available for this class
                    </div>
                  )}
                </div>
                <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                  <button 
                    className="btn" 
                    type="button" 
                    onClick={() => setSelectedSubjectIds([])}
                    disabled={selectedSubjectIds.length === 0}
                  >
                    Clear Selection
                  </button>
                  <button 
                    className="btn primary" 
                    type="button" 
                    onClick={assignMultipleToClass} 
                    disabled={selectedSubjectIds.length === 0 || !selectedClass}
                  >
                    <FaCheck style={{marginRight:6,verticalAlign:'-2px'}}/>
                    Assign {selectedSubjectIds.length} Subject{selectedSubjectIds.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </>
            )}
            
            <div className="muted" style={{gridColumn:'1 / -1', marginTop: '8px'}}>
              Allowed for this class: {allowedCategory === 'BOTH' ? 'PRIMARY & JHS' : allowedCategory}
              {multiAssignMode && selectedSubjectIds.length > 0 && (
                <div style={{marginTop: '4px', color: '#3b82f6'}}>
                  ℹ️ Ready to assign {selectedSubjectIds.length} subject{selectedSubjectIds.length !== 1 ? 's' : ''} to this class
                </div>
              )}
            </div>
          </div>

          <h4>Assigned Subjects</h4>
          <div style={{overflowX:'auto'}}>
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
                    <button className="btn" onClick={()=>removeAssignment(a.id)}><FaTrash style={{marginRight:6,verticalAlign:'-2px'}}/>Remove</button>
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

        {/* Bulk Operations */}
        <div className="card" style={{gridColumn:'1 / -1'}}>
          <h3 style={{marginTop:0}}>Bulk Operations</h3>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr', gap:16}}>
            
            {/* Single Subject Bulk Assign */}
            <div>
              <h4 style={{marginTop:0}}>Assign One Subject</h4>
              <div className="grid form">
                <label>Level Group</label>
                <select value={bulkLevel} onChange={(e)=>setBulkLevel(e.target.value)}>
                  <option value="PRIMARY">Primary (Basic 1-6)</option>
                  <option value="JHS">JHS (Basic 7-9)</option>
                </select>
                <label>Subject</label>
                <select value={bulkSubjectId} onChange={(e)=>setBulkSubjectId(e.target.value)}>
                  <option value="">Select subject…</option>
                  {(subjects||[]).filter(s => (
                    bulkLevel === 'PRIMARY' ? (s.category === 'PRIMARY' || s.category === 'BOTH') : (s.category === 'JHS' || s.category === 'BOTH')
                  )).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
                <button className="btn" type="button" onClick={bulkAssign} disabled={bulkRunning || !bulkSubjectId}>Bulk Assign</button>
              </div>
            </div>

            {/* Multi Subject Bulk Assign */}
            <div>
              <h4 style={{marginTop:0}}>Assign Multiple Subjects</h4>
              <div style={{maxHeight:200, overflowY:'auto', border:'1px solid #ddd', padding:8, marginBottom:8}}>
                {(subjects||[]).filter(s => (
                  bulkLevel === 'PRIMARY' ? (s.category === 'PRIMARY' || s.category === 'BOTH') : (s.category === 'JHS' || s.category === 'BOTH')
                )).map(s => (
                  <label key={s.id} style={{display:'flex', alignItems:'center', gap:8, marginBottom:6, cursor:'pointer'}}>
                    <input 
                      type="checkbox" 
                      checked={multiSubjectIds.includes(s.id)}
                      onChange={() => toggleMultiSubject(s.id)}
                      style={{margin:0}}
                    />
                    <span>
                      {s.name} <span className="chip">{s.category}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div style={{display:'flex', gap:8}}>
                <button className="btn" type="button" onClick={bulkAssignMultiple} disabled={bulkRunning || !multiSubjectIds.length}>Assign Selected ({multiSubjectIds.length})</button>
                <button className="btn" type="button" onClick={()=>setMultiSubjectIds([])} disabled={!multiSubjectIds.length}>Clear</button>
              </div>
            </div>

            {/* Bulk Remove */}
            <div>
              <h4 style={{marginTop:0}}>Remove Subject</h4>
              <div className="grid form">
                <label>Subject to Remove</label>
                <select value={removeSubjectId} onChange={(e)=>setRemoveSubjectId(e.target.value)}>
                  <option value="">Select subject…</option>
                  {(subjects||[]).filter(s => (
                    bulkLevel === 'PRIMARY' ? (s.category === 'PRIMARY' || s.category === 'BOTH') : (s.category === 'JHS' || s.category === 'BOTH')
                  )).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
                <button className="btn" type="button" onClick={bulkRemove} disabled={removeRunning || !removeSubjectId} style={{backgroundColor:'#ef4444', color:'white'}}>Bulk Remove</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
