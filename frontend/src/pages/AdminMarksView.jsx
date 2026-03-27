import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    AreaChart, Area, Cell, ScatterChart, Scatter, LabelList
} from 'recharts'

const ASSESSMENT_TYPES = [
    { value: 'CT1', label: 'Class Test – 1', max: 30 },
    { value: 'CT2', label: 'Class Test – 2', max: 30 },
    { value: 'CT3', label: 'Class Test – 3', max: 30 },
    { value: 'CAT1', label: 'CAT – 1', max: 100 },
    { value: 'CAT2', label: 'CAT – 2', max: 100 },
]

const YEARS = ['I', 'II', 'III', 'IV']
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

function Navbar({ user, onLogout }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showPwdModal, setShowPwdModal] = useState(false)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [pwdLoading, setPwdLoading] = useState(false)

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (!oldPassword || !newPassword) {
            alert('Both fields are required')
            return
        }
        setPwdLoading(true)
        try {
            await api.post('/auth/change-password/', {
                old_password: oldPassword,
                new_password: newPassword
            })
            alert('Password changed successfully! You can use it next time you log in.')
            setShowPwdModal(false)
            setOldPassword('')
            setNewPassword('')
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to change password')
        } finally {
            setPwdLoading(false)
        }
    }

    return (
        <>
            <nav className="navbar">
                <div className="navbar-brand">
                    <div className="nav-logo-box">
                        <img src="/logo.png" alt="Logo" className="nav-logo-img" />
                    </div>
                    <div>
                        <h1>Jai Shriram Engineering College</h1>
                        <small>Internal Assessment Portal</small>
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
                                width: 220, zIndex: 1000, overflow: 'hidden', textAlign: 'left'
                            }} onClick={e => e.stopPropagation()}>
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
                                        onClick={onLogout}
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
        </>
    )
}

