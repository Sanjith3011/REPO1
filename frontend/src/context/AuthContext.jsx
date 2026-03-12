import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (token) {
            api.get('/auth/me/')
                .then(({ data }) => setUser(data))
                .catch(() => { localStorage.clear(); setUser(null) })
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [])

    const login = async (payload) => {
        const { data } = await api.post('/auth/login/', payload)
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        const { data: me } = await api.get('/auth/me/')
        setUser(me)
        return me
    }

    const logout = () => {
        localStorage.clear()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
