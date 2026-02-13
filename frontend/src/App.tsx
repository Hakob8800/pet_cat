import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import PublicMenu from './pages/PublicMenu'
import Dashboard from './pages/admin/Dashboard'
import RestaurantEdit from './pages/admin/RestaurantEdit'
import MenuEdit from './pages/admin/MenuEdit'
import Orders from './pages/admin/Orders'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/menu/:slug" element={<PublicMenu />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected admin routes */}
      <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/restaurant/:id" element={<ProtectedRoute><RestaurantEdit /></ProtectedRoute>} />
      <Route path="/admin/restaurant/:id/menu" element={<ProtectedRoute><MenuEdit /></ProtectedRoute>} />
      <Route path="/admin/restaurant/:id/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
