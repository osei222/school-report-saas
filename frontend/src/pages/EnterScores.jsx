import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { FaBookOpen, FaSave, FaChevronLeft, FaChevronRight, FaCheck, FaArrowLeft, FaUser, FaBookReader, FaGraduationCap } from 'react-icons/fa'
import { useAuth } from '../state/AuthContext'
import ScrollableSelect from '../components/ScrollableSelect'

export default function EnterScores() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const locationState = location.state || {}
  
  // Wizard steps: setup → scoring (skip setup if data provided)
  const [step, setStep] = useState(locationState.classId ? 'scoring' : 'setup')
  
  // School settings
  const [schoolSettings, setSchoolSettings] = useState(null)
  
  // Setup data
  const [classes, setClasses] = useState([])
  const [terms, setTerms] = useState([])
  const [classSubjects, setClassSubjects] = useState([])
  const [students, setStudents] = useState(locationState.students || [])
  
  // Selected configuration - initialize with location state if available
  const [selectedClass, setSelectedClass] = useState(locationState.classId ? String(locationState.classId) : '')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [multiSubjectMode, setMultiSubjectMode] = useState(false)
  
  // Pre-selected data from Classes page
  const [preSelectedData, setPreSelectedData] = useState({
    className: locationState.className || '',
    classId: locationState.classId || null,
    students: locationState.students || [],
    isFormTeacher: locationState.isFormTeacher || false,
    subjectAssignments: locationState.subjectAssignments || []
  })
  
  // Current student scoring
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0)
  const [scores, setScores] = useState({
    task: 0, homework: 0, group_work: 0, 
    project_work: 0, class_test: 0, exam_score: 0
  })
  const [allScores, setAllScores] = useState({})
  
  // State
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedStudents, setSavedStudents] = useState(new Set())
  const [loadingClassData, setLoadingClassData] = useState(false)
  
  // Batch Preview State
  const [showBatchPreview, setShowBatchPreview] = useState(false)
  const [batchPreviewData, setBatchPreviewData] = useState([])
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0)
  const [generatingPreviews, setGeneratingPreviews] = useState(false)

  // Load initial data including school settings
  useEffect(() => {
    loadInitialData()
    
    // If data was passed from Classes page, load subject details
    if (locationState.classId && locationState.subjectId) {
      console.log('Pre-selected data from Classes page:', locationState)
      loadSubjectDetails()
    }
  }, [user])

  const loadSubjectDetails = async () => {
    try {
      // Load the specific subject assignment details
      const csRes = await api.get(`/schools/class-subjects/${locationState.subjectId}/`)
      const subjectAssignment = csRes.data
      
      setClassSubjects([subjectAssignment])
      console.log('Loaded subject assignment:', subjectAssignment)
    } catch (e) {
      console.error('Failed to load subject details:', e)
      setError('Failed to load subject assignment details')
    }
  }

  const loadInitialData = async () => {
    try {
      setError('')
      const [clsRes, termRes, dashboardRes] = await Promise.all([
        api.get('/schools/classes/'),
        api.get('/schools/terms/'),
        api.get('/schools/dashboard/')
      ])
      
      const clsList = clsRes.data.results || clsRes.data
      const termList = termRes.data.results || termRes.data
      const schoolData = dashboardRes.data.school
      
      setSchoolSettings(schoolData)
      setTerms(termList)
      
      // Handle class selection based on teacher role
      if (user?.role === 'TEACHER') {
        const teacherClass = (clsList || []).find(c => c.class_teacher === user.id)
        
        console.log('Initial teacher class assignment:', teacherClass)
        console.log('All available classes for teacher:', clsList)
        
        if (teacherClass) {
          // Teacher is assigned as class teacher
          console.log('Teacher is class teacher for:', teacherClass)
          setClasses([teacherClass])
          setSelectedClass(String(teacherClass.id))
          // Store the teacher class info in user object for later use
          if (user) {
            user.assigned_class_id = teacherClass.id
          }
          setTimeout(() => loadClassData(teacherClass.id), 100)
        } else if (schoolData.score_entry_mode === 'CLASS_TEACHER') {
          // School is in class teacher mode but this teacher has no assigned class
          setError('You are not assigned as class teacher to any class yet. Please contact admin to assign you a class.')
          return
        } else {
          // Subject teacher mode: show all classes where teacher might teach
          console.log('Teacher in subject teacher mode')
          setClasses(clsList)
        }
      } else {
        // Admin/Principal can access all classes
        setClasses(clsList)
      }
      
      // Auto-select current term
      const currentTerm = termList.find(t => t.is_current) || termList[0]
      if (currentTerm) {
        setSelectedTerm(String(currentTerm.id))
      }
    } catch (e) {
      setError('Failed to load initial data')
    }
  }

  // Load class-specific data when class changes or when pre-selected data exists
  useEffect(() => {
    if (selectedClass && user) {
      console.log('useEffect triggered - selectedClass:', selectedClass, 'user:', user?.id)
      // If students are already provided from Classes page, don't reload them
      if (preSelectedData.students && preSelectedData.students.length > 0) {
        console.log('Using pre-loaded students from Classes page:', preSelectedData.students.length)
        setStudents(preSelectedData.students)
      } else {
        // Add small delay to prevent rapid fire calls
        const timeoutId = setTimeout(() => {
          loadClassData()
        }, 100)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [selectedClass, user, preSelectedData.students])

  const loadClassData = async (classId = null) => {
    const targetClass = classId || selectedClass
    if (!targetClass) {
      console.log('No target class, aborting loadClassData')
      return
    }
    
    if (loadingClassData) {
      console.log('Already loading class data, skipping...')
      return
    }
    
    setLoadingClassData(true)
    setError('') // Clear previous errors
    
    console.log('Loading class data for:', targetClass)
    console.log('Current user:', user)
    console.log('Available classes:', classes)
    
    try {
      console.log('Making API calls...')
      const [studRes, csRes] = await Promise.all([
        api.get(`/students/?class_id=${targetClass}`),
        api.get(`/schools/class-subjects/?class_instance=${targetClass}`)
      ])
      
      const studList = studRes.data.results || studRes.data
      const csList = csRes.data.results || csRes.data
      
      console.log('API Response - Students:', studList)
      console.log('API Response - Class Subjects:', csList)
      
      if (!Array.isArray(studList)) {
        console.error('Students response is not an array:', studList)
        setError('Invalid students data received')
        return
      }
      
      if (!Array.isArray(csList)) {
        console.error('Class subjects response is not an array:', csList)
        setError('Invalid subjects data received')
        return
      }
      
      setStudents(studList)
      
      // Set available subjects based on teacher type from Classes page
      if (preSelectedData.isFormTeacher) {
        // Form teacher can access ALL subjects for their class
        console.log('Form teacher - loading ALL subjects for class')
        setClassSubjects(csList || [])
      } else if (preSelectedData.subjectAssignments && preSelectedData.subjectAssignments.length > 0) {
        // Subject teacher can only access assigned subjects
        console.log('Subject teacher - loading assigned subjects only:', preSelectedData.subjectAssignments)
        const assignedSubjects = csList.filter(cs => 
          preSelectedData.subjectAssignments.some(sa => sa.subjectId === cs.subject.id)
        )
        setClassSubjects(assignedSubjects)
      } else {
        // Fallback to original logic for backwards compatibility
        // Handle subject filtering based on school mode
        if (user?.role === 'TEACHER') {
          // Multiple ways to detect if user is class teacher for this class
          const isClassTeacherMethod1 = user.class_teacher_id === Number(targetClass)
          const isClassTeacherMethod2 = user.assigned_class_id === Number(targetClass) 
          const isClassTeacherMethod3 = Array.isArray(classes) && classes.some(c => c.class_teacher === user.id && String(c.id) === targetClass)
          
          // Additional check: see if any subject in this class has this teacher as class teacher
          const isClassTeacherMethod4 = (csList || []).length > 0 && (csList || []).some(cs => 
            cs.class_instance_details?.class_teacher === user.id || 
            cs.class_teacher === user.id
          )
          
          const isClassTeacher = isClassTeacherMethod1 || isClassTeacherMethod2 || isClassTeacherMethod3 || isClassTeacherMethod4
          
          if (isClassTeacher) {
            // If user is the class teacher for this class, show ALL subjects
            console.log('✅ Class teacher accessing all subjects for their class:', csList)
            setClassSubjects(csList || [])
          } else if (schoolSettings?.score_entry_mode === 'CLASS_TEACHER') {
            // In class teacher mode but not their class, show all subjects anyway
            console.log('✅ Class teacher mode - showing all subjects:', csList)
            setClassSubjects(csList || [])
          } else {
            // Subject teacher mode: show subjects they teach
            const teacherSubjects = (csList || []).filter(cs => cs.teacher === user.id)
            console.log('📚 Subject teacher filtered subjects:', teacherSubjects)
            setClassSubjects(teacherSubjects)
          }
        } else {
          // Admin/Principal can access all subjects
          console.log('👑 Admin/Principal accessing all subjects:', csList)
          setClassSubjects(csList || [])
        }
      }
      
      console.log('Final classSubjects set to:', csList || [])
    } catch (e) {
      console.error('Error loading class data:', e)
      console.error('Error response:', e.response?.data)
      console.error('Error status:', e.response?.status)
      setError(`Failed to load class data: ${e.response?.data?.error || e.message}`)
      // Reset states on error
      setStudents([])
      setClassSubjects([])
    } finally {
      setLoadingClassData(false)
    }
  }

  const canProceedToScoring = () => {
    // If data was pre-selected from Classes page, just check if we have students and term
    if (preSelectedData.classId) {
      return selectedTerm && students.length > 0
    }
    
    // Otherwise, use the normal validation
    if (multiSubjectMode) {
      return selectedClass && selectedTerm && selectedSubjects.length > 0 && students.length > 0
    }
    return selectedClass && selectedTerm && selectedSubject && students.length > 0
  }

  const startScoring = () => {
    if (!canProceedToScoring()) return
    setCurrentStudentIndex(0)
    setScores({ task: 0, homework: 0, group_work: 0, project_work: 0, class_test: 0, exam_score: 0 })
    
    // Initialize allScores structure for multi-subject mode
    if (multiSubjectMode) {
      const initialScores = {}
      students.forEach(student => {
        initialScores[student.id] = {}
        selectedSubjects.forEach(subjectId => {
          initialScores[student.id][subjectId] = {
            task: 0, homework: 0, group_work: 0, 
            project_work: 0, class_test: 0, exam_score: 0
          }
        })
      })
      setAllScores(initialScores)
    }
    
    setSavedStudents(new Set())
    setStep('scoring')
  }

  const backToSetup = () => {
    setStep('setup')
    setMessage('')
    setError('')
  }

  const currentStudent = students[currentStudentIndex]
  const progressPercent = students.length ? Math.round(((savedStudents.size) / students.length) * 100) : 0

  // Score limits for validation
  const scoreLimits = {
    task: 10,
    homework: 10,
    group_work: 10,
    project_work: 10,
    class_test: 10,
    exam_score: 50
  }

  const handleScoreChange = (field, value) => {
    if (value === '') {
      setScores(prev => ({ ...prev, [field]: '' }))
      return
    }

    const numValue = parseFloat(value)
    
    // Check if input is a valid number
    if (isNaN(numValue)) {
      setError(`Please enter a valid number for ${field.replace('_', ' ')}`)
      return
    }

    // Check if score exceeds maximum limit
    const maxLimit = scoreLimits[field]
    if (numValue > maxLimit) {
      const confirmed = window.confirm(
        `The score ${numValue} for ${field.replace('_', ' ')} exceeds the maximum limit of ${maxLimit}.\n\nDo you want to set it to the maximum allowed value (${maxLimit})?`
      )
      
      if (confirmed) {
        setScores(prev => ({ ...prev, [field]: maxLimit }))
        setError('')
      } else {
        // Keep the previous valid value
        return
      }
    } else if (numValue < 0) {
      setError(`Score cannot be negative for ${field.replace('_', ' ')}`)
      return
    } else {
      setScores(prev => ({ ...prev, [field]: numValue }))
      setError('') // Clear any previous errors
    }
  }

  // Auto-save and change subject
  const changeSubjectWithAutoSave = async (newSubjectIndex) => {
    const currentSubjectId = multiSubjectMode ? selectedSubjects[currentSubjectIndex] : selectedSubject
    
    // Store current scores in memory even if not saved to backend
    if (currentStudent && currentSubjectId) {
      setAllScores(prev => ({
        ...prev,
        [currentStudent.id]: {
          ...prev[currentStudent.id],
          [currentSubjectId]: { ...scores, saved: false }
        }
      }))
    }
    
    // Check if there are unsaved changes
    const hasScores = Object.values(scores).some(score => score !== '' && score !== 0)
    
    if (hasScores && currentStudent) {
      // Show confirmation dialog
      const shouldSave = window.confirm(
        `You have unsaved scores for ${currentStudent.get_full_name || currentStudent.full_name || (currentStudent.first_name + ' ' + currentStudent.last_name)}.\n\nDo you want to save before switching subjects?`
      )
      
      if (shouldSave) {
        try {
          setSaving(true)
          await saveCurrentStudent()
          setMessage('')
          setError('')
        } catch (error) {
          setError('Failed to save scores. Please try again.')
          setSaving(false)
          return // Don't change subject if save failed
        } finally {
          setSaving(false)
        }
      }
    }
    
    // Change to new subject
    console.log('🔄 Switching from subject', currentSubjectIndex, 'to subject', newSubjectIndex)
    setCurrentSubjectIndex(newSubjectIndex)
  }

  // Load existing scores for current student and subject
  const loadStudentScores = async () => {
    if (!currentStudent) return
    
    const currentSubjectId = multiSubjectMode ? selectedSubjects[currentSubjectIndex] : selectedSubject
    if (!currentSubjectId) return
    
    console.log('🔄 Loading scores for student:', currentStudent.full_name, 'subject:', currentSubjectId)
    
    try {
      // Check if we have scores in allScores first (in-memory cache)
      const existingScores = allScores[currentStudent.id]?.[currentSubjectId]
      if (existingScores) {
        console.log('📦 Found cached scores:', existingScores)
        setScores({
          task: existingScores.task || 0,
          homework: existingScores.homework || 0,
          group_work: existingScores.group_work || 0,
          project_work: existingScores.project_work || 0,
          class_test: existingScores.class_test || 0,
          exam_score: existingScores.exam_score || 0
        })
        return
      }
      
      // Try to fetch from backend
      console.log('🌐 Fetching scores from backend...')
      const res = await api.get(`/scores/manage/student-scores/?student_id=${currentStudent.id}&class_subject_id=${currentSubjectId}&term_id=${selectedTerm}`)
      if (res.data && res.data.length > 0) {
        const score = res.data[0]
        console.log('💾 Found saved scores in database:', score)
        const loadedScores = {
          task: score.task || 0,
          homework: score.homework || 0,
          group_work: score.group_work || 0,
          project_work: score.project_work || 0,
          class_test: score.class_test || 0,
          exam_score: score.exam_score || 0
        }
        setScores(loadedScores)
        
        // Cache the loaded scores
        setAllScores(prev => ({
          ...prev,
          [currentStudent.id]: {
            ...prev[currentStudent.id],
            [currentSubjectId]: { ...loadedScores, saved: true }
          }
        }))
      } else {
        // No existing scores, reset to empty
        console.log('🆕 No existing scores found, starting fresh')
        setScores({
          task: 0,
          homework: 0,
          group_work: 0,
          project_work: 0,
          class_test: 0,
          exam_score: 0
        })
      }
    } catch (e) {
      console.error('❌ Error loading scores:', e)
      // If error fetching, reset to empty
      setScores({
        task: 0,
        homework: 0,
        group_work: 0,
        project_work: 0,
        class_test: 0,
        exam_score: 0
      })
    }
  }

  const saveCurrentStudent = async () => {
    if (!currentStudent) return
    
    setSaving(true)
    setMessage('')
    setError('')
    
    try {
      const currentSubjectId = multiSubjectMode ? selectedSubjects[currentSubjectIndex] : selectedSubject
      
      const payload = {
        student_id: currentStudent.id,
        class_id: selectedClass,
        class_subject_id: currentSubjectId,
        term_id: selectedTerm,
        ...scores
      }
      
      console.log('📤 Sending scores data:', payload)
      console.log('🔑 Current user:', user)
      console.log('📍 API endpoint:', '/scores/manage/enter_scores/')
      
      const res = await api.post('/scores/manage/enter_scores/', payload)
      
      if (multiSubjectMode) {
        // Update allScores for tracking
        setAllScores(prev => ({
          ...prev,
          [currentStudent.id]: {
            ...prev[currentStudent.id],
            [currentSubjectId]: { ...scores, saved: true }
          }
        }))
        
        const subjectName = classSubjects.find(cs => String(cs.id) === currentSubjectId)?.subject_name
        setMessage(`✓ Saved ${currentStudent.get_full_name || currentStudent.full_name || (currentStudent.first_name + ' ' + currentStudent.last_name)} - ${subjectName} - Total: ${res.data.total_score}, Grade: ${res.data.grade}`)
      } else {
        setSavedStudents(prev => new Set([...prev, currentStudent.id]))
        setMessage(`✓ Saved ${currentStudent.get_full_name || currentStudent.full_name || (currentStudent.first_name + ' ' + currentStudent.last_name)} - Total: ${res.data.total_score}, Grade: ${res.data.grade}`)
      }
    } catch (e) {
      console.error('❌ Save scores error:', e)
      console.error('❌ Error response:', e.response?.data)
      console.error('❌ Error status:', e.response?.status)
      setError(e?.response?.data?.error || 'Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

  // Generate Terminal Report for current student
  const generateTerminalReport = async () => {
    if (!currentStudent) return
    
    setSaving(true)
    setMessage('')
    setError('')
    
    try {
      const res = await api.post('/reports/report-cards/generate_terminal_report/', {
        student_id: currentStudent.id,
        term_id: selectedTerm
      })
      
      setMessage(`✅ Terminal report generated successfully for ${currentStudent.get_full_name || currentStudent.full_name || currentStudent.first_name + ' ' + currentStudent.last_name}`)
      
      // Open terminal report preview in new tab
      if (res.data.template_url) {
        const baseURL = window.location.origin.replace(':3001', ':8000') // Switch from frontend to backend port
        window.open(`${baseURL}/api/reports/report-cards${res.data.template_url}`, '_blank')
      } else if (res.data.term_result_id) {
        // Fallback: construct preview URL manually
        const baseURL = window.location.origin.replace(':3001', ':8000')
        window.open(`${baseURL}/api/reports/report-cards/terminal-report-preview/${res.data.term_result_id}/`, '_blank')
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to generate terminal report')
    } finally {
      setSaving(false)
    }
  }

  // Generate PDF Report Card for current student
  const generateReportCard = async () => {
    if (!currentStudent) return
    
    setSaving(true)
    setMessage('')
    setError('')
    
    try {
      const res = await api.post('/reports/report-cards/generate_report/', {
        student_id: currentStudent.id,
        term_id: selectedTerm
      })
      
      setMessage(`🎉 Report card generated successfully for ${currentStudent.get_full_name || currentStudent.full_name || (currentStudent.first_name + ' ' + currentStudent.last_name)}`)
      
      // Download or open the PDF report
      if (res.data.report_url || res.data.pdf_url) {
        const reportUrl = res.data.report_url || res.data.pdf_url
        window.open(reportUrl, '_blank')
      } else if (res.data.report_id) {
        // If only report ID is returned, construct download URL
        window.open(`/api/reports/report-cards/${res.data.report_id}/download/`, '_blank')
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to generate report card')
    } finally {
      setSaving(false)
    }
  }

  // Check if all subjects are completed for current student
  const isStudentCompleted = () => {
    if (!currentStudent || !multiSubjectMode) return false
    
    // Check if all selected subjects have saved scores
    return selectedSubjects.every(subjectId => {
      const scores = allScores[currentStudent.id]?.[subjectId]
      return scores && scores.saved === true
    })
  }

  // Preview report with current scores (before saving)
  const previewReport = async () => {
    if (!currentStudent) return
    
    setSaving(true)
    setMessage('')
    setError('')
    
    try {
      // Collect all scores for this student across all subjects
      const allStudentScores = {}
      
      if (multiSubjectMode) {
        // Multi-subject mode: get scores from allScores state
        selectedSubjects.forEach(subjectId => {
          const subjectScores = allScores[currentStudent.id]?.[subjectId]
          if (subjectScores || subjectId === selectedSubjects[currentSubjectIndex]) {
            // Include current subject scores even if not saved yet
            const scoresData = subjectId === selectedSubjects[currentSubjectIndex] ? scores : subjectScores
            allStudentScores[subjectId] = {
              task: scoresData?.task || 0,
              homework: scoresData?.homework || 0,
              group_work: scoresData?.group_work || 0,
              project_work: scoresData?.project_work || 0,
              class_test: scoresData?.class_test || 0,
              exam_score: scoresData?.exam_score || 0
            }
          }
        })
      } else {
        // Single subject mode: use current scores
        allStudentScores[selectedSubject] = {
          task: scores.task || 0,
          homework: scores.homework || 0,
          group_work: scores.group_work || 0,
          project_work: scores.project_work || 0,
          class_test: scores.class_test || 0,
          exam_score: scores.exam_score || 0
        }
      }

      // Send preview request with all collected scores
      const res = await api.post('/reports/report-cards/preview_terminal_report/', {
        student_id: currentStudent.id,
        term_id: selectedTerm,
        preview_scores: allStudentScores
      })
      
      // Open preview in new window with authentication token
      if (res.data.preview_url) {
        const baseURL = window.location.origin.replace(':3000', ':8000').replace(':3001', ':8000')
        const token = localStorage.getItem('sr_token') // Fixed: was 'access_token', should be 'sr_token'
        console.log('Preview URL:', res.data.preview_url)
        console.log('Token retrieved:', token ? 'Found' : 'Not found')
        
        if (!token) {
          setError('Authentication token not found. Please login again.')
          return
        }
        
        const urlWithToken = `${baseURL}${res.data.preview_url}${res.data.preview_url.includes('?') ? '&' : '?'}token=${token}`
        console.log('Opening preview URL for report card')
        window.open(urlWithToken, '_blank')
      }
      
      setMessage(`📋 Preview generated for ${currentStudent.get_full_name || currentStudent.full_name || (currentStudent.first_name + ' ' + currentStudent.last_name)}`)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to generate preview')
    } finally {
      setSaving(false)
    }
  }

  // Generate preview for all students
  const generateBatchPreviews = async () => {
    if (!students.length) return
    
    setGeneratingPreviews(true)
    setError('')
    
    try {
      const previewData = []
      
      // Generate preview for each student
      for (let i = 0; i < students.length; i++) {
        const student = students[i]
        
        // Collect all scores for this student across all subjects
        const allStudentScores = {}
        
        if (multiSubjectMode) {
          selectedSubjects.forEach(subjectId => {
            const subjectScores = allScores[student.id]?.[subjectId]
            if (subjectScores) {
              allStudentScores[subjectId] = {
                task: subjectScores.task || 0,
                homework: subjectScores.homework || 0,
                group_work: subjectScores.group_work || 0,
                project_work: subjectScores.project_work || 0,
                class_test: subjectScores.class_test || 0,
                exam_score: subjectScores.exam_score || 0
              }
            }
          })
        } else {
          // For single subject mode, use the student's scores if they exist
          const studentScores = allScores[student.id]?.[selectedSubject]
          if (studentScores) {
            allStudentScores[selectedSubject] = {
              task: studentScores.task || 0,
              homework: studentScores.homework || 0,
              group_work: studentScores.group_work || 0,
              project_work: studentScores.project_work || 0,
              class_test: studentScores.class_test || 0,
              exam_score: studentScores.exam_score || 0
            }
          }
        }

        // Only generate preview if student has some scores
        if (Object.keys(allStudentScores).length > 0) {
          try {
            const res = await api.post('/reports/report-cards/preview_terminal_report/', {
              student_id: student.id,
              term_id: selectedTerm,
              preview_scores: allStudentScores
            })
            
            if (res.data.preview_url) {
              const token = localStorage.getItem('sr_token')
              const baseURL = window.location.origin.replace(':3000', ':8000').replace(':3001', ':8000')
              const urlWithToken = `${baseURL}${res.data.preview_url}${res.data.preview_url.includes('?') ? '&' : '?'}token=${token}`
              
              previewData.push({
                student: student,
                previewUrl: urlWithToken,
                hasScores: true,
                averageScore: res.data.average_score || 0,
                subjectsCount: res.data.subjects_count || 0
              })
            }
          } catch (e) {
            console.error(`Failed to generate preview for ${student.first_name}:`, e)
            previewData.push({
              student: student,
              previewUrl: null,
              hasScores: false,
              error: e.message
            })
          }
        } else {
          previewData.push({
            student: student,
            previewUrl: null,
            hasScores: false,
            error: 'No scores entered'
          })
        }
      }
      
      setBatchPreviewData(previewData)
      setCurrentPreviewIndex(0)
      setShowBatchPreview(true)
      
    } catch (e) {
      setError('Failed to generate batch previews: ' + (e?.response?.data?.error || e.message))
    } finally {
      setGeneratingPreviews(false)
    }
  }

  // Navigate between preview students
  const navigatePreview = (direction) => {
    if (direction === 'next' && currentPreviewIndex < batchPreviewData.length - 1) {
      setCurrentPreviewIndex(currentPreviewIndex + 1)
    } else if (direction === 'prev' && currentPreviewIndex > 0) {
      setCurrentPreviewIndex(currentPreviewIndex - 1)
    }
  }

  // Save all students with scores
  const saveAllStudents = async () => {
    setSaving(true)
    setError('')
    
    try {
      let savedCount = 0
      let errorCount = 0
      
      for (const student of students) {
        try {
          const allStudentScores = {}
          
          if (multiSubjectMode) {
            selectedSubjects.forEach(subjectId => {
              const subjectScores = allScores[student.id]?.[subjectId]
              if (subjectScores) {
                allStudentScores[subjectId] = subjectScores
              }
            })
          } else {
            const studentScores = allScores[student.id]?.[selectedSubject]
            if (studentScores) {
              allStudentScores[selectedSubject] = studentScores
            }
          }
          
          if (Object.keys(allStudentScores).length > 0) {
            await api.post('/scores/manage/enter_scores/', {
              student_id: student.id,
              class_id: selectedClass,
              term_id: selectedTerm,
              scores: allStudentScores
            })
            savedCount++
          }
        } catch (e) {
          console.error(`Failed to save scores for ${student.first_name}:`, e)
          errorCount++
        }
      }
      
      setMessage(`✅ Saved scores for ${savedCount} students${errorCount > 0 ? `. Failed to save ${errorCount} students.` : ''}`)
      setShowBatchPreview(false)
      
      // Refresh saved students set
      setSavedStudents(new Set(students.map(s => s.id)))
      
    } catch (e) {
      setError('Failed to save all students: ' + (e?.response?.data?.error || e.message))
    } finally {
      setSaving(false)
    }
  }

  const goToPreviousStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1)
      setMessage('')
      setError('')
    }
  }

  const goToNextStudent = () => {
    if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1)
      setMessage('')
      setError('')
    }
  }

  const saveAndNext = async () => {
    await saveCurrentStudent()
    if (currentStudentIndex < students.length - 1) {
      setTimeout(() => {
        goToNextStudent()
      }, 1000)
    }
  }

  // Load scores when student or subject changes
  useEffect(() => {
    if (step === 'scoring') {
      loadStudentScores()
    }
  }, [currentStudentIndex, currentSubjectIndex, selectedSubject, step])

  const totalScore = Object.values(scores).reduce((sum, score) => {
    const num = typeof score === 'string' ? (parseFloat(score) || 0) : score
    return sum + num
  }, 0)

  if (step === 'setup') {
    return (
      <div className="container">
        <div className="page-header">
          <h1 style={{display:'flex',alignItems:'center',gap:10}}>
            <FaBookOpen color="#c4b5fd"/> Enter Scores - Setup
          </h1>
        </div>
        
        {error && <div className="alert">{error}</div>}
        
        <div className="card">
          <h3 style={{marginTop:0}}>
            {user?.role === 'TEACHER' ? 
              (schoolSettings?.score_entry_mode === 'CLASS_TEACHER' ? 'Select Term & Subject' : 'Select Class, Term & Subject') 
              : 'Select Class, Term & Subject'}
          </h3>
          
          {schoolSettings?.score_entry_mode && (
            <div style={{marginBottom:16, padding:'8px 12px', background:'#0b1220', borderRadius:'6px', fontSize:13}}>
              <strong>School Mode:</strong> {schoolSettings.score_entry_mode === 'CLASS_TEACHER' ? 'Class Teacher Mode' : 'Subject Teacher Mode'}
              <br />
              <span className="muted">
                {schoolSettings.score_entry_mode === 'CLASS_TEACHER' 
                  ? 'Class teachers enter scores for all subjects in their class'
                  : 'Subject teachers enter scores only for subjects they teach'}
              </span>
            </div>
          )}
          
          <div className="form two-col" style={{marginTop:16}}>
            {(user?.role !== 'TEACHER' || schoolSettings?.score_entry_mode === 'SUBJECT_TEACHER') && (
              <div className="field">
                <label>Class</label>
                <ScrollableSelect
                  value={selectedClass}
                  onChange={setSelectedClass}
                  options={classes.map(c => ({
                    value: String(c.id),
                    label: `${c.level_display || c.level}${c.section ? ` ${c.section}` : ''}`
                  }))}
                  placeholder="Select class"
                />
              </div>
            )}

            {user?.role === 'TEACHER' && schoolSettings?.score_entry_mode === 'CLASS_TEACHER' && (
              <div className="field">
                <label>Your Class</label>
                <div style={{padding:'10px 12px', background:'var(--card)', borderRadius:'8px', border:'1px solid #10b981', color:'#86efac'}}>
                  <FaUser style={{marginRight:8}}/>
                  {classes[0] ? `${classes[0].level_display || classes[0].level}${classes[0].section ? ` ${classes[0].section}` : ''}` : 'Loading...'}
                </div>
              </div>
            )}

            <div className="field">
              <label>Term</label>
              <ScrollableSelect
                value={selectedTerm}
                onChange={setSelectedTerm}
                options={terms.map(t => ({
                  value: String(t.id),
                  label: t.name_display || t.name
                }))}
                placeholder="Select term"
              />
            </div>

            <div className="field">
              <label style={{marginBottom: '12px', display: 'block', fontWeight: '600', color: '#374151'}}>Subject Selection Mode</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setMultiSubjectMode(false)
                    setSelectedSubjects([])
                  }}
                  style={{
                    padding: '12px 16px',
                    border: `2px solid ${!multiSubjectMode ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    background: !multiSubjectMode ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'white',
                    color: !multiSubjectMode ? 'white' : '#374151',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  📚 Single Subject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMultiSubjectMode(true)
                    setSelectedSubject('')
                  }}
                  style={{
                    padding: '12px 16px',
                    border: `2px solid ${multiSubjectMode ? '#10b981' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    background: multiSubjectMode ? 'linear-gradient(135deg, #10b981, #047857)' : 'white',
                    color: multiSubjectMode ? 'white' : '#374151',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  🎯 Multi-Subject
                </button>
              </div>
            </div>

            {!multiSubjectMode ? (
              <div className="field">
                <label>Subject</label>
                <ScrollableSelect
                  value={selectedSubject}
                  onChange={setSelectedSubject}
                  options={classSubjects.map(cs => ({
                    value: String(cs.id),
                    label: `${cs.subject_name || cs.subject?.name}${cs.teacher_name ? ` (${cs.teacher_name})` : ''}`
                  }))}
                  placeholder="Select subject to enter scores"
                />
              </div>
            ) : (
              <div className="field">
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <h4 style={{
                      margin: 0,
                      color: '#1e293b',
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📋 Subject Selection
                    </h4>
                    <div style={{
                      background: selectedSubjects.length > 0 ? 'linear-gradient(135deg, #10b981, #047857)' : '#9ca3af',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {selectedSubjects.length}/{classSubjects.length} Selected
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSubjects.length === classSubjects.length) {
                        setSelectedSubjects([])
                      } else {
                        setSelectedSubjects(classSubjects.map(cs => String(cs.id)))
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      background: selectedSubjects.length === classSubjects.length ? '#f3f4f6' : 'white',
                      color: '#374151',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {selectedSubjects.length === classSubjects.length ? '❌ Deselect All' : '✅ Select All'} 
                    ({classSubjects.length} subjects)
                  </button>

                  <div style={{
                    maxHeight: '280px',
                    overflow: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '8px',
                    padding: '4px'
                  }}>
                    {classSubjects.map(cs => (
                      <div
                        key={cs.id}
                        onClick={() => {
                          if (selectedSubjects.includes(String(cs.id))) {
                            setSelectedSubjects(prev => prev.filter(id => id !== String(cs.id)))
                          } else {
                            setSelectedSubjects(prev => [...prev, String(cs.id)])
                          }
                        }}
                        style={{
                          padding: '12px',
                          border: `2px solid ${selectedSubjects.includes(String(cs.id)) ? '#10b981' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          background: selectedSubjects.includes(String(cs.id)) 
                            ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' 
                            : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedSubjects.includes(String(cs.id))) {
                            e.target.style.borderColor = '#9ca3af'
                            e.target.style.background = '#f9fafb'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedSubjects.includes(String(cs.id))) {
                            e.target.style.borderColor = '#e5e7eb'
                            e.target.style.background = 'white'
                          }
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: `2px solid ${selectedSubjects.includes(String(cs.id)) ? '#10b981' : '#d1d5db'}`,
                          background: selectedSubjects.includes(String(cs.id)) ? '#10b981' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {selectedSubjects.includes(String(cs.id)) && (
                            <span style={{color: 'white', fontSize: '12px', fontWeight: 'bold'}}>✓</span>
                          )}
                        </div>
                        <div style={{flex: 1, minWidth: 0}}>
                          <div style={{
                            fontWeight: '600',
                            color: selectedSubjects.includes(String(cs.id)) ? '#065f46' : '#374151',
                            fontSize: '14px',
                            lineHeight: '1.2',
                            marginBottom: '2px'
                          }}>
                            {cs.subject_name || cs.subject?.name}
                          </div>
                          {cs.teacher_name && (
                            <div style={{
                              fontSize: '12px',
                              color: selectedSubjects.includes(String(cs.id)) ? '#047857' : '#6b7280',
                              lineHeight: '1.2'
                            }}>
                              Teacher: {cs.teacher_name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedSubjects.length > 0 && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                      borderRadius: '8px',
                      border: '1px solid #3b82f6'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#1d4ed8',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        💡 <strong>Multi-Subject Mode:</strong> You'll enter scores for each student across all {selectedSubjects.length} selected subjects, one student at a time.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="field">
              {user?.role === 'TEACHER' && (
                <div className="muted" style={{fontSize:12,marginTop:4}}>
                  {(() => {
                    const teacherClass = classes.find(c => c.class_teacher === user.id)
                    const isClassTeacher = teacherClass && selectedClass === String(teacherClass.id)
                    
                    if (multiSubjectMode) {
                      return (
                        <span style={{color: '#3b82f6'}}>
                          📚 Multi-subject mode: Enter scores for all selected subjects, student by student
                        </span>
                      )
                    } else if (isClassTeacher) {
                      return (
                        <span style={{color: '#10b981'}}>
                          ✓ As class teacher, you can enter scores for all {classSubjects.length} subjects in your class
                        </span>
                      )
                    } else if (schoolSettings?.score_entry_mode === 'CLASS_TEACHER') {
                      return 'You can enter scores for all subjects in this class'
                    } else {
                      return `You can enter scores for ${classSubjects.length} subject(s) you teach`
                    }
                  })()} 
                </div>
              )}
              {loadingClassData && (
                <div className="muted" style={{fontSize:12,marginTop:4,color:'#3b82f6'}}>
                  🔄 Loading subjects...
                </div>
              )}
              {!loadingClassData && classSubjects.length === 0 && (
                <div className="muted" style={{fontSize:12,marginTop:4,color:'#ef4444'}}>
                  ❌ No subjects available. Please contact admin to assign subjects to this class.
                </div>
              )}
              {!loadingClassData && classSubjects.length > 0 && (
                <div className="muted" style={{fontSize:12,marginTop:4,color:'#10b981'}}>
                  ✅ {classSubjects.length} subject{classSubjects.length > 1 ? 's' : ''} found
                </div>
              )}
            </div>

            <div className="field">
              <label>Students Found</label>
              <div style={{padding:'10px 12px', background:'var(--card)', borderRadius:'8px', border:'1px solid #374151'}}>
                <FaUser style={{marginRight:8, color:'var(--muted)'}}/>
                {students.length} student{students.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div style={{marginTop:24, display:'flex', justifyContent:'center'}}>
            <button 
              className="btn primary" 
              onClick={startScoring}
              disabled={!canProceedToScoring()}
              style={{padding:'12px 32px'}}
            >
              <FaBookReader style={{marginRight:8,verticalAlign:'-2px'}}/>
              {multiSubjectMode 
                ? `Start Entering Scores (${selectedSubjects.length} subjects)`
                : 'Start Entering Scores'
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Header with pre-selected info if available */}
      {preSelectedData.className && (
        <div style={{
          background: 'linear-gradient(135deg, #059669, #047857)',
          color: 'white',
          padding: '20px 24px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <FaGraduationCap style={{ fontSize: '32px' }}/>
              <div>
                <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700' }}>
                  Enter Scores - {preSelectedData.className}
                </h1>
                <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
                  {preSelectedData.isFormTeacher ? (
                    <>🏫 Form Teacher • Can enter scores for ALL subjects • {students.length} Students</>
                  ) : (
                    <>📚 Subject Teacher • Can enter scores for {preSelectedData.subjectAssignments?.length || 0} assigned subject(s) • {students.length} Students</>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/classes')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaArrowLeft style={{ fontSize: '12px' }}/>
              Back to Classes
            </button>
          </div>
        </div>
      )}
      {/* Regular header for setup mode or back button for pre-selected mode */}
      {!preSelectedData.className && (
        <div className="page-header">
          <h1 style={{display:'flex',alignItems:'center',gap:10}}>
            <FaBookOpen color="#c4b5fd"/> Enter Scores
          </h1>
          <button className="btn" onClick={backToSetup}>
            <FaArrowLeft style={{marginRight:6,verticalAlign:'-2px'}}/>
            Back to Setup
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <span>Progress: {savedStudents.size}/{students.length} students</span>
          <span>{progressPercent}% complete</span>
        </div>
        <div style={{width:'100%', height:8, background:'#1f2937', borderRadius:4, overflow:'hidden'}}>
          <div 
            style={{
              width:`${progressPercent}%`,
              height:'100%',
              background:'linear-gradient(90deg, #3b82f6, #10b981)',
              transition:'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Current Student Card */}
      {currentStudent && (
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
            <h3 style={{margin:0, display:'flex', alignItems:'center', gap:8}}>
              <FaUser color="#93c5fd"/>
              {currentStudent.full_name}
              {savedStudents.has(currentStudent.id) && (
                <FaCheck color="#10b981" style={{marginLeft:8}}/>
              )}
            </h3>
            <div className="muted">
              Student {currentStudentIndex + 1} of {students.length}
              {multiSubjectMode && (
                <div style={{fontSize: '12px', marginTop: '2px'}}>
                  Subject: {classSubjects.find(cs => String(cs.id) === selectedSubjects[currentSubjectIndex])?.subject_name} 
                  ({currentSubjectIndex + 1}/{selectedSubjects.length})
                </div>
              )}
            </div>
          </div>

          {multiSubjectMode && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid #3b82f6', 
              borderRadius: '8px', 
              padding: '12px', 
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong style={{color: '#93c5fd'}}>Current Subject:</strong>
                <div style={{fontSize: '18px', fontWeight: '600'}}>
                  {classSubjects.find(cs => String(cs.id) === selectedSubjects[currentSubjectIndex])?.subject_name}
                </div>
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                <button 
                  className="btn" 
                  onClick={() => changeSubjectWithAutoSave(Math.max(0, currentSubjectIndex - 1))}
                  disabled={currentSubjectIndex === 0 || saving}
                  style={{padding: '6px 10px', fontSize: '12px', opacity: saving ? 0.6 : 1}}
                >
                  {saving ? '💾' : '←'} Prev Subject
                </button>
                <button 
                  className="btn" 
                  onClick={() => changeSubjectWithAutoSave(Math.min(selectedSubjects.length - 1, currentSubjectIndex + 1))}
                  disabled={currentSubjectIndex >= selectedSubjects.length - 1 || saving}
                  style={{padding: '6px 10px', fontSize: '12px', opacity: saving ? 0.6 : 1}}
                >
                  Next Subject {saving ? '💾' : '→'}
                </button>
              </div>
            </div>
          )}

          {(message || error) && (
            <div className={error ? 'alert' : 'success'} style={{marginBottom:16}}>
              {error || message}
            </div>
          )}

          {/* Score Entry Form */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            marginBottom: '20px'
          }}>
            <div style={{marginBottom: '16px', textAlign: 'center'}}>
              <h4 style={{
                margin: '0 0 8px 0',
                color: '#1e293b',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Enter Scores for {currentStudent?.full_name}
              </h4>
              <div style={{color: '#64748b', fontSize: '14px'}}>
                Complete all fields and save to continue
              </div>
            </div>
            
            <div className="form two-col" style={{gap: '16px'}}>
              <div className="field" style={{background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0'}}>
                <label style={{color: '#374151', fontWeight: '500', marginBottom: '6px', display: 'block'}}>
                  Task Score <span style={{color: '#6b7280'}}>(Max: 10)</span>
                  {scores.task > 10 && <span style={{color: '#ef4444', fontSize: '12px', marginLeft: '8px'}}>⚠️ Exceeds limit</span>}
                </label>
                <input 
                  type="number" 
                  value={scores.task} 
                  onChange={(e) => handleScoreChange('task', e.target.value)}
                  min="0" max="10" step="0.5"
                  placeholder="0.0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `2px solid ${scores.task > 10 ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    fontSize: '16px',
                    transition: 'border-color 0.15s ease-in-out'
                  }}
                  onFocus={(e) => e.target.style.borderColor = scores.task > 10 ? '#ef4444' : '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = scores.task > 10 ? '#ef4444' : '#e5e7eb'}
                />
              </div>

              <div className="field" style={{background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0'}}>
                <label style={{color: '#374151', fontWeight: '500', marginBottom: '6px', display: 'block'}}>
                  Homework <span style={{color: '#6b7280'}}>(Max: 10)</span>
                  {scores.homework > 10 && <span style={{color: '#ef4444', fontSize: '12px', marginLeft: '8px'}}>⚠️ Exceeds limit</span>}
                </label>
                <input 
                  type="number" 
                  value={scores.homework} 
                  onChange={(e) => handleScoreChange('homework', e.target.value)}
                  min="0" max="10" step="0.5"
                  placeholder="0.0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `2px solid ${scores.homework > 10 ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    fontSize: '16px',
                    transition: 'border-color 0.15s ease-in-out'
                  }}
                  onFocus={(e) => e.target.style.borderColor = scores.homework > 10 ? '#ef4444' : '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = scores.homework > 10 ? '#ef4444' : '#e5e7eb'}
                />
              </div>

              <div className="field" style={{background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0'}}>
                <label style={{color: '#374151', fontWeight: '500', marginBottom: '6px', display: 'block'}}>
                  Group Work <span style={{color: '#6b7280'}}>(Max: 10)</span>
                  {scores.group_work > 10 && <span style={{color: '#ef4444', fontSize: '12px', marginLeft: '8px'}}>⚠️ Exceeds limit</span>}
                </label>
                <input 
                  type="number" 
                  value={scores.group_work} 
                  onChange={(e) => handleScoreChange('group_work', e.target.value)}
                  min="0" max="10" step="0.5"
                  placeholder="0.0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `2px solid ${scores.group_work > 10 ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    fontSize: '16px',
                    transition: 'border-color 0.15s ease-in-out'
                  }}
                  onFocus={(e) => e.target.style.borderColor = scores.group_work > 10 ? '#ef4444' : '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = scores.group_work > 10 ? '#ef4444' : '#e5e7eb'}
                />
              </div>

              <div className="field" style={{background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0'}}>
                <label style={{color: '#374151', fontWeight: '500', marginBottom: '6px', display: 'block'}}>
                  Project Work <span style={{color: '#6b7280'}}>(Max: 10)</span>
                  {scores.project_work > 10 && <span style={{color: '#ef4444', fontSize: '12px', marginLeft: '8px'}}>⚠️ Exceeds limit</span>}
                </label>
                <input 
                  type="number" 
                  value={scores.project_work} 
                  onChange={(e) => handleScoreChange('project_work', e.target.value)}
                  min="0" max="10" step="0.5"
                  placeholder="0.0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `2px solid ${scores.project_work > 10 ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    fontSize: '16px',
                    transition: 'border-color 0.15s ease-in-out'
                  }}
                  onFocus={(e) => e.target.style.borderColor = scores.project_work > 10 ? '#ef4444' : '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = scores.project_work > 10 ? '#ef4444' : '#e5e7eb'}
                />
              </div>

              <div className="field" style={{background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0'}}>
                <label style={{color: '#374151', fontWeight: '500', marginBottom: '6px', display: 'block'}}>
                  Class Test <span style={{color: '#6b7280'}}>(Max: 10)</span>
                  {scores.class_test > 10 && <span style={{color: '#ef4444', fontSize: '12px', marginLeft: '8px'}}>⚠️ Exceeds limit</span>}
                </label>
                <input 
                  type="number" 
                  value={scores.class_test} 
                  onChange={(e) => handleScoreChange('class_test', e.target.value)}
                  min="0" max="10" step="0.5"
                  placeholder="0.0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `2px solid ${scores.class_test > 10 ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    fontSize: '16px',
                    transition: 'border-color 0.15s ease-in-out'
                  }}
                  onFocus={(e) => e.target.style.borderColor = scores.class_test > 10 ? '#ef4444' : '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = scores.class_test > 10 ? '#ef4444' : '#e5e7eb'}
                />
              </div>

              <div className="field" style={{background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0'}}>
                <label style={{color: '#374151', fontWeight: '500', marginBottom: '6px', display: 'block'}}>
                  Exam Score <span style={{color: '#6b7280'}}>(Max: 50)</span>
                  {scores.exam_score > 50 && <span style={{color: '#ef4444', fontSize: '12px', marginLeft: '8px'}}>⚠️ Exceeds limit</span>}
                </label>
                <input 
                  type="number" 
                  value={scores.exam_score} 
                  onChange={(e) => handleScoreChange('exam_score', e.target.value)}
                  min="0" max="50" step="0.5"
                  placeholder="0.0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `2px solid ${scores.exam_score > 50 ? '#ef4444' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    fontSize: '16px',
                    transition: 'border-color 0.15s ease-in-out'
                  }}
                  onFocus={(e) => e.target.style.borderColor = scores.exam_score > 50 ? '#ef4444' : '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = scores.exam_score > 50 ? '#ef4444' : '#e5e7eb'}
                />
              </div>
            </div>
          </div>

          {/* Total Score Display */}
          <div style={{
            background: totalScore >= 80 ? 'linear-gradient(135deg, #065f46, #047857)' : 
                       totalScore >= 60 ? 'linear-gradient(135deg, #1f2937, #374151)' : 
                       'linear-gradient(135deg, #7f1d1d, #991b1b)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            color: 'white',
            marginBottom: '20px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{fontSize: '24px', fontWeight: '700', marginBottom: '4px'}}>
              Total Score: {totalScore.toFixed(1)}/100
            </div>
            <div style={{fontSize: '14px', opacity: 0.9}}>
              {totalScore >= 80 ? '🎉 Excellent Performance!' : 
               totalScore >= 60 ? '👍 Good Performance' : 
               totalScore > 0 ? '📈 Keep Improving' : 'Enter scores to calculate total'}
            </div>
          </div>

          {/* Navigation Controls */}
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '24px',
            padding: '16px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
          }}>
            <button 
              onClick={goToPreviousStudent}
              disabled={currentStudentIndex === 0}
              style={{
                background: currentStudentIndex === 0 ? '#f3f4f6' : 'linear-gradient(135deg, #6b7280, #4b5563)',
                color: currentStudentIndex === 0 ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: currentStudentIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease-in-out',
                boxShadow: currentStudentIndex === 0 ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              <FaChevronLeft style={{fontSize: '12px'}}/>
              Previous
            </button>

            <div style={{display: 'flex', gap: '12px'}}>
              <button 
                onClick={saveCurrentStudent}
                disabled={saving}
                style={{
                  background: saving ? '#f59e0b' : 'linear-gradient(135deg, #059669, #047857)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: saving ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease-in-out',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                <FaSave style={{fontSize: '12px'}}/>
                {saving ? 'Saving...' : 'Save Scores'}
              </button>

              {currentStudentIndex < students.length - 1 && (
                <button 
                  onClick={saveAndNext}
                  disabled={saving}
                  style={{
                    background: saving ? '#f3f4f6' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: saving ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: saving ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <FaSave style={{fontSize: '12px'}}/>
                  Save & Next
                </button>
              )}
            </div>

            <button 
              onClick={goToNextStudent}
              disabled={currentStudentIndex === students.length - 1}
              style={{
                background: currentStudentIndex === students.length - 1 ? '#f3f4f6' : 'linear-gradient(135deg, #6b7280, #4b5563)',
                color: currentStudentIndex === students.length - 1 ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: currentStudentIndex === students.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease-in-out',
                boxShadow: currentStudentIndex === students.length - 1 ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              Next
              <FaChevronRight style={{fontSize: '12px'}}/>
            </button>
          </div>

          {/* Terminal Report & PDF Generation Section */}
          {multiSubjectMode && currentStudent && (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              background: isStudentCompleted() ? 
                'linear-gradient(135deg, #065f46, #047857)' : 
                'linear-gradient(135deg, #1e293b, #334155)',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div>
                  <h3 style={{
                    color: 'white',
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FaBookReader />
                    Generate Reports for {currentStudent.get_full_name || currentStudent.full_name || (currentStudent.first_name + ' ' + currentStudent.last_name)}
                  </h3>
                  <p style={{
                    color: 'rgba(255,255,255,0.8)',
                    margin: '4px 0 0 0',
                    fontSize: '14px'
                  }}>
                    {isStudentCompleted() 
                      ? `✅ All ${selectedSubjects.length} subjects completed - Ready to generate reports!`
                      : `📝 ${selectedSubjects.filter(subjectId => allScores[currentStudent.id]?.[subjectId]?.saved).length}/${selectedSubjects.length} subjects completed`
                    }
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={previewReport}
                  disabled={saving || !currentStudent}
                  style={{
                    background: !currentStudent ? '#6b7280' : 'linear-gradient(135deg, #059669, #047857)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (!currentStudent || saving) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: !currentStudent ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                    opacity: !currentStudent ? 0.6 : 1
                  }}
                >
                  <FaUser style={{fontSize: '12px'}}/>
                  {saving ? 'Generating...' : 'Preview Report'}
                </button>

                <button 
                  onClick={generateBatchPreviews}
                  disabled={generatingPreviews || students.length === 0}
                  style={{
                    background: (generatingPreviews || students.length === 0) ? '#6b7280' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (generatingPreviews || students.length === 0) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: students.length === 0 ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                    opacity: students.length === 0 ? 0.6 : 1
                  }}
                >
                  <FaBookReader style={{fontSize: '12px'}}/>
                  {generatingPreviews ? 'Generating...' : 'Preview All Reports'}
                </button>

                <button 
                  onClick={generateTerminalReport}
                  disabled={saving || !isStudentCompleted()}
                  style={{
                    background: !isStudentCompleted() ? '#6b7280' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (!isStudentCompleted() || saving) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: !isStudentCompleted() ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                    opacity: !isStudentCompleted() ? 0.6 : 1
                  }}
                >
                  <FaBookOpen style={{fontSize: '12px'}}/>
                  {saving ? 'Generating...' : 'Save Terminal Report'}
                </button>

                <button 
                  onClick={generateReportCard}
                  disabled={saving || !currentStudent}
                  style={{
                    background: !currentStudent ? '#6b7280' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (!currentStudent || saving) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: !currentStudent ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                    opacity: !currentStudent ? 0.6 : 1
                  }}
                >
                  <FaCheck style={{fontSize: '12px'}}/>
                  {saving ? 'Generating...' : 'Generate PDF Report'}
                </button>
              </div>

              {!isStudentCompleted() && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  ⚡ Use "Preview Report" to see how the report looks with current scores. "Generate PDF Report" works with available scores. Complete and save all subjects for terminal report.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Batch Preview Modal */}
      {showBatchPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: '1000px',
            height: '700px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '15px'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                Review All Student Reports
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {currentPreviewIndex + 1} of {batchPreviewData.length}
                </span>
                <button
                  onClick={() => setShowBatchPreview(false)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Current Student Info */}
            {batchPreviewData[currentPreviewIndex] && (
              <div style={{
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>{batchPreviewData[currentPreviewIndex].student.first_name} {batchPreviewData[currentPreviewIndex].student.last_name}</strong>
                  {batchPreviewData[currentPreviewIndex].hasScores ? (
                    <span style={{ color: '#10b981', fontSize: '12px', marginLeft: '10px' }}>
                      ✅ {batchPreviewData[currentPreviewIndex].subjectsCount} subjects • Avg: {batchPreviewData[currentPreviewIndex].averageScore?.toFixed(1)}%
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '10px' }}>
                      ❌ {batchPreviewData[currentPreviewIndex].error}
                    </span>
                  )}
                </div>
                
                {/* Navigation Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => navigatePreview('prev')}
                    disabled={currentPreviewIndex === 0}
                    style={{
                      background: currentPreviewIndex === 0 ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      cursor: currentPreviewIndex === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <FaChevronLeft size={12} />
                    Previous
                  </button>
                  <button
                    onClick={() => navigatePreview('next')}
                    disabled={currentPreviewIndex === batchPreviewData.length - 1}
                    style={{
                      background: currentPreviewIndex === batchPreviewData.length - 1 ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      cursor: currentPreviewIndex === batchPreviewData.length - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    Next
                    <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Preview Frame */}
            <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
              {batchPreviewData[currentPreviewIndex]?.hasScores ? (
                <iframe
                  src={batchPreviewData[currentPreviewIndex].previewUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={`Report for ${batchPreviewData[currentPreviewIndex].student.first_name}`}
                />
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                  <h4 style={{ margin: '0 0 8px 0' }}>No Report Available</h4>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    {batchPreviewData[currentPreviewIndex]?.error || 'No scores have been entered for this student.'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '20px',
              paddingTop: '15px',
              borderTop: '2px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Review each student's report and save when satisfied
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowBatchPreview(false)}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveAllStudents}
                  disabled={saving}
                  style={{
                    background: saving ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FaCheck size={12} />
                  {saving ? 'Saving...' : 'Save All Reports'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
