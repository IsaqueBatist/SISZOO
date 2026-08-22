import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Login } from '../features/auth/Login'
import { Dashboard } from '../features/dashboard/Dashboard'
import { EmConstrucao } from '../pages/EmConstrucao'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<EmConstrucao />} />
      </Route>
    </Routes>
  )
}
