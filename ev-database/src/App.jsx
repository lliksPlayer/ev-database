import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import TopNav from './components/layout/TopNav'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import IceHomePage from './pages/IceHomePage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import Calculator from './pages/Calculator'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/autos" element={<HomePage />} />
        <Route path="/verbrenner" element={<IceHomePage />} />
        <Route path="/rechner" element={<Calculator />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={
          <ProtectedRoute><AdminPage /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
