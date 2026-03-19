import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import EntryView from './pages/EntryView'
import NewEntry from './pages/NewEntry'
import EditEntry from './pages/EditEntry'
import Profile from './pages/Profile'
import PublicBlog from './pages/PublicBlog'
import PublicEntryView from './pages/PublicEntryView'

export const ThemeContext = createContext()
export const useTheme = () => useContext(ThemeContext)
export const AuthContext = createContext()
export const useAuthContext = () => useContext(AuthContext)

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)' }} />
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const auth = useAuth()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={auth}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Public blog view */}
          <Route path="/u/:slug" element={<PublicBlog />} />
          <Route path="/u/:slug/entry/:id" element={<PublicEntryView />} />
          {/* Private routes */}
          <Route path="/notebook" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/entry/:id" element={<PrivateRoute><EntryView /></PrivateRoute>} />
          <Route path="/new" element={<PrivateRoute><NewEntry /></PrivateRoute>} />
          <Route path="/edit/:id" element={<PrivateRoute><EditEntry /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}
