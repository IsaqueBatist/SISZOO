import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Animais } from '../features/animais/Animais'
import { CadastrarAnimal } from '../features/animais/CadastrarAnimal'
import { EditarAnimal } from '../features/animais/EditarAnimal'
import { FichaAnimal } from '../features/animais/FichaAnimal'
import { Login } from '../features/auth/Login'
import { TrocarSenha } from '../features/auth/TrocarSenha'
import { GestaoBaias } from '../features/baias/GestaoBaias'
import { Configuracoes } from '../features/configuracoes/Configuracoes'
import { Dashboard } from '../features/dashboard/Dashboard'
import { Perfil } from '../features/perfil/Perfil'
import { Usuarios } from '../features/usuarios/Usuarios'
import { ThemeProvider } from '../lib/ThemeProvider'
import { EmConstrucao } from '../pages/EmConstrucao'
import { RotaAdmin } from './RotaAdmin'
import { RotaEscritaAnimais } from './RotaEscritaAnimais'
import { RotaGestaoBaias } from './RotaGestaoBaias'
import { RotaProtegida } from './RotaProtegida'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<RotaProtegida />}>
        <Route path="/trocar-senha" element={<TrocarSenha />} />
        <Route
          element={
            <ThemeProvider>
              <Layout />
            </ThemeProvider>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/animais" element={<Animais />} />
          <Route path="/animais/:id" element={<FichaAnimal />} />
          <Route element={<RotaEscritaAnimais />}>
            <Route path="/animais/novo" element={<CadastrarAnimal />} />
            <Route path="/animais/:id/editar" element={<EditarAnimal />} />
          </Route>
          <Route element={<RotaGestaoBaias />}>
            <Route path="/baias" element={<GestaoBaias />} />
          </Route>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route element={<RotaAdmin />}>
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
          <Route path="*" element={<EmConstrucao />} />
        </Route>
      </Route>
    </Routes>
  )
}
