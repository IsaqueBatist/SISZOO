import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Login } from '../features/auth/Login'
import { ThemeProvider } from '../lib/ThemeProvider'
import { EmConstrucao } from '../pages/EmConstrucao'
import { RotaAdmin } from './RotaAdmin'
import { RotaEscritaAnimais } from './RotaEscritaAnimais'
import { RotaGestaoBaias } from './RotaGestaoBaias'
import { RotaProtegida } from './RotaProtegida'
import { RouteErrorBoundary } from './RouteErrorBoundary'

// Code-splitting por rota (máquinas do CCZ têm ~2GB RAM — ver frontend/CLAUDE.md):
// só as telas atrás de login, carregadas sob demanda. Login fica fora porque
// é a primeira tela de toda sessão — lazy nela só adicionaria uma
// ida à rede sem reduzir o que precisa carregar de qualquer forma.
const TrocarSenha = lazy(() => import('../features/auth/TrocarSenha').then((m) => ({ default: m.TrocarSenha })))
const Dashboard = lazy(() => import('../features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })))
const AlertaVacinasDetalhe = lazy(() =>
  import('../features/alertas/AlertaVacinasDetalhe').then((m) => ({ default: m.AlertaVacinasDetalhe })),
)
const Animais = lazy(() => import('../features/animais/Animais').then((m) => ({ default: m.Animais })))
const FichaAnimal = lazy(() => import('../features/animais/FichaAnimal').then((m) => ({ default: m.FichaAnimal })))
const CadastrarAnimal = lazy(() =>
  import('../features/animais/CadastrarAnimal').then((m) => ({ default: m.CadastrarAnimal })),
)
const EditarAnimal = lazy(() => import('../features/animais/EditarAnimal').then((m) => ({ default: m.EditarAnimal })))
const GestaoBaias = lazy(() => import('../features/baias/GestaoBaias').then((m) => ({ default: m.GestaoBaias })))
const Perfil = lazy(() => import('../features/perfil/Perfil').then((m) => ({ default: m.Perfil })))
const Configuracoes = lazy(() =>
  import('../features/configuracoes/Configuracoes').then((m) => ({ default: m.Configuracoes })),
)
const Usuarios = lazy(() => import('../features/usuarios/Usuarios').then((m) => ({ default: m.Usuarios })))

function CarregandoRota() {
  return (
    <div className="page-header">
      <div className="title-block">
        <p className="subtitle">Carregando…</p>
      </div>
    </div>
  )
}

export function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<CarregandoRota />}>
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
              <Route path="/alertas/vacinas" element={<AlertaVacinasDetalhe />} />
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
      </Suspense>
    </RouteErrorBoundary>
  )
}
