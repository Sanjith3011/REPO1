import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [])
    if (!msg) return null
    return (
        <div style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
            padding: '14px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14,
            background: type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : '#555',
            color: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.35)'
        }}>
            {msg}
        </div>
    )
}

export default function ManageTeachers() {
    const { user, logout } = useAuth()
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(true)

    // Admin profile state
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showAdminPwdModal, setShowAdminPwdModal] = useState(false)
    const [adminOldPassword, setAdminOldPassword] = useState('')
    const [adminNewPassword, setAdminNewPassword] = useState('')
    const [adminPwdLoading, setAdminPwdLoading] = useState(false)

    // Add form
    const [username, setUsername] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [password, setPassword] = useState('')
    const [addLoading, setAddLoading] = useState(false)

    // Reset password form
    const [resetModalTeacher, setResetModalTeacher] = useState(null)
    const [newPassword, setNewPassword] = useState('')
    const [resetLoading, setResetLoading] = useState(false)

    // Edit teacher form
    const [editModalTeacher, setEditModalTeacher] = useState(null)
    const [editUsername, setEditUsername] = useState('')
    const [editFirstName, setEditFirstName] = useState('')
    const [editLastName, setEditLastName] = useState('')
    const [editLoading, setEditLoading] = useState(false)

    const [toast, setToast] = useState(null)
    const showToast = (msg, type = 'success') => setToast({ msg, type })

    useEffect(() => {
        loadTeachers()
    }, [])

    const loadTeachers = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/teachers/')
            setTeachers(data)
        } catch {
            showToast('Failed to load teachers', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleAddTeacher = async (e) => {
        e.preventDefault()
        if (!username.trim() || !firstName.trim() || !password.trim()) {
            showToast('Username, First Name, and Password are required', 'error')
            return
        }
        setAddLoading(true)
        try {
            const { data } = await api.post('/teachers/create/', {
                username: username.trim(),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                password: password,
                role: 'teacher'
            })
            setTeachers(prev => [...prev, data])
            setUsername(''); setFirstName(''); setLastName(''); setPassword('')
            showToast(`Teacher ${data.first_name} added!`)
        } catch (err) {
            showToast(err.response?.data?.username?.[0] || 'Failed to add teacher', 'error')
        } finally {
            setAddLoading(false)
        }
    }

    const handleDeleteTeacher = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete teacher ${name}? This action cannot be undone and will not reassign their subjects.`)) return
        try {
            await api.delete(`/teachers/${id}/delete/`)
            setTeachers(prev => prev.filter(t => t.id !== id))
            showToast(`Teacher ${name} deleted successfully!`)
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to delete teacher', 'error')
        }
    }

    const handleEditTeacher = async (e) => {
        e.preventDefault()
        if (!editUsername.trim() || !editFirstName.trim()) {
            showToast('Username and First Name are required', 'error')
            return
        }
        setEditLoading(true)
        try {
            const { data } = await api.patch(`/teachers/${editModalTeacher.id}/update/`, {
                username: editUsername.trim(),
                first_name: editFirstName.trim(),
                last_name: editLastName.trim()
            })
            // Update local state
            setTeachers(prev => prev.map(t => t.id === editModalTeacher.id ? data : t))
            showToast(`Teacher ${data.first_name} updated successfully!`)
            setEditModalTeacher(null)
        } catch (err) {
            showToast(err.response?.data?.error || err.response?.data?.username?.[0] || 'Failed to update teacher', 'error')
        } finally {
            setEditLoading(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (!newPassword.trim()) {
            showToast('New password is required', 'error')
            return
        }
        setResetLoading(true)
        try {
            await api.post(`/teachers/${resetModalTeacher.id}/change-password/`, {
                new_password: newPassword
            })
            showToast(`Password successfully reset for ${resetModalTeacher.first_name}`)
            setResetModalTeacher(null)
            setNewPassword('')
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to reset password', 'error')
        } finally {
            setResetLoading(false)
        }
    }

    const handleChangeAdminPassword = async (e) => {
        e.preventDefault()
        if (!adminOldPassword || !adminNewPassword) {
            showToast('Both fields are required', 'error')
            return
        }
        setAdminPwdLoading(true)
        try {
            await api.post('/auth/change-password/', {
                old_password: adminOldPassword,
                new_password: adminNewPassword
            })
            showToast('Password changed successfully!')
            setShowAdminPwdModal(false)
            setAdminOldPassword('')
            setAdminNewPassword('')
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to change password', 'error')
        } finally {
            setAdminPwdLoading(false)
        }
    }

    return (
        <div>
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-brand">
                    <img src="/logo.png" alt="Logo" style={{ height: 42, width: 42, objectFit: 'contain' }} />
                    <div>
                        <h1>Jai Shriram Engineering College</h1>
                        <small>Admin Portal - Manage Teachers</small>
                    </div>
                </div>
                <div className="navbar-right">
                    <Link to="/admin" className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                        ← Back to Dashboard
                    </Link>
                    <div 
                        className="navbar-user" 
                        onClick={() => setShowProfileMenu(!showProfileMenu)} 
                        style={{ cursor: 'pointer', position: 'relative' }}
                    >
                        <div className="avatar">{user?.first_name?.[0] || 'A'}</div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.first_name} {user?.last_name}</div>
                            <span className="role-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                Admin <span style={{ fontSize: 10 }}>▼</span>
                            </span>
                        </div>
                        
                        {showProfileMenu && (
                            <div className="profile-dropdown" style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: 12,
                                background: 'white', border: '1px solid var(--border)',
                                borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                width: 220, zIndex: 1000, overflow: 'hidden'
                            }}>
                                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: '#fafafa' }}>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>
                                        {user?.first_name} {user?.last_name}
                                    </div>
                                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                                        @{user?.username}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {user?.role}
                                    </div>
                                </div>
                                <div style={{ padding: '8px 0' }}>
                                    <div 
                                        onClick={() => { setShowAdminPwdModal(true); setShowProfileMenu(false); }}
                                        style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14, color: '#333', display: 'flex', alignItems: 'center', gap: 10 }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: 16 }}>🔒</span> Change Password
                                    </div>
                                    <div 
                                        onClick={logout}
                                        style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 10 }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fff0f0'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: 16 }}>🚪</span> Logout
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="page-wrapper">
                <div className="container">

                    {/* Add Teacher Form */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="section-title">Add New Teacher</div>
                        <form onSubmit={handleAddTeacher} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ flex: '1 1 180px' }}>
                                <label>USERNAME (FOR LOGIN)</label>
                                <input type="text" placeholder="e.g. teacher1" value={username} onChange={e => setUsername(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ flex: '1 1 180px' }}>
                                <label>FIRST NAME</label>
                                <input type="text" placeholder="e.g. T. Renuga" value={firstName} onChange={e => setFirstName(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ flex: '1 1 180px' }}>
                                <label>LAST NAME (OPTIONAL)</label>
                                <input type="text" placeholder="e.g. MS" value={lastName} onChange={e => setLastName(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ flex: '1 1 180px' }}>
                                <label>TEMPORARY PASSWORD</label>
                                <input type="password" placeholder="e.g. pass123" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>&nbsp;</label>
                                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                                    {addLoading ? 'Adding...' : '+ Add Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Teacher List */}
                    {loading ? (
                        <div className="loader"><div className="spinner" /><span>Loading teachers...</span></div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                                <div className="section-title" style={{ margin: 0 }}>
                                    Registered Teachers &nbsp;
                                    <span style={{ background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 700 }}>
                                        {teachers.length}
                                    </span>
                                </div>
                            </div>
                            <table className="marks-table" style={{ margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Username</th>
                                        <th>Full Name</th>
                                        <th>Role</th>
                                        <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teachers.map((t, idx) => (
                                        <tr key={t.id}>
                                            <td style={{ color: 'var(--text-light)' }}>{idx + 1}</td>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>{t.username}</td>
                                            <td>{t.first_name} {t.last_name}</td>
                                            <td><span className="role-badge">Teacher</span></td>
                                            <td style={{ textAlign: 'right', paddingRight: 20 }}>
                                                <button
                                                    onClick={() => {
                                                        setEditModalTeacher(t)
                                                        setEditUsername(t.username)
                                                        setEditFirstName(t.first_name)
                                                        setEditLastName(t.last_name || '')
                                                    }}
                                                    className="btn btn-outline"
                                                    style={{ color: 'var(--primary)', borderColor: 'var(--border)', padding: '4px 10px', fontSize: 12, marginRight: 8 }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setResetModalTeacher(t)
                                                        setNewPassword('')
                                                    }}
                                                    className="btn btn-outline"
                                                    style={{ color: 'var(--primary)', borderColor: 'var(--border)', padding: '4px 10px', fontSize: 12, marginRight: 8 }}
                                                >
                                                    Reset Pwd
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTeacher(t.id, t.first_name)}
                                                    className="btn btn-outline"
                                                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '4px 10px', fontSize: 12 }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {teachers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                                No teachers registered.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Reset Password Modal */}
            {resetModalTeacher && (
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setResetModalTeacher(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)', fontWeight: 700 }}>
                                Reset Password
                            </h3>
                            <button className="btn" style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text)' }} onClick={() => setResetModalTeacher(null)}>×</button>
                        </div>
                        <div className="modal-body" style={{ padding: '0 20px 20px' }}>
                            <p style={{ margin: '16px 0', fontSize: 14, color: 'var(--text-light)' }}>
                                Enter a new password for teacher <b>{resetModalTeacher.first_name}</b> ({resetModalTeacher.username}).
                            </p>
                            <form onSubmit={handleResetPassword}>
                                <div className="form-group">
                                    <label>NEW PASSWORD</label>
                                    <input 
                                        type="password" 
                                        placeholder="Enter new password" 
                                        value={newPassword} 
                                        onChange={e => setNewPassword(e.target.value)} 
                                        autoFocus
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setResetModalTeacher(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                                        {resetLoading ? 'Resetting...' : 'Save Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Teacher Modal */}
            {editModalTeacher && (
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setEditModalTeacher(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)', fontWeight: 700 }}>
                                Edit Teacher Details
                            </h3>
                            <button className="btn" style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text)' }} onClick={() => setEditModalTeacher(null)}>×</button>
                        </div>
                        <div className="modal-body" style={{ padding: '0 20px 20px' }}>
                            <form onSubmit={handleEditTeacher}>
                                <div className="form-group">
                                    <label>USERNAME</label>
                                    <input 
                                        type="text" 
                                        value={editUsername} 
                                        onChange={e => setEditUsername(e.target.value)} 
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group" style={{ marginTop: 16 }}>
                                    <label>FIRST NAME</label>
                                    <input 
                                        type="text" 
                                        value={editFirstName} 
                                        onChange={e => setEditFirstName(e.target.value)} 
                                    />
                                </div>
                                <div className="form-group" style={{ marginTop: 16 }}>
                                    <label>LAST NAME (OPTIONAL)</label>
                                    <input 
                                        type="text" 
                                        value={editLastName} 
                                        onChange={e => setEditLastName(e.target.value)} 
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setEditModalTeacher(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={editLoading}>
                                        {editLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Change Password Modal */}
            {showAdminPwdModal && (
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setShowAdminPwdModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)', fontWeight: 700 }}>
                                Change Password
                            </h3>
                            <button className="btn" style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text)' }} onClick={() => setShowAdminPwdModal(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ padding: '0 20px 20px' }}>
                            <form onSubmit={handleChangeAdminPassword}>
                                <div className="form-group">
                                    <label>CURRENT PASSWORD</label>
                                    <input 
                                        type="password" 
                                        placeholder="Enter current password" 
                                        value={adminOldPassword} 
                                        onChange={e => setAdminOldPassword(e.target.value)} 
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group" style={{ marginTop: 16 }}>
                                    <label>NEW PASSWORD</label>
                                    <input 
                                        type="password" 
                                        placeholder="Enter new password" 
                                        value={adminNewPassword} 
                                        onChange={e => setAdminNewPassword(e.target.value)} 
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setShowAdminPwdModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={adminPwdLoading}>
                                        {adminPwdLoading ? 'Saving...' : 'Change Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
