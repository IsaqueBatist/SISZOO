import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Login } from '../features/auth/Login'
import { TrocarSenha } from '../features/auth/TrocarSenha'
import { Dashboard } from '../features/dashboard/Dashboard'
import { Usuarios } from '../features/usuarios/Usuarios'
import { EmConstrucao } from '../pages/EmConstrucao'
import { RotaAdmin } from './RotaAdmin'
import { RotaProtegida } from './RotaProtegida'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<RotaProtegida />}>
        <Route path="/trocar-senha" element={<TrocarSenha />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route element={<RotaAdmin />}>
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
          <Route path="*" element={<EmConstrucao />} />
        </Route>
      </Route>
    </Routes>
  )
}
