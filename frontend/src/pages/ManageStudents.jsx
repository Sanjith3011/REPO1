import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const YEARS = ['I', 'II', 'III', 'IV']

function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [])
    if (!msg) return null
    return (
        <div className={`toast toast-${type}`} style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
            padding: '14px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14,
            background: type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : '#555',
            color: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.35)'
        }}>
            {msg}
        </div>
    )
}

export default function ManageStudents() {
    const { user, logout } = useAuth()

    // Filter state
    const [depts, setDepts] = useState([])
    const [batches, setBatches] = useState([])
    const [deptId, setDeptId] = useState('')
    const [batchId, setBatchId] = useState('')
    const [year, setYear] = useState('')

    // Student list
    const [students, setStudents] = useState([])
    const [listLoading, setListLoading] = useState(false)

    // Add form
    const [rollNo, setRollNo] = useState('')
    const [name, setName] = useState('')
    const [addLoading, setAddLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)

    // Selection state
    const [selectedIds, setSelectedIds] = useState(new Set())

    // Add Batch
    const [showAddBatchModal, setShowAddBatchModal] = useState(false)
    const [newBatchStart, setNewBatchStart] = useState('')
    const [newBatchEnd, setNewBatchEnd] = useState('')
    const [addBatchLoading, setAddBatchLoading] = useState(false)

    // Toast
    const [toast, setToast] = useState(null)

    // Admin profile state
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showAdminPwdModal, setShowAdminPwdModal] = useState(false)
    const [adminOldPassword, setAdminOldPassword] = useState('')
    const [adminNewPassword, setAdminNewPassword] = useState('')
    const [adminPwdLoading, setAdminPwdLoading] = useState(false)

    // Multi-add bulk input
    const [bulkText, setBulkText] = useState('')
    const [bulkMode, setBulkMode] = useState(false)

    const showToast = (msg, type = 'success') => setToast({ msg, type })

    // Load departments on mount
    useEffect(() => {
        api.get('/departments/').then(({ data }) => setDepts(data))
    }, [])

    // Load batches when dept changes
    useEffect(() => {
        setBatchId(''); setBatches([]); setYear('')
        if (deptId) api.get(`/batches/?department=${deptId}`).then(({ data }) => setBatches(data))
    }, [deptId])

    // Derive academic year (I–IV) from batch year_start
    const computeYearFromBatch = (batchId) => {
        const now = new Date()
        // Academic year starts July; Jan–Jun means we are still in previous academic year
        const academicStart = now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear()
        const batch = batches.find(b => String(b.id) === String(batchId))
        if (!batch) return ''
        const yearNum = academicStart - batch.year_start + 1
        const MAP = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' }
        return MAP[yearNum] || ''
    }

    // Load students when filters set
    const loadStudents = () => {
        if (!deptId || !batchId || !year) { showToast('Select Department, Batch and Year first', 'error'); return }
        setListLoading(true)
        setSelectedIds(new Set()) // Reset selection
        api.get(`/students/?department=${deptId}&batch=${batchId}&year=${year}`)
            .then(({ data }) => setStudents(data))
            .catch(() => showToast('Failed to load students', 'error'))
            .finally(() => setListLoading(false))
    }

    // Add single student
    const handleAddStudent = async (e) => {
        e.preventDefault()
        if (!rollNo.trim() || !name.trim()) { showToast('Roll No and Name are required', 'error'); return }
        if (!deptId || !batchId || !year) { showToast('Select Department, Batch and Year first', 'error'); return }
        setAddLoading(true)
        try {
            const { data } = await api.post('/students/create/', {
                roll_no: rollNo.trim(), name: name.trim(),
                batch_id: batchId, department_id: deptId, year
            })
            setStudents(prev => [...prev, data].sort((a, b) => a.roll_no.localeCompare(b.roll_no)))
            setRollNo(''); setName('')
            showToast(`${data.name} added successfully!`)
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to add student', 'error')
        } finally {
            setAddLoading(false)
        }
    }

    // Add new batch
    const handleAddBatch = async (e) => {
        e.preventDefault()
        if (!deptId) { showToast('Please select a Department first', 'error'); return }
        if (!newBatchStart || !newBatchEnd) { showToast('Start and End years are required', 'error'); return }
        
        setAddBatchLoading(true)
        try {
            const { data } = await api.post('/batches/create/', {
                year_start: parseInt(newBatchStart),
                year_end: parseInt(newBatchEnd),
                department_id: deptId
            })
            // Update batches list if it matches the currently selected department
            setBatches(prev => [data, ...prev].sort((a, b) => b.year_start - a.year_start))
            setBatchId(data.id)
            showToast(`Batch ${data.label} created successfully!`)
            setShowAddBatchModal(false)
            setNewBatchStart('')
            setNewBatchEnd('')
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to create batch', 'error')
        } finally {
            setAddBatchLoading(false)
        }
    }

    // Selection handlers
    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === students.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(students.map(s => s.id)))
        }
    }

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds)
        if (ids.length === 0) return
        
        console.log("Bulk Delete initiated for IDs:", ids)
        
        if (!window.confirm(`Permanently delete ${ids.length} selected students and all their records?`)) {
            console.log("Bulk Delete cancelled by user")
            return
        }

        setListLoading(true)
        try {
            const response = await api.post('/students/bulk-delete/', { student_ids: ids.map(id => Number(id)) })
            console.log("Bulk Delete API response:", response.data)
            
            // Remove from local state
            setStudents(prev => prev.filter(s => !ids.includes(s.id)))
            setSelectedIds(new Set())
            showToast(`Successfully deleted ${ids.length} records`)
        } catch (err) {
            console.error("Bulk Delete Error:", err)
            showToast(err.response?.data?.error || 'Failed to delete students', 'error')
        } finally {
            setListLoading(false)
        }
    }

    // Bulk add (paste comma/newline separated: rollno, name)
    const handleBulkAdd = async () => {
        if (!deptId || !batchId || !year) { showToast('Select Department, Batch and Year first', 'error'); return }
        const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
        let added = 0, failed = 0
        setAddLoading(true)
        for (const line of lines) {
            const parts = line.split(',')
            if (parts.length < 2) { failed++; continue }
            const rn = parts[0].trim()
            const nm = parts.slice(1).join(',').trim()
            try {
                const { data } = await api.post('/students/create/', {
                    roll_no: rn, name: nm, batch_id: batchId, department_id: deptId, year
                })
                setStudents(prev => [...prev, data])
                added++
            } catch { failed++ }
        }
        setStudents(prev => [...prev].sort((a, b) => a.roll_no.localeCompare(b.roll_no)))
        setBulkText('')
        setAddLoading(false)
        showToast(`${added} students added${failed ? `, ${failed} failed` : ''}`, failed ? 'error' : 'success')
    }

    // Delete student
    const handleDelete = async (st) => {
        if (!window.confirm(`Delete ${st.name} (${st.roll_no})? All their marks will also be removed.`)) return
        try {
            await api.delete(`/students/${st.id}/delete/`)
            setStudents(prev => prev.filter(s => s.id !== st.id))
            showToast(`${st.name} deleted`)
        } catch {
            showToast('Failed to delete student', 'error')
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
                    <div className="nav-logo-box">
                        <img src="/logo.png" alt="Logo" className="nav-logo-img" />
                    </div>
                    <div>
                        <h1>Jai Shriram Engineering College</h1>
                        <small>Admin Portal - Manage Students</small>
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

                    {/* Filter Panel */}
                    <div className="card selection-panel" style={{ marginBottom: 20 }}>
                        <div className="section-title">Select Class</div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            {/* Department */}
                            <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
                                <label>DEPARTMENT</label>
                                <select id="ms-dept" value={deptId} onChange={e => setDeptId(e.target.value)}>
                                    <option value="">Select Department</option>
                                    {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            {/* Batch */}
                            <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>BATCH</span>
                                    {deptId && (
                                        <button 
                                            type="button" 
                                            onClick={() => setShowAddBatchModal(true)}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: 0 }}
                                        >
                                            + Add Batch
                                        </button>
                                    )}
                                </label>
                                <select id="ms-batch" value={batchId}
                                    onChange={e => {
                                        const id = e.target.value
                                        setBatchId(id)
                                        setYear(computeYearFromBatch(id))
                                    }}
                                    disabled={!deptId}>
                                    <option value="">Select Batch</option>
                                    {batches.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                                </select>
                            </div>
                            {/* Year */}
                            <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                                <label>YEAR</label>
                                <select id="ms-year" value={year} onChange={e => setYear(e.target.value)}>
                                    <option value="">Select Year</option>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>&nbsp;</label>
                                <button id="ms-load-btn" className="btn btn-primary" onClick={loadStudents} disabled={!deptId || !batchId || !year}>
                                    View Students
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Add Student Panel */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div className="section-title" style={{ margin: 0 }}>Add Students</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className={`btn ${!bulkMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBulkMode(false)}>Single</button>
                                <button className={`btn ${bulkMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBulkMode(true)}>Bulk Paste</button>
                            </div>
                        </div>

                        {!bulkMode ? (
                            // Single add form
                            <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ flex: '0 0 220px' }}>
                                    <label>REGISTER NO / ROLL NO</label>
                                    <input id="add-rollno" type="text" placeholder="e.g. 711224104048"
                                        value={rollNo} onChange={e => setRollNo(e.target.value)} />
                                </div>
                                <div className="form-group" style={{ flex: '1 1 220px' }}>
                                    <label>STUDENT NAME</label>
                                    <input id="add-name" type="text" placeholder="e.g. Nishanth Priyan P"
                                        value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>&nbsp;</label>
                                    <button id="add-student-btn" type="submit" className="btn btn-primary" disabled={addLoading}>
                                        {addLoading ? 'Adding...' : '+ Add Student'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            // Bulk paste
                            <div>
                                <p style={{ color: 'var(--text-light)', fontSize: 13, marginBottom: 8 }}>
                                    Paste one student per line: <code>RollNo, Student Name</code>
                                </p>
                                <textarea
                                    id="bulk-paste"
                                    rows={6}
                                    spellCheck={false}
                                    style={{
                                        width: '100%', background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                                        borderRadius: 8, padding: 12, color: 'var(--text)', fontSize: 13, fontFamily: 'monospace', resize: 'vertical'
                                    }}
                                    placeholder={"711224104048, Nishanth Priyan P\n711224104049, Palani M\n711224104050, Another Student"}
                                    value={bulkText}
                                    onChange={e => setBulkText(e.target.value)}
                                />
                                <button id="bulk-add-btn" className="btn btn-primary" style={{ marginTop: 10 }}
                                    onClick={handleBulkAdd} disabled={addLoading || !bulkText.trim()}>
                                    {addLoading ? 'Adding...' : `Add All Students`}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Student List */}
                    {listLoading && <div className="loader"><div className="spinner" /><span>Loading...</span></div>}

                    {!listLoading && students.length > 0 && (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                                <div className="section-title" style={{ margin: 0 }}>
                                    Students — Year {year} &nbsp;
                                    <span style={{ background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 700 }}>
                                        {students.length}
                                    </span>
                                </div>
                                {selectedIds.size > 0 && (
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={handleBulkDelete}
                                        style={{ background: 'var(--danger)', color: 'white', border: 'none', fontWeight: 700 }}
                                    >
                                        🗑️ Delete Selected ({selectedIds.size})
                                    </button>
                                )}
                            </div>
                            <table className="marks-table" style={{ margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: 40, textAlign: 'center' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={students.length > 0 && selectedIds.size === students.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th>#</th>
                                        <th>Register No</th>
                                        <th>Student Name</th>
                                        <th>Year</th>
                                        <th style={{ textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((st, i) => (
                                        <tr key={st.id} className={selectedIds.has(st.id) ? 'selected-row' : ''} style={{ background: selectedIds.has(st.id) ? 'rgba(var(--primary-rgb), 0.05)' : 'inherit' }}>
                                            <td style={{ textAlign: 'center' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.has(st.id)}
                                                    onChange={() => toggleSelect(st.id)}
                                                />
                                            </td>
                                            <td style={{ color: 'var(--text-light)' }}>{i + 1}</td>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{st.roll_no}</td>
                                            <td>{st.name}</td>
                                            <td><span className="role-badge">{st.year}</span></td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button className="btn btn-outline" onClick={() => handleDelete(st)}
                                                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '4px 14px', fontSize: 12 }}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!listLoading && students.length === 0 && deptId && batchId && year && (
                        <div className="empty-state card">
                            <div className="icon">👥</div>
                            <p>No students found for this selection. Use the form above to add students.</p>
                        </div>
                    )}

                </div>
            </div>

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

            {/* Add Batch Modal */}
            {showAddBatchModal && (
                <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setShowAddBatchModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)', fontWeight: 700 }}>
                                Add New Batch
                            </h3>
                            <button className="btn" style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text)' }} onClick={() => setShowAddBatchModal(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ padding: '0 20px 20px' }}>
                            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-light)' }}>
                                Creating a batch for <b>{depts.find(d => String(d.id) === String(deptId))?.name || 'Selected Department'}</b>.
                            </p>
                            <form onSubmit={handleAddBatch}>
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>START YEAR</label>
                                        <input 
                                            type="number" 
                                            placeholder="e.g. 2024" 
                                            value={newBatchStart} 
                                            onChange={e => {
                                                setNewBatchStart(e.target.value);
                                                if (e.target.value.length === 4) {
                                                    setNewBatchEnd(String(parseInt(e.target.value) + 4));
                                                }
                                            }} 
                                            autoFocus
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>END YEAR</label>
                                        <input 
                                            type="number" 
                                            placeholder="e.g. 2028" 
                                            value={newBatchEnd} 
                                            onChange={e => setNewBatchEnd(e.target.value)} 
                                            required
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setShowAddBatchModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={addBatchLoading}>
                                        {addBatchLoading ? 'Creating...' : 'Create Batch'}
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