function Toast({ message, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
    return <div className={`toast ${type}`}>{message}</div>
}

export default function AdminMarksView() {
    const { user, logout } = useAuth()

    // Filter state
    const [departments, setDepartments] = useState([])
    const [batches, setBatches] = useState([])
    const [subjects, setSubjects] = useState([])
    const [filter, setFilter] = useState({ department: '', batch: '', year: '', semester: '', assessment_type: '' })

    // Marks state
    const [students, setStudents] = useState([])   // [{student_id, roll_no, name, marks:{subj_id:{value,is_absent}}}]
    const [localMarks, setLocalMarks] = useState({}) // {`${student_id}_${subject_id}`: string}
    const [loadingMarks, setLoadingMarks] = useState(false)
    const [showTable, setShowTable] = useState(false)
    const [showGraph, setShowGraph] = useState(false)
    const [isComparisonMode, setIsComparisonMode] = useState(false)
    const [comparisonAssessmentType, setComparisonAssessmentType] = useState('')
    const [comparisonStudents, setComparisonStudents] = useState([]) // Comparison data
    const [loadingComparison, setLoadingComparison] = useState(false)

    const [toast, setToast] = useState(null)
    const showToast = (message, type = 'success') => setToast({ message, type })

    // Load departments on mount
    useEffect(() => {
        api.get('/departments/').then(r => setDepartments(r.data))
    }, [])

    // Load batches when department changes
    useEffect(() => {
        if (filter.department) {
            api.get(`/batches/?department=${filter.department}`)
                .then(r => setBatches(Array.isArray(r.data) ? r.data : (r.data.batches || [])))
                .catch(() => setBatches([]))
        } else setBatches([])
    }, [filter.department])

    // Load subjects when department+semester changes
    useEffect(() => {
        if (filter.department && filter.semester) {
            api.get(`/subjects/?department=${filter.department}&semester=${filter.semester}`)
                .then(r => setSubjects(Array.isArray(r.data) ? r.data : (r.data.subjects || [])))
                .catch(() => setSubjects([]))
        } else setSubjects([])
    }, [filter.department, filter.semester])

    const setF = (key, val) => setFilter(f => ({ ...f, [key]: val }))

    // Derive academic year (I–IV) from batch year_start
    const computeYearFromBatch = (batchId) => {
        if (!batchId) return ''
        const batch = batches.find(b => String(b.id) === String(batchId))
        if (!batch || !batch.year_start) return ''
        
        const now = new Date()
        // Academic year starts in July: if month < 7 (Jan-Jun), academic start = prev calendar year
        const academicStart = now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear()
        
        const yearNum = academicStart - batch.year_start + 1
        const MAP = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' }
        return MAP[yearNum] || ''
    }

    // Auto semester from year: I→1, II→3, III→5, IV→7
    const computeSemesterFromYear = (yearStr) => {
        const MAP = { 'I': 1, 'II': 3, 'III': 5, 'IV': 7 }
        if (!MAP[yearStr]) return ''
        const now = new Date()
        // Jan-Jun (month < 6) is roughly the even semester (2, 4, 6, 8)
        const isEvenSemester = now.getMonth() < 6 
        return isEvenSemester ? MAP[yearStr] + 1 : MAP[yearStr]
    }

    // Custom Max State
    const [customMax, setCustomMax] = useState(15) // Will auto-update on load
    const [customMaxInput, setCustomMaxInput] = useState('')

    const getAssessmentMax = () => ASSESSMENT_TYPES.find(a => a.value === filter.assessment_type)?.max || 15

    const canLoad = filter.department && filter.batch && filter.year && filter.semester && filter.assessment_type

    const loadMarks = async () => {
        if (!canLoad) return
        setLoadingMarks(true)
        setShowTable(false)
        try {
            const { data } = await api.get('/marks/', { params: filter })
            setStudents(data.students || [])
            
            // Set standard max as default custom max
            const standardMax = getAssessmentMax()
            setCustomMax(standardMax)
            setCustomMaxInput(String(standardMax))

            // init localMarks from existing data
            const init = {}
            for (const st of data.students || []) {
                for (const [subj_id, mv] of Object.entries(st.marks)) {
                    const key = `${st.student_id}_${subj_id}`
                    init[key] = mv.not_enrolled ? 'N/A' : (mv.value === null ? '' : mv.is_absent ? 'AB' : String(mv.value))
                }
            }
            setLocalMarks(init)

            // If Comparison Mode is ON and a second assessment is selected, load it too
            if (isComparisonMode && comparisonAssessmentType) {
                setLoadingComparison(true);
                try {
                    const compResp = await api.get('/marks/', { 
                        params: { ...filter, assessment_type: comparisonAssessmentType } 
                    });
                    setComparisonStudents(compResp.data.students || []);
                } catch (e) {
                    showToast('Error loading comparison data', 'error');
                } finally {
                    setLoadingComparison(false);
                }
            } else {
                setComparisonStudents([]);
            }

            setShowTable(true)
        } catch (e) {
            showToast('Error loading marks', 'error')
        } finally {
            setLoadingMarks(false)
        }
    }

    const handleApplyMax = () => {
        const newMax = parseFloat(customMaxInput)
        if (isNaN(newMax) || newMax <= 0) {
            // Revert on invalid
            setCustomMaxInput(String(customMax))
            showToast('Invalid Maximum Marks', 'error')
            return
        }
        
        if (newMax === customMax) return // No change

        // Scale all existing numeric local marks to the newly declared max
        // Formula: New Mark = (Old Mark / Old Max) * New Max
        const nextMarks = { ...localMarks }
        for (const [key, val] of Object.entries(nextMarks)) {
            if (val && val !== 'AB' && val !== 'N/A' && val !== '') {
                const oldVal = parseFloat(val)
                if (!isNaN(oldVal)) {
                    // Calculate scaled value and round to 1 decimal place max (or integer if possible)
                    let scaled = (oldVal / customMax) * newMax
                    scaled = Math.round(scaled * 10) / 10 
                    nextMarks[key] = String(scaled)
                }
            }
        }
        
        setLocalMarks(nextMarks)
        setCustomMax(newMax)
    }

    // Per-student stats
    const getStudentStats = (student_id) => {
        let pass = 0, fail = 0, absent = 0
        const passThresh = customMax * 0.5
        for (const subj of subjects) {
            const key = `${student_id}_${subj.id}`
            const val = localMarks[key]
            if (!val || val === '' || val === 'N/A') continue
            if (val === 'AB') { absent++; continue }
            const num = parseFloat(val)
            if (!isNaN(num)) { num >= passThresh ? pass++ : fail++ }
        }
        return { pass, fail, absent }
    }

    // Per-subject stats
    const getSubjectStats = (subject_id) => {
        const passThresh = customMax * 0.5
        let attended = 0, pass = 0, fail = 0
        for (const st of students) {
            const key = `${st.student_id}_${subject_id}`
            const val = localMarks[key]
            if (!val || val === '' || val === 'N/A') continue
            if (val === 'AB') continue
            const num = parseFloat(val)
            if (!isNaN(num)) {
                attended++
                num >= passThresh ? pass++ : fail++
            }
        }
        const pct = attended > 0 ? ((pass / attended) * 100).toFixed(1) : '0.0'

        // Calculate Mean, Median, Mode
        const marks = students.map(st => localMarks[`${st.student_id}_${subject_id}`])
                              .filter(v => v !== '' && v !== 'AB' && v !== 'N/A' && v !== undefined)
                              .map(v => parseFloat(v))
                              .filter(n => !isNaN(n));
        
        let mean = 0, median = 0, mode = 0;
        if (marks.length > 0) {
            mean = (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1);
            const sorted = [...marks].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            median = sorted.length % 2 !== 0 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1);
            
            const counts = {};
            marks.forEach(m => counts[m] = (counts[m] || 0) + 1);
            let maxCount = 0;
            for (const m in counts) {
                if (counts[m] > maxCount) {
                    maxCount = counts[m];
                    mode = m;
                }
            }
        }

        return { attended, pass, fail, pct, mean, median, mode }
    }

    const getSubjectStatsWithSD = (subject_id) => {
        const stats = getSubjectStats(subject_id)
        
        const marks = students.map(st => localMarks[`${st.student_id}_${subject_id}`])
                              .filter(v => v !== '' && v !== 'AB' && v !== 'N/A' && v !== undefined)
                              .map(v => parseFloat(v))
                              .filter(n => !isNaN(n));
        
        let stdev = 0;
        if (marks.length > 1) {
            const m = parseFloat(stats.mean);
            const squareDiffs = marks.map(v => Math.pow(v - m, 2));
            const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / marks.length;
            stdev = Math.sqrt(avgSquareDiff).toFixed(2);
        }
        
        return { ...stats, stdev, marks }
    }

    // Helper to generate Bell Curve data
    const generateBellCurveData = (mean, stdev, maxMarks) => {
        if (stdev <= 0) return [];
        const points = [];
        const m = parseFloat(mean);
        const s = parseFloat(stdev);
        
        // Generate points from mean-3sd to mean+3sd, clamped to [0, maxMarks]
        const step = maxMarks / 50;
        for (let x = 0; x <= maxMarks; x += step) {
            const exponent = -Math.pow(x - m, 2) / (2 * Math.pow(s, 2));
            const y = (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
            points.push({ x: Math.round(x * 10) / 10, y: y });
        }
        return points;
    }

    // Per-subject marks distribution (percentage bands)
    const getSubjectMarkDistribution = (subject_id) => {
        let bands = { '< 50%': 0, '50-60%': 0, '60-70%': 0, '70-80%': 0, '80-90%': 0, '90-100%': 0 }
        for (const st of students) {
            const key = `${st.student_id}_${subject_id}`
            const val = localMarks[key]
            if (!val || val === '' || val === 'N/A' || val === 'AB') continue
            const num = parseFloat(val)
            if (!isNaN(num)) {
                const pct = (num / customMax) * 100
                if (pct < 50) bands['< 50%']++
                else if (pct < 60) bands['50-60%']++
                else if (pct < 70) bands['60-70%']++
                else if (pct < 80) bands['70-80%']++
                else if (pct < 90) bands['80-90%']++
                else bands['90-100%']++
            }
        }
        return bands
    }

    // Class summary
    const getClassSummary = () => {
        const passThresh = customMax * 0.5
        let attended = 0, passStudents = 0, failStudents = 0
        let arrear1 = 0, arrear2 = 0, arrear3plus = 0

        for (const st of students) {
            let enrolledCount = 0, absentCount = 0, failCount = 0, passCount = 0
            for (const subj of subjects) {
                const key = `${st.student_id}_${subj.id}`
                const val = localMarks[key]
                if (val === 'N/A' || val === undefined || val === '') continue
                
                enrolledCount++
                if (val === 'AB') {
                    absentCount++
                } else {
                    const num = parseFloat(val)
                    if (!isNaN(num)) {
                        if (num < passThresh) failCount++
                        else passCount++
                    }
                }
            }

            if (enrolledCount > 0 && absentCount < enrolledCount) {
                attended++
                const totalArrears = failCount + absentCount
                if (totalArrears === 0 && passCount > 0) {
                    passStudents++
                } else if (totalArrears > 0) {
                    failStudents++
                    if (totalArrears === 1) arrear1++
                    else if (totalArrears === 2) arrear2++
                    else arrear3plus++
                }
            }
        }
        const pct = attended > 0 ? ((passStudents / attended) * 100).toFixed(1) : '0.0'
        return { total: students.length, attended, pass: passStudents, fail: failStudents, pct, arrear1, arrear2, arrear3plus }
    }

    const handleExportPDF = async () => {
        try {
            const params = new URLSearchParams(filter).toString()
            const response = await api.get(`/marks/export-pdf/?${params}`, {
                responseType: 'blob'
            })
            
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `assessment_${filter.assessment_type}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            showToast('PDF generation failed', 'error')
        }
    }

    const handleExportCSV = async () => {
        try {
            const params = new URLSearchParams(filter).toString()
            const response = await api.get(`/marks/export-csv/?${params}`, {
                responseType: 'blob'
            })
            
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `assessment_${filter.assessment_type}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            showToast('CSV export failed', 'error')
        }
    }

    const cs = showTable ? getClassSummary() : null
    const assessmentLabel = ASSESSMENT_TYPES.find(a => a.value === filter.assessment_type)?.label || ''

    return (
        <div>
            <Navbar user={user} onLogout={logout} />
            <div className="page-wrapper">
                <div className="container">
                    <div style={{ marginBottom: 16 }}>
                        <Link to="/admin" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                            <span>←</span> Back to Dashboard
                        </Link>
                    </div>

                    {/* ── Selection Panel ── */}
                    <div className="selection-panel">
                        <div className="section-title">Select Assessment Parameters</div>
                        <div className="filter-grid">
                            <div className="form-group">
                                <label>Department</label>
                                <select id="dept-select" className="form-control" value={filter.department} onChange={e => setF('department', e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Batch</label>
                                <select id="batch-select" className="form-control" value={filter.batch ? String(filter.batch) : ''}
                                    onChange={e => {
                                        const batchId = e.target.value
                                        const batch = batches.find(b => String(b.id) === batchId)
                                        if (!batchId || !batch) {
                                            setFilter(f => ({ ...f, batch: '', year: '', semester: '' }))
                                            return
                                        }
                                        const year = computeYearFromBatch(batchId)
                                        const semester = computeSemesterFromYear(year)
                                        // Update state with string IDs
                                        setFilter(f => ({ ...f, batch: batchId, year, semester }))
                                    }}
                                    disabled={!filter.department}>
                                    <option value="">-- Select --</option>
                                    {batches.map(b => <option key={b.id} value={String(b.id)}>{b.label || `${b.year_start}–${b.year_end}`}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Year</label>
                                <select id="year-select" className="form-control" value={filter.year || ''} onChange={e => setF('year', e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Semester</label>
                                <select id="sem-select" className="form-control" value={filter.semester || ''} onChange={e => setF('semester', e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Assessment Type</label>
                                <select id="assessment-select" className="form-control" value={filter.assessment_type} onChange={e => setF('assessment_type', e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {ASSESSMENT_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                </select>
                            </div>

                            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                                <button id="load-marks-btn" className="btn btn-primary" onClick={loadMarks} disabled={!canLoad || loadingMarks}>
                                    {loadingMarks ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Loading...</> : '📋 Load Marks'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Marks Table ── */}
                    {loadingMarks && <div className="loader"><div className="spinner" /><span>Loading student data...</span></div>}

                    {showTable && students.length === 0 && (
                        <div className="empty-state card">
                            <div className="icon">📭</div>
                            <p>No students found for the selected parameters.</p>
                        </div>
                    )}

                    {showTable && students.length > 0 && (
                        <>
                            <div className="card" style={{ marginBottom: 16, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <strong style={{ fontSize: 16, color: 'var(--primary)' }}>{assessmentLabel}</strong>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card-2)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 600 }}>Standard Max:</span>
                                            <span style={{ fontWeight: 700, fontSize: 14 }}>{getAssessmentMax()}</span>
                                        </div>
                                        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Conducted Max:</span>
                                            <input 
                                                type="number" 
                                                className="form-control"
                                                style={{ width: 60, padding: '4px 8px', fontSize: 14, fontWeight: 700, textAlign: 'center' }}
                                                value={customMaxInput}
                                                onChange={e => setCustomMaxInput(e.target.value)}
                                                onBlur={handleApplyMax}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleApplyMax();
                                                    }
                                                }}
                                                title="Change this value to automatically scale entered marks to the new maximum"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className={`btn ${!showGraph ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowGraph(false)}>
                                        📋 Table View
                                    </button>
                                    <button className={`btn ${showGraph ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowGraph(true)}>
                                        📈 Graph View
                                    </button>
                                    <button id="export-pdf-btn" className="btn btn-accent" onClick={handleExportPDF}>
                                        📄 Export PDF
                                    </button>
                                    <button id="export-csv-btn" className="btn btn-outline" style={{ borderColor: '#2e7d32', color: '#2e7d32' }} onClick={handleExportCSV}>
                                        📊 Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="card" style={{ marginBottom: 16, padding: '14px 20px', background: 'var(--bg-body)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isComparisonMode} 
                                            onChange={e => setIsComparisonMode(e.target.checked)}
                                            style={{ width: 18, height: 18 }}
                                        />
                                        Enable Comparison Mode
                                    </label>
                                    
                                    {isComparisonMode && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, maxWidth: 400 }}>
                                            <label style={{ whiteSpace: 'nowrap', fontSize: 13, fontWeight: 700 }}>Compare Test 1 with:</label>
                                            <select 
                                                className="form-control" 
                                                value={comparisonAssessmentType} 
                                                onChange={e => setComparisonAssessmentType(e.target.value)}
                                            >
                                                <option value="">-- Select Test 2 --</option>
                                                {ASSESSMENT_TYPES.filter(a => a.value !== filter.assessment_type).map(a => (
                                                    <option key={a.value} value={a.value}>{a.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {showGraph ? (
                                <div className="card" style={{ marginBottom: 20, padding: 24 }}>
                                    {isComparisonMode && comparisonStudents.length > 0 ? (
                                        <>
                                            <div className="section-title" style={{ marginBottom: 24, textAlign: 'center' }}>
                                                Test Comparison: {ASSESSMENT_TYPES.find(a => a.value === filter.assessment_type)?.label} vs {ASSESSMENT_TYPES.find(a => a.value === comparisonAssessmentType)?.label}
                                            </div>
                                            <div style={{ width: '100%', height: 450, marginBottom: 50 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={subjects.map(s => {
                                                            const stats1 = getSubjectStats(s.id);
                                                            // Calculate stats for second assessment
                                                            let attended2 = 0, pass2 = 0;
                                                            comparisonStudents.forEach(st => {
                                                                const mv = st.marks[s.id];
                                                                if (mv && !mv.not_enrolled && mv.value !== null && !mv.is_absent) {
                                                                    attended2++;
                                                                    const num = parseFloat(mv.value);
                                                                    if (num >= (getAssessmentMax() * 0.5)) pass2++;
                                                                }
                                                            });
                                                            const pct2 = attended2 > 0 ? ((pass2 / attended2) * 100).toFixed(1) : '0.0';
                                                            
                                                            return {
                                                                name: s.code,
                                                                test1: parseFloat(stats1.pct),
                                                                test2: parseFloat(pct2),
                                                            };
                                                        })}
                                                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis dataKey="name" />
                                                        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar name={ASSESSMENT_TYPES.find(a => a.value === filter.assessment_type)?.label} dataKey="test1" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                                        <Bar name={ASSESSMENT_TYPES.find(a => a.value === comparisonAssessmentType)?.label} dataKey="test2" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="section-title" style={{ marginBottom: 24, textAlign: 'center' }}>
                                                Subject-wise Pass Percentage
                                            </div>
                                            <div style={{ width: '100%', height: 400, marginBottom: 40 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={subjects.map(s => ({
                                                            name: s.code,
                                                            fullName: s.name,
                                                            percentage: parseFloat(getSubjectStats(s.id).pct)
                                                        }))}
                                                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                                                        <defs>
                                                            <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.9}/>
                                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.6}/>
                                                            </linearGradient>
                                                            <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.8}/>
                                                                <stop offset="95%" stopColor="var(--danger)" stopOpacity={0.5}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
                                                        <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                                                        <Tooltip />
                                                        <Bar dataKey="percentage" radius={[6, 6, 0, 0]} barSize={45}>
                                                            {subjects.map((s, index) => {
                                                                const pct = parseFloat(getSubjectStats(s.id).pct);
                                                                return <Cell key={`cell-${index}`} fill={pct >= 50 ? 'url(#colorPass)' : 'url(#colorFail)'} />;
                                                            })}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </>
                                    )}
                                    
                                    <div className="section-title" style={{ marginBottom: 24, textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 40 }}>
                                        Mark Distribution & Bell Curve (Standard Deviation)
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 30 }}>
                                        {subjects.map(s => {
                                            const stats = getSubjectStatsWithSD(s.id);
                                            const bellData = generateBellCurveData(stats.mean, stats.stdev, customMax);
                                            return (
                                                <div key={s.id} className="card" style={{ padding: 16, background: '#fcfcfc' }}>
                                                    <div style={{ fontWeight: 700, marginBottom: 16, textAlign: 'center', color: 'var(--primary)' }}>
                                                        {s.code}: {s.name}
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 15, marginBottom: 15, fontSize: 12 }}>
                                                        <div className="badge blue">Mean: {stats.mean}</div>
                                                        <div className="badge blue">Median: {stats.median}</div>
                                                        <div className="badge purple">σ (SD): {stats.stdev}</div>
                                                    </div>
                                                    <div style={{ width: '100%', height: 200 }}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={bellData}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                                                                <XAxis dataKey="x" hide />
                                                                <YAxis hide />
                                                                <Tooltip 
                                                                    labelFormatter={(v) => `Mark: ${bellData[v]?.x}`}
                                                                    formatter={(v) => [`${Math.round(v * 1000) / 1000}`, 'Density']}
                                                                />
                                                                <Area 
                                                                    type="monotone" 
                                                                    dataKey="y" 
                                                                    stroke="var(--primary)" 
                                                                    fill="var(--primary)" 
                                                                    fillOpacity={0.2} 
                                                                    strokeWidth={2}
                                                                />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div style={{ fontSize: 11, textAlign: 'center', color: 'var(--text-light)', marginTop: 8 }}>
                                                        Normal Distribution based on class performance
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="section-title" style={{ marginBottom: 24, textAlign: 'center', marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 40 }}>
                                        Subject-wise Mark Distribution (Percentage Range)
                                    </div>
                                    <div style={{ width: '100%', height: 450 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={subjects.map(s => ({
                                                    name: s.code,
                                                    ...getSubjectMarkDistribution(s.id)
                                                }))}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="< 50%" stackId="a" fill="#ef4444" />
                                                <Bar dataKey="50-60%" stackId="a" fill="#f97316" />
                                                <Bar dataKey="60-70%" stackId="a" fill="#eab308" />
                                                <Bar dataKey="70-80%" stackId="a" fill="#84cc16" />
                                                <Bar dataKey="80-90%" stackId="a" fill="#22c55e" />
                                                <Bar dataKey="90-100%" stackId="a" fill="#15803d" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="marks-table-wrapper" style={{ marginBottom: 20 }}>
                                        <table className="marks-table">
                                            <thead>
                                        <tr>
                                            <th>S.No</th>
                                            <th>Roll No</th>
                                            <th>Student Name</th>
                                            {subjects.map(s => (
                                                <th key={s.id} title={s.name}>
                                                    {s.code}<br />
                                                    <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>{s.name.length > 18 ? s.name.slice(0, 18) + '…' : s.name}</span>
                                                </th>
                                            ))}
                                            <th style={{ background: '#1b5e20' }}>Pass</th>
                                            <th style={{ background: '#b71c1c' }}>Fail</th>
                                            <th style={{ background: '#4a148c' }}>Absent</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((st, idx) => {
                                            const stats = getStudentStats(st.student_id)
                                            return (
                                                <tr key={st.student_id}>
                                                    <td>{idx + 1}</td>
                                                    <td style={{ textAlign: 'left', paddingLeft: 12, fontWeight: 600 }}>{st.roll_no}</td>
                                                    <td style={{ textAlign: 'left', paddingLeft: 12 }}>{st.name}</td>
                                                    {subjects.map(subj => {
                                                        const key = `${st.student_id}_${subj.id}`
                                                        const val = localMarks[key] || ''
                                                        const isAbsent = val === 'AB'
                                                        const num = parseFloat(val)
                                                        let cls = ''
                                                        if (isAbsent) cls = 'absent'
                                                        else if (!isNaN(num) && val !== '') cls = num >= customMax * 0.5 ? 'pass' : 'fail'
                                                        return (
                                                            <td key={subj.id}>
                                                                {val === 'N/A' ? (
                                                                    <span style={{ color: 'var(--text-muted)', fontSize: 13, userSelect: 'none' }}>—</span>
                                                                ) : (
                                                                    <div className={`mark-input ${cls}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '38px', background: 'transparent', cursor: 'default' }}>
                                                                        {val || '—'}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )
                                                    })}
                                                    <td className="stat-cell-pass">{stats.pass}</td>
                                                    <td className="stat-cell-fail">{stats.fail}</td>
                                                    <td className="stat-cell-absent">{stats.absent}</td>
                                                </tr>
                                            )
                                        })}

                                        {/* Subject-wise summary rows */}
                                        <tr className="summary-row header-row">
                                            <td colSpan={3} style={{ textAlign: 'left', paddingLeft: 12 }}>📊 Subject Summary</td>
                                            {subjects.map(s => <td key={s.id}></td>)}
                                            <td colSpan={3}></td>
                                        </tr>
                                        {['Attended', 'Pass', 'Fail', 'Pass %'].map(label => (
                                            <tr key={label} className="summary-row">
                                                <td colSpan={3} style={{ textAlign: 'left', paddingLeft: 12, fontWeight: 700 }}>{label}</td>
                                                {subjects.map(subj => {
                                                    const s = getSubjectStats(subj.id)
                                                    const val = label === 'Attended' ? s.attended : label === 'Pass' ? s.pass : label === 'Fail' ? s.fail : `${s.pct}%`
                                                    return <td key={subj.id}>{val}</td>
                                                })}
                                                <td colSpan={3}></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Subject-wise Summary Table ── */}
                            <div className="section-title" style={{ marginTop: 24 }}>Subject-wise Performance Summary</div>
                            <div className="marks-table-wrapper" style={{ marginBottom: 20 }}>
                                <table className="marks-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 48 }}>S.No</th>
                                            <th style={{ textAlign: 'left', paddingLeft: 12, minWidth: 260 }}>Name of the Subject</th>
                                            <th style={{ textAlign: 'left', paddingLeft: 12, minWidth: 160 }}>Name of the Staff</th>
                                            <th>Attended</th>
                                            <th>Passed</th>
                                            <th>Failed</th>
                                            <th>Mean</th>
                                            <th>Median</th>
                                            <th>Mode</th>
                                            <th>Pass %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjects.map((subj, i) => {
                                            const s = getSubjectStats(subj.id)
                                            return (
                                                <tr key={subj.id}>
                                                    <td>{i + 1}</td>
                                                    <td style={{ textAlign: 'left', paddingLeft: 12 }}>
                                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: 12 }}>{subj.code}</span>
                                                        {' — '}{subj.name}
                                                    </td>
                                                    <td style={{ textAlign: 'left', paddingLeft: 12, color: 'var(--text-light)' }}>
                                                        {subj.staff_name || <em style={{ color: 'var(--text-muted)' }}>Not set</em>}
                                                    </td>
                                                    <td>{s.attended}</td>
                                                    <td className="stat-cell-pass">{s.pass}</td>
                                                    <td className="stat-cell-fail">{s.fail}</td>
                                                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{s.mean}</td>
                                                    <td style={{ fontWeight: 600 }}>{s.median}</td>
                                                    <td style={{ fontWeight: 600 }}>{s.mode}</td>
                                                    <td style={{ fontWeight: 700 }}>{s.pct}%</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Bottom two-column summary ── */}
                            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
                                {/* Left: class counts */}
                                <div style={{ flex: '1 1 320px' }}>
                                    <div className="marks-table-wrapper">
                                        <table className="marks-table">
                                            <tbody>
                                                {[
                                                    { label: 'TOTAL NO OF STUDENTS', value: cs.total },
                                                    { label: 'NO OF STUDENTS ATTENDED', value: cs.attended },
                                                    { label: 'NO OF STUDENTS PASSED', value: cs.pass },
                                                    { label: 'NO OF STUDENTS FAILED', value: cs.fail },
                                                ].map((row, i) => (
                                                    <tr key={i}>
                                                        <td style={{ textAlign: 'left', paddingLeft: 12, width: 44, fontWeight: 700, color: 'var(--text-light)' }}>{i + 1}</td>
                                                        <td style={{ textAlign: 'left', paddingLeft: 4, fontWeight: 700 }}>{row.label}</td>
                                                        <td style={{ fontWeight: 800, fontSize: 15 }}>{row.value}</td>
                                                    </tr>
                                                ))}
                                                <tr style={{ background: '#fff9e6' }}>
                                                    <td colSpan={2} style={{ textAlign: 'right', fontWeight: 700, paddingRight: 12 }}>Over all Class Pass Percentage :</td>
                                                    <td style={{ fontWeight: 800, fontSize: 15, color: 'var(--success)' }}>{cs.pct}%</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Right: arrear distribution */}
                                <div style={{ flex: '1 1 320px' }}>
                                    <div className="marks-table-wrapper">
                                        <table className="marks-table">
                                            <tbody>
                                                {[
                                                    { label: 'No of Students fail in 1 Subject', value: cs.arrear1 },
                                                    { label: 'No of Students fail in 2 Subjects', value: cs.arrear2 },
                                                    { label: 'No of Students fail in 3 Subjects', value: cs.arrear3plus },
                                                    { label: 'No of Students fail in 4 Subjects', value: 0 },
                                                    { label: 'No of Students Wash Out (All fail)', value: 0 },
                                                ].map((row, i) => (
                                                    <tr key={i}>
                                                        <td style={{ width: 44, fontWeight: 700, color: 'var(--text-light)' }}>{i + 1}</td>
                                                        <td style={{ textAlign: 'left', paddingLeft: 4 }}>{row.label}</td>
                                                        <td style={{ fontWeight: 800, fontSize: 15, color: row.value > 0 ? 'var(--danger)' : 'var(--success)' }}>{row.value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* ── Class Analysis Cards ── */}
                            <div className="section-title" style={{ marginTop: 8 }}>Overall Class Analysis</div>
                            <div className="analysis-grid">
                                <div className="analysis-card blue"><div className="value">{cs.total}</div><div className="label">Total Students</div></div>
                                <div className="analysis-card blue"><div className="value">{cs.attended}</div><div className="label">Attended</div></div>
                                <div className="analysis-card green"><div className="value">{cs.pass}</div><div className="label">Passed</div></div>
                                <div className="analysis-card red"><div className="value">{cs.fail}</div><div className="label">Failed</div></div>
                                <div className="analysis-card green"><div className="value">{cs.pct}%</div><div className="label">Pass %</div></div>
                                <div className="analysis-card amber"><div className="value">{cs.arrear1}</div><div className="label">1 Arrear</div></div>
                                <div className="analysis-card amber"><div className="value">{cs.arrear2}</div><div className="label">2 Arrears</div></div>
                                <div className="analysis-card red"><div className="value">{cs.arrear3plus}</div><div className="label">3+ Arrears</div></div>
                            </div>
                                </>
                            )}
                        </>
                    )}

                </div>
            </div>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    )
}
