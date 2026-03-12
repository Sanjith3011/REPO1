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

export default function AdminDashboard() {
    const { user, logout } = useAuth()
    
    // Change Password State
    const [showPwdModal, setShowPwdModal] = useState(false)
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [pwdLoading, setPwdLoading] = useState(false)
    
    const [toast, setToast] = useState(null)
    const showToast = (msg, type = 'success') => setToast({ msg, type })

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (!oldPassword || !newPassword) {
            showToast('Both fields are required', 'error')
            return
        }
        setPwdLoading(true)
        try {
            await api.post('/auth/change-password/', {
                old_password: oldPassword,
                new_password: newPassword
            })
            showToast('Password changed successfully! You can use it next time you log in.')
            setShowPwdModal(false)
            setOldPassword('')
            setNewPassword('')
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to change password', 'error')
        } finally {
            setPwdLoading(false)
        }
    }

    return (
        <div>
            <nav className="navbar">
                <div className="navbar-brand">
                    <img src="/logo.png" alt="Logo" style={{ height: 42, width: 42, objectFit: 'contain' }} />
                    <div>
                        <h1>Jai Shriram Engineering College</h1>
                        <small>Internal Assessment Management System</small>
                    </div>
                </div>
                <div className="navbar-right">
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
                                        onClick={() => { setShowPwdModal(true); setShowProfileMenu(false); }}
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
                    <div className="section-title">Admin Dashboard Options</div>
                    <div className="analysis-grid">
                        <Link to="/admin/teachers" style={{ textDecoration: 'none' }}>
                            <div className="analysis-card blue">
                                <div className="value" style={{ fontSize: 40 }}>👨‍🏫</div>
                                <div className="label">Manage Teachers</div>
                            </div>
                        </Link>
                        <Link to="/admin/students" style={{ textDecoration: 'none' }}>
                            <div className="analysis-card green">
                                <div className="value" style={{ fontSize: 40 }}>👥</div>
                                <div className="label">Manage Students</div>
                            </div>
                        </Link>
                        <Link to="/admin/subjects" style={{ textDecoration: 'none' }}>
                            <div className="analysis-card amber">
                                <div className="value" style={{ fontSize: 40 }}>📚</div>
                                <div className="label">Manage Subjects & Assignments</div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPwdModal && (
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setShowPwdModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)', fontWeight: 700 }}>
                                Change Password
                            </h3>
                            <button className="btn" style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text)' }} onClick={() => setShowPwdModal(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ padding: '0 20px 20px' }}>
                            <form onSubmit={handleChangePassword}>
                                <div className="form-group">
                                    <label>CURRENT PASSWORD</label>
                                    <input 
                                        type="password" 
                                        placeholder="Enter current password" 
                                        value={oldPassword} 
                                        onChange={e => setOldPassword(e.target.value)} 
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group" style={{ marginTop: 16 }}>
                                    <label>NEW PASSWORD</label>
                                    <input 
                                        type="password" 
                                        placeholder="Enter new password" 
                                        value={newPassword} 
                                        onChange={e => setNewPassword(e.target.value)} 
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setShowPwdModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
                                        {pwdLoading ? 'Saving...' : 'Change Password'}
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
