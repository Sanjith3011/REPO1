import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts'

const ASSESSMENT_LABELS = {
    CT1: 'Class Test – 1', CT2: 'Class Test – 2', CT3: 'Class Test – 3',
    CAT1: 'CAT – 1', CAT2: 'CAT – 2',
}

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
                        <small>Student Performance Dashboard</small>
                    </div>
                </div>
                <div className="navbar-right">
                    <div 
                        className="navbar-user" 
                        onClick={() => setShowProfileMenu(!showProfileMenu)} 
                        style={{ cursor: 'pointer', position: 'relative' }}
                    >
                        <div className="avatar">{user?.first_name?.[0] || 'S'}</div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.first_name} {user?.last_name}</div>
                            <span className="role-badge" style={{ background: 'rgba(0,188,212,0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                Student <span style={{ fontSize: 10 }}>▼</span>
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

export default function StudentDashboard() {
    const { user, logout } = useAuth()
    const [marks, setMarks] = useState([])
    const [student, setStudent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [viewMode, setViewMode] = useState('raw') // 'raw', '100', '60'
    const [showGraphs, setShowGraphs] = useState(true)

    useEffect(() => {
        api.get('/student/marks/')
            .then(({ data }) => {
                // Strict front-end failsafe: drop any "ghost" marks that have no value and aren't marked absent
                const cleanMarks = (data.marks || []).filter(
                    m => m.is_absent || (m.marks !== null && m.marks !== undefined && m.marks !== '')
                );
                setMarks(cleanMarks)
                setStudent(data.student)
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const filtered = filter ? marks.filter(m => m.assessment_type === filter) : marks

    // Grouping: Year -> Semester -> Assessment
    const yearGroups = {}
    for (const m of filtered) {
        if (!yearGroups[m.year]) yearGroups[m.year] = {}
        const semKey = `${m.semester_label} (Year ${m.year})`
        if (!yearGroups[m.year][semKey]) yearGroups[m.year][semKey] = {}
        if (!yearGroups[m.year][semKey][m.assessment_type]) yearGroups[m.year][semKey][m.assessment_type] = []
        yearGroups[m.year][semKey][m.assessment_type].push(m)
    }

    const uniqueTypes = [...new Set(marks.map(m => m.assessment_type))]

    // Graph Data Calculations
    const getTrendData = () => {
        const types = ['CT1', 'CAT1', 'CT2', 'CAT2', 'CT3']
        return types.map(type => {
            const matches = marks.filter(m => m.assessment_type === type && m.marks !== null && !m.is_absent)
            if (matches.length === 0) return null
            const avg = matches.reduce((acc, curr) => acc + (curr.marks / curr.max_marks * 100), 0) / matches.length
            return { name: ASSESSMENT_LABELS[type] || type, score: Math.round(avg) }
        }).filter(Boolean)
    }

    const trendData = getTrendData()

    // Overall stats
    const totalSubjects = marks.length
    const passCount = marks.filter(m => m.status === 'Pass').length
    const failCount = marks.filter(m => m.status === 'Fail').length
    const absentCount = marks.filter(m => m.status === 'AB').length

    return (
        <div>
            <Navbar user={user} onLogout={logout} />
            <div className="page-wrapper">
                <div className="container">

                    {/* Student info card */}
                    {student && (
                        <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{
                                width: 60, height: 60, borderRadius: '50%',
                                background: 'linear-gradient(135deg,var(--primary),var(--primary-light))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 22, fontWeight: 800
                            }}>
                                {user?.first_name?.[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{student.name}</div>
                                <div style={{ color: 'var(--text-light)', fontSize: 13 }}>
                                    {student.roll_no} · {student.department_name} · Batch {student.batch_label}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <div style={{ textAlign: 'center', padding: '10px 20px', background: 'var(--success-bg)', borderRadius: 10 }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{passCount}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600 }}>PASS</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '10px 20px', background: 'var(--danger-bg)', borderRadius: 10 }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)' }}>{failCount}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600 }}>FAIL</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '10px 20px', background: 'var(--absent-bg)', borderRadius: 10 }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--absent)' }}>{absentCount}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600 }}>ABSENT</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filters & Toggles */}
                    <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button className={`btn ${filter === '' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('')}>
                                All Assessments
                            </button>
                            {uniqueTypes.map(t => (
                                <button key={t} className={`btn ${filter === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(t)}>
                                    {ASSESSMENT_LABELS[t] || t}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <button className="btn btn-outline" onClick={() => setShowGraphs(!showGraphs)} style={{ fontSize: 12 }}>
                                {showGraphs ? 'Hide Graphs' : 'Show Graphs'}
                            </button>
                            <div style={{ display: 'flex', background: 'var(--bg-card-2)', padding: 4, borderRadius: 8, border: '1px solid var(--border)', gap: 4 }}>
                                {['raw', '100', '60'].map(mode => (
                                    <button 
                                        key={mode} 
                                        className="btn" 
                                        onClick={() => setViewMode(mode)}
                                        style={{ 
                                            fontSize: 11, padding: '4px 10px', minWidth: 50,
                                            background: viewMode === mode ? 'var(--primary)' : 'transparent',
                                            color: viewMode === mode ? '#fff' : 'var(--text-light)',
                                            border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600
                                        }}
                                    >
                                        {mode.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Graphs Section */}
                    {!loading && showGraphs && trendData.length > 0 && (
                        <div className="grid" style={{ gridTemplateColumns: '1fr', marginBottom: 30 }}>
                            <div className="card" style={{ height: 320, padding: '20px 10px 10px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: 15, color: 'var(--text-light)' }}>
                                    PERFORMANCE TREND (%)
                                </div>
                                <ResponsiveContainer width="100%" height="90%">
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                        <XAxis dataKey="name" fontSize={10} tick={{ fill: 'var(--text-light)' }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} fontSize={10} tick={{ fill: 'var(--text-light)' }} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                                            cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                                        />
                                        <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {!loading && marks.length === 0 && (
                        <div className="empty-state card">
                            <div className="icon">📭</div>
                            <p>No marks have been entered for you yet.</p>
                        </div>
                    )}

                    {!loading && Object.entries(yearGroups).sort(([a], [b]) => b.localeCompare(a)).map(([year, semesters]) => (
                        <div key={year} style={{ marginBottom: 40 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                <div style={{ height: 2, background: 'var(--primary-dim)', flex: 1 }}></div>
                                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-light)', margin: 0, textTransform: 'uppercase', letterSpacing: 2 }}>
                                    Academic Year {year}
                                </h2>
                                <div style={{ height: 2, background: 'var(--primary-dim)', flex: 1 }}></div>
                            </div>

                            {Object.entries(semesters).sort(([a], [b]) => b.localeCompare(a)).map(([semTitle, assessments]) => (
                                <div key={semTitle} className="card" style={{ marginBottom: 24, padding: '16px 20px', background: 'var(--bg-card-2)' }}>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 20 }}>📅</span> {semTitle}
                                    </h3>

                                    {Object.entries(assessments).map(([atype, subjMarks]) => {
                                        const radarData = subjMarks.map(m => ({
                                            subject: m.subject_code,
                                            fullSubject: m.subject_name,
                                            Score: (m.marks === 'AB' || m.marks === null) ? 0 : Math.round((m.marks / m.max_marks) * 100)
                                        }));
                                        const tLabel = ASSESSMENT_LABELS[atype] || atype;

                                        return (
                                        <div key={atype} style={{ marginBottom: 40 }}>
                                            <div style={{ 
                                                fontSize: 15, fontWeight: 800, color: 'var(--primary)', 
                                                marginBottom: 16, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8,
                                                borderBottom: '1px solid var(--border)', paddingBottom: 8
                                            }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div>
                                                {tLabel}
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, padding: '0 8px' }}>
                                                {/* Left side: Radar Chart */}
                                                {(showGraphs && radarData.length > 2) && (
                                                    <div style={{ flex: '1 1 300px', maxWidth: 450, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
                                                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-light)', textAlign: 'center', marginBottom: 10, letterSpacing: 1 }}>
                                                            PERFORMANCE FOOTPRINT
                                                        </div>
                                                        <div style={{ width: '100%', height: 260 }}>
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                                                    <PolarGrid stroke="var(--border)" />
                                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text)', fontSize: 11, fontWeight: 600 }} />
                                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-light)', fontSize: 10 }} />
                                                                    <Radar name="Score" dataKey="Score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} strokeWidth={2} />
                                                                    <Tooltip formatter={(value) => `${value}%`} />
                                                                </RadarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Right side: Detailed Cards Grid */}
                                                <div style={{ flex: '2 1 400px' }}>
                                                    <div className="student-marks-grid">
                                                        {subjMarks.map((m, i) => {
                                                            const statusClass = m.status === 'Pass' ? 'pass' : 
                                                                              m.status === 'AB' ? 'absent' : 
                                                                              m.status === 'Pending' ? 'pending' : 'fail'
                                                            
                                                            let displayMarks = m.marks;
                                                            if (m.marks !== 'AB' && m.marks !== '—') {
                                                                if (viewMode === '100') {
                                                                    displayMarks = `${Math.round((m.marks / m.max_marks) * 100)}%`;
                                                                } else if (viewMode === '60') {
                                                                    displayMarks = (m.marks / m.max_marks * 60).toFixed(1);
                                                                }
                                                            }
                                                            
                                                            return (
                                                                <div key={i} className={`subject-card ${statusClass}`} style={{ transition: 'all 0.3s ease' }}>
                                                                    <div className="sub-code">{m.subject_code}</div>
                                                                    <div className="sub-name">{m.subject_name}</div>
                                                                    <div className="sub-marks" style={{ color: statusClass === 'fail' ? 'var(--danger)' : statusClass === 'pending' ? 'var(--text-muted)' : 'inherit' }}>
                                                                        {displayMarks}
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                                                        <div className="sub-max" style={{ fontSize: 10 }}>
                                                                            {viewMode === 'raw' 
                                                                                ? `Max: ${m.max_marks} | Pass: ${m.max_marks * 0.5}`
                                                                                : `Raw: ${m.marks}/${m.max_marks}`
                                                                            }
                                                                        </div>
                                                                        <span className={`badge badge-${statusClass}`} style={{ fontSize: 9, padding: '2px 8px' }}>
                                                                            {m.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            ))}
                        </div>
                    ))}

                </div>
            </div>
        </div>
    )
}
