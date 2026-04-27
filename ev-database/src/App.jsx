import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import TopNav from './components/layout/TopNav'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const AdvisorPage = lazy(() => import('./pages/AdvisorPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const IceHomePage = lazy(() => import('./pages/IceHomePage'))
const TruckPage = lazy(() => import('./pages/TruckPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const Calculator = lazy(() => import('./pages/Calculator'))

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

function AppShell() {
  const location = useLocation()
  const isTruckArea = location.pathname.startsWith('/e-lkw')

  return (
    <>
      {!isTruckArea && <TopNav />}
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/kaufberater" element={<AdvisorPage />} />
          <Route path="/autos" element={<HomePage />} />
          <Route path="/verbrenner" element={<IceHomePage />} />
          <Route path="/e-lkw" element={<TruckPage />} />
          <Route path="/e-lkw/:truckSection" element={<TruckPage />} />
          <Route path="/e-lkw/:truckSection/:truckSubsection" element={<TruckPage />} />
          <Route path="/rechner" element={<Calculator />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <ProtectedRoute><AdminPage /></ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </>
  )
}

function RouteLoading() {
  return <div className="app-route-loading">Inhalt wird geladen...</div>
}
