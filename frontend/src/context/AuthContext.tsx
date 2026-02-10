import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { login as apiLogin, register as apiRegister } from '../api/client'

interface User {
  id: number
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Restore user from localStorage on mount
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    const { token, userId, name } = res.data
    localStorage.setItem('token', token)
    const userData = { id: userId, email, name }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const register = async (email: string, password: string, name: string) => {
    const res = await apiRegister(email, password, name)
    const { token, userId } = res.data
    localStorage.setItem('token', token)
    const userData = { id: userId, email, name }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
