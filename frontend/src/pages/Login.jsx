import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const [loginType, setLoginType] = useState('student')

    // Student Form
    const [studentName, setStudentName] = useState('')
    const [regNo, setRegNo] = useState('')

    // Staff Form
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        let payload;
        if (loginType === 'student') {
            payload = { role: 'student', username: regNo, name: studentName }
        } else {
            payload = { username, password }
        }

        try {
            const user = await login(payload)
            if (user.role === 'admin') navigate('/admin')
            else if (user.role === 'teacher') navigate('/teacher')
            else navigate('/student')
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid login credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-box">
                <div className="login-logo-container">
                    <img src="/logo.png" alt="College Logo" className="login-image-logo" />
                </div>
                <h2>JAI SHRIRAM ENGINEERING<br />COLLEGE</h2>
                <p>Internal Assessment Marks Management System</p>

                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <button
                        type="button"
                        onClick={() => { setLoginType('student'); setError('') }}
                        className={`btn ${loginType === 'student' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1, padding: '8px' }}
                    >Student</button>
                    <button
                        type="button"
                        onClick={() => { setLoginType('staff'); setError('') }}
                        className={`btn ${loginType === 'staff' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1, padding: '8px' }}
                    >Staff (Teacher/Admin)</button>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div className="login-error">⚠️ {error}</div>}

                    {loginType === 'student' ? (
                        <>
                            <div className="form-group">
                                <label>STUDENT NAME</label>
                                <input
                                    className="form-control login-input"
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    value={studentName}
                                    onChange={e => setStudentName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>REGISTER NUMBER</label>
                                <input
                                    className="form-control login-input"
                                    type="text"
                                    placeholder="e.g. 711221104001"
                                    value={regNo}
                                    onChange={e => setRegNo(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>USERNAME</label>
                                <input
                                    className="form-control login-input"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>PASSWORD</label>
                                <input
                                    className="form-control login-input"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <button id="login-btn" className="login-btn-custom" type="submit" disabled={loading}>
                        {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, display: 'inline-block', verticalAlign: 'middle', marginRight: 8, borderColor: '#fff3cd', borderTopColor: '#fff' }} /> Signing In...</> : 'Sign In'}
                    </button>
                </form>

                <div className="login-footer-text">
                    <strong>Demo accounts:</strong><br />
                    Admin → <code>admin / admin123</code><br />
                    Teacher → <code>teacher1 / pass123</code><br />
                    Student → <code>John Doe / 711221104001</code><br /><br />
                    (An Autonomous Institution) - Tiruppur<br />
                    Approved by AICTE - Affiliated to Anna University
                </div>
            </div>
        </div>
    )
}
