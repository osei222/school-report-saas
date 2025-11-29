import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import RegisterSchool from './pages/RegisterSchool'
import Landing from './pages/Landing'
import Teachers from './pages/Teachers'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import EnterScores from './pages/EnterScores'
import Reports from './pages/Reports'
import Classes from './pages/Classes'
import Subjects from './pages/Subjects'
import SubjectsEnhanced from './pages/SubjectsEnhanced'
import SchoolSettings from './pages/SchoolSettings'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import MobileNav from './components/MobileNav'

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register-school" element={<RegisterSchool />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Navbar />
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/classes" element={<Classes />} />
                <Route path="/students" element={<Students />} />
                <Route
                  path="/subjects"
                  element={
                    <ProtectedRoute roles={["SCHOOL_ADMIN","PRINCIPAL"]}>
                      <Subjects />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subjects-enhanced"
                  element={
                    <ProtectedRoute roles={["SCHOOL_ADMIN","PRINCIPAL"]}>
                      <SubjectsEnhanced />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scores"
                  element={
                    <ProtectedRoute roles={["TEACHER"]}>
                      <EnterScores />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teachers"
                  element={
                    <ProtectedRoute roles={["SCHOOL_ADMIN","PRINCIPAL"]}>
                      <Teachers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute roles={["SCHOOL_ADMIN","PRINCIPAL"]}>
                      <SchoolSettings />
                    </ProtectedRoute>
                  }
                />
                <Route path="/reports" element={<Reports />} />
              </Routes>
              <MobileNav />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}
