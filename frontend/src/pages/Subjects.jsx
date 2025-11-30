import { useEffect, useMemo, useState } from 'react'
import api from '../utils/api'
import { FaBook, FaPlus, FaTrash, FaLayerGroup, FaCheck, FaTasks, FaGraduationCap, FaCog, FaUsers, FaBolt, FaList, FaSearch } from 'react-icons/fa'
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
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')

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

  if (loading) {
    return (
      <div className="subjects-page">
        <style>{`
          .subjects-page {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .loading-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          
          .loading-spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-radius: 50%;
            border-top-color: #6366f1;
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 16px;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .loading-text {
            color: #374151;
            font-size: 18px;
            font-weight: 500;
          }
        `}</style>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading subjects...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="subjects-page">
      {/* Mobile-optimized viewport settings */}
      <style>{`
        @viewport {
          width: device-width;
          initial-scale: 1;
        }
        
        .subjects-page {
          min-height: 100vh;
          max-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .subjects-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 16px;
          min-height: calc(100vh - 32px);
          overflow-y: auto;
        }
        
        .subjects-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .subjects-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .subjects-title svg {
          font-size: 32px;
          color: #6366f1;
          filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3));
        }
        
        .search-filter-bar {
          display: grid;
          gap: 16px;
          margin-top: 20px;
          grid-template-columns: 1fr auto;
          align-items: end;
        }
        
        .search-group {
          position: relative;
        }
        
        .search-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          background: white;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .search-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          font-size: 16px;
        }
        
        .filter-select {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          font-size: 16px;
          min-width: 150px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .filter-select:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .subjects-grid {
          display: grid;
          gap: 24px;
          grid-template-columns: 1fr;
        }
        
        .subjects-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        
        .subjects-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }
        
        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f3f4f6;
        }
        
        .card-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }
        
        .card-icon {
          font-size: 20px;
          color: #6366f1;
        }
        
        .form-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .form-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        
        .form-input {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: white;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          text-decoration: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }
        
        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 2px solid #e5e7eb;
        }
        
        .btn-secondary:hover {
          background: #e5e7eb;
          transform: translateY(-1px);
        }
        
        .btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        
        .btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }
        
        .checkbox-container {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          max-height: 400px;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8fafc;
        }
        
        .checkbox-container::-webkit-scrollbar {
          width: 8px;
        }
        
        .checkbox-container::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 4px;
        }
        
        .checkbox-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .checkbox-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .checkbox-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          margin-bottom: 12px;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          margin-bottom: 8px;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
        }
        
        .checkbox-item:hover {
          background: #f1f5f9;
          transform: translateX(4px);
          border-color: #cbd5e1;
        }
        
        .checkbox-input {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #6366f1;
        }
        
        .checkbox-label {
          flex: 1;
          font-weight: 500;
          color: #374151;
        }
        
        .checkbox-badge {
          background: #e0e7ff;
          color: #3730a3;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .subjects-table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          background: white;
        }
        
        .table-wrapper {
          overflow-x: auto;
          overflow-y: visible;
          border-radius: 12px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8fafc;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .table-wrapper::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .table-wrapper::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 4px;
        }
        
        .table-wrapper::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .table-wrapper::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .subjects-table th {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .subjects-table td {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          color: #374151;
        }
        
        .subjects-table tr:hover {
          background: #f8fafc;
        }
        
        .subjects-table tr:last-child td {
          border-bottom: none;
        }
        
        .alert {
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .alert-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        
        .alert-success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        
        .alert-info {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }
        
        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          font-size: 18px;
          color: #6b7280;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }
        
        .empty-state svg {
          font-size: 48px;
          color: #d1d5db;
          margin-bottom: 16px;
        }
        
        /* Responsive Design - Mobile First */
        @media (max-width: 480px) {
          .subjects-container {
            padding: 12px;
          }
          
          .subjects-header {
            padding: 16px;
          }
          
          .subjects-title {
            font-size: 24px;
          }
          
          .search-filter-bar {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .subjects-card {
            padding: 16px;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .btn {
            padding: 14px 20px;
            font-size: 16px;
          }
          
          .subjects-table {
            font-size: 14px;
          }
          
          .subjects-table th,
          .subjects-table td {
            padding: 12px 8px;
          }
          
          .checkbox-container {
            max-height: 200px;
          }
        }
        
        @media (min-width: 481px) and (max-width: 768px) {
          .subjects-grid {
            grid-template-columns: 1fr;
          }
          
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 769px) {
          .subjects-page {
            padding: 20px;
            overflow-y: scroll;
            scrollbar-width: auto;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
          }
          
          .subjects-page::-webkit-scrollbar {
            width: 12px;
          }
          
          .subjects-page::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
          }
          
          .subjects-page::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 6px;
          }
          
          .subjects-page::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          
          .subjects-container {
            padding: 20px;
            min-height: auto;
            overflow-y: visible;
          }
          
          .subjects-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
          }
          
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .search-filter-bar {
            grid-template-columns: 1fr auto;
          }
          
          .subjects-card {
            max-height: none;
            overflow: visible;
          }
          
          .checkbox-container {
            max-height: 350px;
          }
          
          .table-wrapper {
            max-height: 450px;
          }
        }
        
        @media (min-width: 1200px) {
          .subjects-container {
            padding: 24px;
          }
          
          .subjects-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 32px;
          }
          
          .checkbox-container {
            max-height: 400px;
          }
          
          .table-wrapper {
            max-height: 500px;
          }
        }
        
        @media (min-width: 1400px) {
          .subjects-container {
            padding: 32px;
          }
          
          .subjects-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 36px;
          }
          
          .checkbox-container {
            max-height: 450px;
          }
          
          .table-wrapper {
            max-height: 600px;
          }
        }
        
        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
      
      <div className="subjects-container">
        {/* Header Section */}
        <header className="subjects-header">
          <h1 className="subjects-title">
            <FaGraduationCap />
            Subjects Management
          </h1>
          
          {/* Search and Filter Bar */}
          <div className="search-filter-bar">
            <div className="search-group">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search subjects by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search subjects"
              />
            </div>
            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="ALL">All Categories</option>
              <option value="PRIMARY">Primary (1-6)</option>
              <option value="JHS">JHS (7-9)</option>
              <option value="BOTH">Both Levels</option>
            </select>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error" role="alert">
            <FaBolt />
            {error}
          </div>
        )}
        
        {msg && (
          <div className="alert alert-success" role="alert">
            <FaCheck />
            {msg}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="subjects-grid">
          {/* Create Subject Card */}
          <div className="subjects-card">
            <div className="card-header">
              <FaPlus className="card-icon" />
              <h2 className="card-title">Create New Subject</h2>
            </div>
            
            <form onSubmit={createSubject}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="subject-name">Subject Name</label>
                  <input
                    id="subject-name"
                    type="text"
                    className="form-input"
                    value={newSubj.name}
                    onChange={(e) => setNewSubj(s => ({...s, name: e.target.value}))}
                    required
                    placeholder="e.g., Mathematics"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="subject-code">Subject Code</label>
                  <input
                    id="subject-code"
                    type="text"
                    className="form-input"
                    value={newSubj.code}
                    onChange={(e) => setNewSubj(s => ({...s, code: e.target.value}))}
                    required
                    placeholder="e.g., MATH"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="subject-category">Category</label>
                  <select
                    id="subject-category"
                    className="form-input"
                    value={newSubj.category}
                    onChange={(e) => setNewSubj(s => ({...s, category: e.target.value}))}
                  >
                    <option value="PRIMARY">PRIMARY (Basic 1-6)</option>
                    <option value="JHS">JHS (Basic 7-9)</option>
                    <option value="BOTH">BOTH</option>
                  </select>
                </div>
                
                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                  <label className="form-label" htmlFor="subject-description">Description (Optional)</label>
                  <textarea
                    id="subject-description"
                    className="form-input form-textarea"
                    value={newSubj.description}
                    onChange={(e) => setNewSubj(s => ({...s, description: e.target.value}))}
                    placeholder="Brief description of the subject..."
                    rows={3}
                  />
                </div>
                
                <div style={{gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px'}}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setNewSubj({name: '', code: '', category: 'BOTH', description: ''})}
                  >
                    <FaCog />
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creating}
                  >
                    <FaPlus />
                    {creating ? 'Creating...' : 'Create Subject'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* All Subjects Card */}
          <div className="subjects-card">
            <div className="card-header">
              <FaList className="card-icon" />
              <h2 className="card-title">
                All Subjects ({filteredSubjects.length})
              </h2>
            </div>
            
            <div className="table-wrapper">
              <table className="subjects-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map(subject => (
                    <tr key={subject.id}>
                      <td style={{fontWeight: '500'}}>{subject.name}</td>
                      <td style={{fontFamily: 'monospace', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', display: 'inline-block'}}>{subject.code}</td>
                      <td>
                        <span className="checkbox-badge">
                          {subject.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredSubjects.length === 0 && (
                    <tr>
                      <td colSpan="3" className="empty-state">
                        <FaBook />
                        <div>No subjects found</div>
                        <small>Try adjusting your search or filter criteria</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Class Assignment Card */}
          <div className="subjects-card" style={{gridColumn: '1 / -1'}}>
            <div className="card-header">
              <FaUsers className="card-icon" />
              <h2 className="card-title">Assign to Classes</h2>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="class-select">Select Class</label>
                <select
                  id="class-select"
                  className="form-input"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {(c.level_display || c.level)}{c.section ? ` ${c.section}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Assignment Mode</label>
                <div style={{display: 'flex', gap: '16px', marginTop: '8px'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                    <input
                      type="radio"
                      className="checkbox-input"
                      checked={!multiAssignMode}
                      onChange={() => {
                        setMultiAssignMode(false)
                        setSelectedSubjectIds([])
                      }}
                    />
                    <span>Single Subject</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                    <input
                      type="radio"
                      className="checkbox-input"
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
                <div style={{gridColumn: '1 / -1'}}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="subject-select">Select Subject</label>
                    <div style={{display: 'flex', gap: '12px'}}>
                      <select
                        id="subject-select"
                        className="form-input"
                        value={assignSubjectId}
                        onChange={(e) => setAssignSubjectId(e.target.value)}
                        style={{flex: 1}}
                      >
                        <option value="">Choose a subject...</option>
                        {unassignedSubjects.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.category})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={assignToClass}
                        disabled={!assignSubjectId || !selectedClass}
                      >
                        <FaCheck />
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{gridColumn: '1 / -1'}}>
                  <div className="form-group">
                    <label className="form-label">
                      Select Subjects ({selectedSubjectIds.length} selected)
                    </label>
                    <div className="checkbox-container">
                      <div className="checkbox-header">
                        <input
                          type="checkbox"
                          className="checkbox-input"
                          checked={selectedSubjectIds.length === unassignedSubjects.length && unassignedSubjects.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubjectIds(unassignedSubjects.map(s => String(s.id)))
                            } else {
                              setSelectedSubjectIds([])
                            }
                          }}
                        />
                        <span>Select All ({unassignedSubjects.length} available)</span>
                      </div>
                      {unassignedSubjects.map(s => (
                        <div key={s.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            className="checkbox-input"
                            checked={selectedSubjectIds.includes(String(s.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubjectIds(prev => [...prev, String(s.id)])
                              } else {
                                setSelectedSubjectIds(prev => prev.filter(id => id !== String(s.id)))
                              }
                            }}
                          />
                          <span className="checkbox-label">{s.name}</span>
                          <span className="checkbox-badge">{s.category}</span>
                        </div>
                      ))}
                      {unassignedSubjects.length === 0 && (
                        <div className="empty-state">
                          <FaCheck />
                          <div>All compatible subjects already assigned</div>
                        </div>
                      )}
                    </div>
                    <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px'}}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setSelectedSubjectIds([])}
                        disabled={selectedSubjectIds.length === 0}
                      >
                        Clear Selection
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={assignMultipleToClass}
                        disabled={selectedSubjectIds.length === 0 || !selectedClass}
                      >
                        <FaCheck />
                        Assign {selectedSubjectIds.length} Subject{selectedSubjectIds.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{gridColumn: '1 / -1'}}>
                {selectedClass && (
                  <div className="alert alert-info">
                    <FaTasks />
                    Allowed categories for this class: {allowedCategory === 'BOTH' ? 'PRIMARY & JHS' : allowedCategory}
                    {multiAssignMode && selectedSubjectIds.length > 0 && (
                      <div style={{marginTop: '8px'}}>
                        Ready to assign {selectedSubjectIds.length} subject{selectedSubjectIds.length !== 1 ? 's' : ''} to this class
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Subjects Table */}
            <div style={{marginTop: '32px'}}>
              <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
                <FaCheck style={{color: '#16a34a'}} />
                Assigned Subjects ({classAssignments.length})
              </h3>
              <div className="table-wrapper">
                <table className="subjects-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Teacher</th>
                      <th style={{textAlign: 'center'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classAssignments.map(assignment => (
                      <tr key={assignment.id}>
                        <td style={{fontWeight: '500'}}>{assignment.subject_name || assignment.subject?.name}</td>
                        <td>{assignment.teacher_name || <span style={{color: '#6b7280', fontStyle: 'italic'}}>No teacher assigned</span>}</td>
                        <td style={{textAlign: 'center'}}>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => removeAssignment(assignment.id)}
                            style={{fontSize: '12px', padding: '8px 12px'}}
                          >
                            <FaTrash />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {classAssignments.length === 0 && (
                      <tr>
                        <td colSpan="3" className="empty-state">
                          <FaBook />
                          <div>No subjects assigned yet</div>
                          <small>Use the assignment form above to add subjects</small>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
