import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import ManageStudents from './pages/ManageStudents'
import ManageSubjects from './pages/ManageSubjects'

import AdminDashboard from './pages/AdminDashboard'
import ManageTeachers from './pages/ManageTeachers'

function ProtectedRoute({ children, role }) {
    const { user, loading } = useAuth()
    if (loading) return <div className="loader"><div className="spinner" /><span>Loading...</span></div>
    if (!user) return <Navigate to="/login" replace />

    // Redirect if they go to the wrong role page
    if (role && user.role !== role) {
        if (user.role === 'admin') return <Navigate to="/admin" replace />
        if (user.role === 'teacher') return <Navigate to="/teacher" replace />
        return <Navigate to="/student" replace />
    }
    return children
}

function AppRoutes() {
    const { user, loading } = useAuth()
    if (loading) return <div className="loader" style={{ minHeight: '100vh' }}><div className="spinner" /><span>Loading...</span></div>
    return (
        <Routes>
            <Route path="/login" element={
                user ? <Navigate to={user.role === 'admin' ? '/admin' : (user.role === 'teacher' ? '/teacher' : '/student')} replace /> : <Login />
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/teachers" element={<ProtectedRoute role="admin"><ManageTeachers /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute role="admin"><ManageStudents /></ProtectedRoute>} />
            <Route path="/admin/subjects" element={<ProtectedRoute role="admin"><ManageSubjects /></ProtectedRoute>} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />

            {/* Student Routes */}
            <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : (user.role === 'teacher' ? '/teacher' : '/student')) : '/login'} replace />} />
        </Routes>
    )
}

export default function App() {
    return (
        <HashRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </HashRouter>
    )
}
