import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

const SEM_LABEL = {
    1: 'Semester 1 (Year I)', 2: 'Semester 2 (Year I)',
    3: 'Semester 3 (Year II)', 4: 'Semester 4 (Year II)',
    5: 'Semester 5 (Year III)', 6: 'Semester 6 (Year III)',
    7: 'Semester 7 (Year IV)', 8: 'Semester 8 (Year IV)',
}

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

export default function ManageSubjects() {
    const { user, logout } = useAuth()

    // Filter
    const [depts, setDepts] = useState([])
    const [deptId, setDeptId] = useState('')
    const [semester, setSemester] = useState('')

    // Subject list
    const [subjects, setSubjects] = useState([])
    const [listLoading, setListLoading] = useState(false)

    // Add form
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [staffName, setStaffName] = useState('')
    const [addLoading, setAddLoading] = useState(false)

    // Bulk
    const [bulkText, setBulkText] = useState('')
    const [bulkMode, setBulkMode] = useState(false)

    // Toast
    const [toast, setToast] = useState(null)
    const showToast = (msg, type = 'success') => setToast({ msg, type })

    // Admin profile state
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showAdminPwdModal, setShowAdminPwdModal] = useState(false)
    const [adminOldPassword, setAdminOldPassword] = useState('')
    const [adminNewPassword, setAdminNewPassword] = useState('')
    const [adminPwdLoading, setAdminPwdLoading] = useState(false)

    const [teachers, setTeachers] = useState([])

    useEffect(() => {
        api.get('/departments/').then(({ data }) => setDepts(data))
        api.get('/teachers/').then(({ data }) => setTeachers(data)).catch(() => { })
    }, [])

    const loadSubjects = () => {
        if (!deptId || !semester) { showToast('Select Department and Semester first', 'error'); return }
        setListLoading(true)
        api.get(`/subjects/?department=${deptId}&semester=${semester}`)
            .then(({ data }) => setSubjects(data))
            .catch(() => showToast('Failed to load subjects', 'error'))
            .finally(() => setListLoading(false))
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!code.trim() || !name.trim()) { showToast('Subject code and name are required', 'error'); return }
        if (!deptId || !semester) { showToast('Select Department and Semester first', 'error'); return }
        setAddLoading(true)
        try {
            const { data } = await api.post('/subjects/create/', {
                code: code.trim(), name: name.trim(),
                staff_name: staffName.trim(),
                department_id: deptId, semester
            })
            setSubjects(prev => [...prev, data].sort((a, b) => a.code.localeCompare(b.code)))
            setCode(''); setName(''); setStaffName('')
            showToast(`${data.code} - ${data.name} added!`)
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to add subject', 'error')
        } finally {
            setAddLoading(false)
        }
    }

    // Bulk add: "CODE, Subject Name" per line
    const handleBulkAdd = async () => {
        if (!deptId || !semester) { showToast('Select Department and Semester first', 'error'); return }
        const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
        let added = 0, failed = 0
        setAddLoading(true)
        for (const line of lines) {
            const parts = line.split(',')
            if (parts.length < 2) { failed++; continue }
            const c = parts[0].trim()
            const n = parts.slice(1).join(',').trim()
            try {
                const { data } = await api.post('/subjects/create/', {
                    code: c, name: n, department_id: deptId, semester
                })
                setSubjects(prev => [...prev, data])
                added++
            } catch { failed++ }
        }
        setSubjects(prev => [...prev].sort((a, b) => a.code.localeCompare(b.code)))
        setBulkText('')
        setAddLoading(false)
        showToast(`${added} subjects added${failed ? `, ${failed} failed/duplicate` : ''}`, failed && added === 0 ? 'error' : 'success')
    }

    const handleDelete = async (subj) => {
        if (!window.confirm(`Delete ${subj.code} - ${subj.name}? All marks for this subject will also be removed.`)) return
        try {
            await api.delete(`/subjects/${subj.id}/delete/`)
            setSubjects(prev => prev.filter(s => s.id !== subj.id))
            showToast(`${subj.code} deleted`)
        } catch {
            showToast('Failed to delete subject', 'error')
        }
    }

    const handleAssignTeacher = async (subjId, teacherId) => {
        try {
            const { data } = await api.patch(`/subjects/${subjId}/assign/`, { teacher_id: teacherId || null })
            setSubjects(prev => prev.map(s => s.id === subjId ? data : s))
            showToast('Teacher assigned successfully')
        } catch {
            showToast('Failed to assign teacher', 'error')
        }
    }

    // Assign Students Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false)
    const [assignLoading, setAssignLoading] = useState(false)
    const [currentSubject, setCurrentSubject] = useState(null)
    const [deptStudents, setDeptStudents] = useState([]) // all students in this dept/sem year
    const [selectedStudentIds, setSelectedStudentIds] = useState(new Set())
    const [modalBatchFilter, setModalBatchFilter] = useState('') // Filter by batch inside modal

    const openAssignModal = async (subj) => {
        setCurrentSubject(subj)
        setSelectedStudentIds(new Set(subj.assigned_students || []))
        setModalBatchFilter('')
        setAssignModalOpen(true)
        setAssignLoading(true)
        
        // Compute year from semester: Sem 1,2=I; 3,4=II; 5,6=III; 7,8=IV
        const yearMap = { 1: 'I', 2: 'I', 3: 'II', 4: 'II', 5: 'III', 6: 'III', 7: 'IV', 8: 'IV' }
        const year = yearMap[subj.semester]

        try {
            const { data } = await api.get(`/students/?department=${subj.department}&year=${year}`)
            setDeptStudents(data)
        } catch {
            showToast('Failed to load students for assignment', 'error')
        } finally {
            setAssignLoading(false)
        }
    }

    const toggleStudentSelection = (studentId) => {
        const next = new Set(selectedStudentIds)
        if (next.has(studentId)) {
            next.delete(studentId)
        } else {
            next.add(studentId)
        }
        setSelectedStudentIds(next)
    }

    const handleSaveAssignments = async () => {
        if (!currentSubject) return
        setAssignLoading(true)
        try {
            const payload = { student_ids: Array.from(selectedStudentIds) }
            const { data } = await api.post(`/subjects/${currentSubject.id}/assign_students/`, payload)
            
            // Update the subject list with new data
            setSubjects(prev => prev.map(s => s.id === currentSubject.id ? data : s))
            showToast(`Assigned ${payload.student_ids.length} students to ${currentSubject.code}`)
            setAssignModalOpen(false)
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to assign students', 'error')
        } finally {
            setAssignLoading(false)
        }
    }

    // Edit Subject Modal State
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editLoading, setEditLoading] = useState(false)
    const [editForm, setEditForm] = useState({ id: null, code: '', name: '', staff_name: '' })

    const openEditModal = (subj) => {
        setEditForm({
            id: subj.id,
            code: subj.code,
            name: subj.name,
            staff_name: subj.staff_name || ''
        })
        setEditModalOpen(true)
    }

    const handleEditSave = async (e) => {
        e.preventDefault()
        if (!editForm.code.trim() || !editForm.name.trim()) {
            showToast('Subject code and name are required', 'error')
            return
        }
        setEditLoading(true)
        try {
            const { data } = await api.patch(`/subjects/${editForm.id}/update/`, {
                code: editForm.code.trim(),
                name: editForm.name.trim(),
                staff_name: editForm.staff_name.trim()
            })
            setSubjects(prev => prev.map(s => s.id === editForm.id ? data : s).sort((a, b) => a.code.localeCompare(b.code)))
            setEditModalOpen(false)
            showToast('Subject updated successfully')
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to update subject', 'error')
        } finally {
            setEditLoading(false)
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
                        <small>Admin Portal - Manage Subjects</small>
                    </div>
                </div>
                <div className="navbar-right">
                    <Link to="/admin" className="btn btn-outline"
                        style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13 }}>
                        ← Dashboard
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
                        <div className="section-title">Select Department & Semester</div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                                <label>DEPARTMENT</label>
                                <select id="subj-dept" value={deptId} onChange={e => { setDeptId(e.target.value); setSubjects([]) }}>
                                    <option value="">Select Department</option>
                                    {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
                                <label>SEMESTER</label>
                                <select id="subj-sem" value={semester} onChange={e => { setSemester(e.target.value); setSubjects([]) }}>
                                    <option value="">Select Semester</option>
                                    {SEMESTERS.map(s => <option key={s} value={s}>{SEM_LABEL[s]}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>&nbsp;</label>
                                <button id="subj-load-btn" className="btn btn-primary" onClick={loadSubjects} disabled={!deptId || !semester}>
                                    View Subjects
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Add Subject Panel */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div className="section-title" style={{ margin: 0 }}>Add Subjects</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className={`btn ${!bulkMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBulkMode(false)}>Single</button>
                                <button className={`btn ${bulkMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBulkMode(true)}>Bulk Paste</button>
                            </div>
                        </div>

                        {!bulkMode ? (
                            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ flex: '0 0 160px' }}>
                                    <label>SUBJECT CODE</label>
                                    <input id="add-subj-code" type="text" placeholder="e.g. CS3001"
                                        value={code} onChange={e => setCode(e.target.value)} />
                                </div>
                                <div className="form-group" style={{ flex: '1 1 260px' }}>
                                    <label>SUBJECT NAME</label>
                                    <input id="add-subj-name" type="text" placeholder="e.g. Database Management Systems"
                                        value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div className="form-group" style={{ flex: '1 1 200px' }}>
                                    <label>STAFF NAME</label>
                                    <input id="add-subj-staff" type="text" placeholder="e.g. Ms. T. Renuga"
                                        value={staffName} onChange={e => setStaffName(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>&nbsp;</label>
                                    <button id="add-subj-btn" type="submit" className="btn btn-primary" disabled={addLoading}>
                                        {addLoading ? 'Adding...' : '+ Add Subject'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <p style={{ color: 'var(--text-light)', fontSize: 13, marginBottom: 8 }}>
                                    Paste one subject per line: <code>SubjectCode, Subject Name</code>
                                </p>
                                <textarea
                                    id="subj-bulk-paste"
                                    rows={6}
                                    style={{
                                        width: '100%', background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                                        borderRadius: 8, padding: 12, color: 'var(--text)', fontSize: 13, fontFamily: 'monospace', resize: 'vertical'
                                    }}
                                    placeholder={"CS3001, Discrete Mathematics\nCS3002, Computer Organization\nCS3003, Database Management Systems\nCS3004, Operating Systems\nCS3005, Design and Analysis of Algorithms"}
                                    value={bulkText}
                                    onChange={e => setBulkText(e.target.value)}
                                />
                                <button id="subj-bulk-add-btn" className="btn btn-primary" style={{ marginTop: 10 }}
                                    onClick={handleBulkAdd} disabled={addLoading || !bulkText.trim()}>
                                    {addLoading ? 'Adding...' : 'Add All Subjects'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Subject List */}
                    {listLoading && <div className="loader"><div className="spinner" /><span>Loading...</span></div>}

                    {!listLoading && subjects.length > 0 && (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{
                                padding: '14px 20px', display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', borderBottom: '1px solid var(--border)'
                            }}>
                                <div className="section-title" style={{ margin: 0 }}>
                                    {SEM_LABEL[semester]} — Subjects &nbsp;
                                    <span style={{
                                        background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 20,
                                        padding: '2px 12px', fontSize: 12, fontWeight: 700
                                    }}>
                                        {subjects.length}
                                    </span>
                                </div>
                            </div>
                            <table className="marks-table" style={{ margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Subject Code</th>
                                        <th>Subject Name</th>
                                        <th>Staff Name</th>
                                        <th>Semester</th>
                                        <th style={{ textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.map((subj, i) => (
                                        <tr key={subj.id}>
                                            <td style={{ color: 'var(--text-light)' }}>{i + 1}</td>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{subj.code}</td>
                                            <td>{subj.name}</td>
                                            <td style={{ color: 'var(--text-light)', fontStyle: subj.staff_name ? 'normal' : 'italic' }}>
                                                {subj.staff_name || '—'}
                                            </td>
                                            <td>
                                                <select
                                                    value={subj.teacher || ''}
                                                    onChange={e => handleAssignTeacher(subj.id, e.target.value)}
                                                    style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12 }}
                                                >
                                                    <option value="">-- Unassigned --</option>
                                                    {teachers.map(t => (
                                                        <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td><span className="role-badge">Sem {subj.semester}</span></td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button className="btn btn-primary" onClick={() => openAssignModal(subj)}
                                                    style={{ padding: '4px 10px', fontSize: 12, marginRight: 6 }}>
                                                    Assign Students ({subj.assigned_students?.length || 0})
                                                </button>
                                                <button className="btn btn-outline" onClick={() => openEditModal(subj)}
                                                    style={{ padding: '4px 10px', fontSize: 12, marginRight: 6 }}>
                                                    Edit
                                                </button>
                                                <button className="btn btn-outline" onClick={() => handleDelete(subj)}
                                                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '4px 10px', fontSize: 12 }}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!listLoading && subjects.length === 0 && deptId && semester && (
                        <div className="empty-state card">
                            <div className="icon">📚</div>
                            <p>No subjects found for this selection. Use the form above to add subjects.</p>
                        </div>
                    )}

                </div>
            </div>

            {/* Edit Subject Modal */}
            {editModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: 450, maxWidth: '90vw', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)' }}>Edit Subject: {editForm.code}</h3>
                            <button className="btn btn-outline" style={{ padding: '2px 8px', borderColor: 'transparent' }} onClick={() => setEditModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleEditSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group">
                                <label>SUBJECT CODE</label>
                                <input type="text" value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>SUBJECT NAME</label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>STAFF NAME (Optional)</label>
                                <input type="text" value={editForm.staff_name} onChange={e => setEditForm({ ...editForm, staff_name: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Students Modal */}
            {assignModalOpen && currentSubject && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: 600, maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--primary)' }}>Assign Students: {currentSubject.code}</h3>
                            <button className="btn btn-outline" style={{ padding: '2px 8px', borderColor: 'transparent' }} onClick={() => setAssignModalOpen(false)}>✕</button>
                        </div>
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--text-light)' }}>
                                Select the students who are enrolled in this elective/subject. If no students are selected, the system may fall back to default behavior.
                            </p>
                            
                            {assignLoading ? (
                                <div className="loader" style={{ padding: 40 }}><div className="spinner" /></div>
                            ) : deptStudents.length === 0 ? (
                                <div className="empty-state" style={{ padding: 40 }}>No students found for this department/year.</div>
                            ) : (
                                <>
                                    {/* Batch Filter and Select All */}
                                    <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end', background: 'var(--bg-card-2)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                                        <div className="form-group" style={{ flex: 1, margin: 0, minWidth: 140 }}>
                                            <label style={{ fontSize: 11 }}>FILTER BY BATCH</label>
                                            <select 
                                                value={modalBatchFilter} 
                                                onChange={e => setModalBatchFilter(e.target.value)}
                                                style={{ padding: '6px 10px', fontSize: 13 }}
                                            >
                                                <option value="">All Batches</option>
                                                {Array.from(new Map(deptStudents.map(s => [s.batch, s.batch_label])).entries()).map(([id, label]) => (
                                                    <option key={id} value={id}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button 
                                                className="btn btn-outline"
                                                style={{ fontSize: 12, padding: '8px 14px', whiteSpace: 'nowrap' }}
                                                onClick={() => {
                                                    const filtered = modalBatchFilter 
                                                        ? deptStudents.filter(s => String(s.batch) === String(modalBatchFilter))
                                                        : deptStudents;
                                                    const next = new Set(selectedStudentIds)
                                                    filtered.forEach(s => next.add(s.id))
                                                    setSelectedStudentIds(next)
                                                }}
                                            >
                                                Select All {modalBatchFilter ? 'in Batch' : 'Visible'}
                                            </button>
                                            <button 
                                                className="btn btn-outline"
                                                style={{ fontSize: 12, padding: '8px 14px', whiteSpace: 'nowrap', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                                onClick={() => {
                                                    const filtered = modalBatchFilter 
                                                        ? deptStudents.filter(s => String(s.batch) === String(modalBatchFilter))
                                                        : deptStudents;
                                                    const next = new Set(selectedStudentIds)
                                                    filtered.forEach(s => next.delete(s.id))
                                                    setSelectedStudentIds(next)
                                                }}
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                                        <div style={{ padding: '8px 12px', background: 'var(--bg-card-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                                                Total Selected: {selectedStudentIds.size}
                                            </span>
                                            <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                                                {modalBatchFilter ? `Showing ${deptStudents.filter(s => String(s.batch) === String(modalBatchFilter)).length} students in batch` : `Showing all ${deptStudents.length} students`}
                                            </span>
                                        </div>
                                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                            {deptStudents
                                                .filter(st => !modalBatchFilter || String(st.batch) === String(modalBatchFilter))
                                                .map(st => (
                                                    <label key={st.id} style={{
                                                        display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', 
                                                        borderBottom: '1px solid var(--border)', cursor: 'pointer', margin: 0,
                                                        background: selectedStudentIds.has(st.id) ? 'var(--primary-dim)' : 'transparent'
                                                    }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedStudentIds.has(st.id)}
                                                            onChange={() => toggleStudentSelection(st.id)}
                                                        />
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontWeight: 600, fontSize: 14 }}>{st.roll_no}</span>
                                                            <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{st.name}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--bg-card-2)' }}>
                            <button className="btn btn-outline" onClick={() => setAssignModalOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveAssignments} disabled={assignLoading}>
                                {assignLoading ? 'Saving...' : 'Save Assignments'}
                            </button>
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
