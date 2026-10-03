import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Login } from '@/features/auth/components/Login'
import { ThemeProvider } from '@/components/ThemeProvider'
import { EmConstrucao } from '../pages/EmConstrucao'
import { RotaAdmin } from './RotaAdmin'
import { RotaEscritaAnimais } from './RotaEscritaAnimais'
import { RotaEscritaOcorrencias } from './RotaEscritaOcorrencias'
import { RotaEscritaProcessos } from './RotaEscritaProcessos'
import { RotaGestaoBaias } from './RotaGestaoBaias'
import { RotaProtegida } from './RotaProtegida'
import { RouteErrorBoundary } from './RouteErrorBoundary'

// Code-splitting por rota (máquinas do CCZ têm ~2GB RAM):
// só as telas atrás de login, carregadas sob demanda. Login fica fora porque
// é a primeira tela de toda sessão — lazy nela só adicionaria uma
// ida à rede sem reduzir o que precisa carregar de qualquer forma.
const TrocarSenha = lazy(() =>
  import('@/features/auth/components/TrocarSenha').then((m) => ({ default: m.TrocarSenha })),
)
const Dashboard = lazy(() =>
  import('@/features/dashboard/components/Dashboard').then((m) => ({ default: m.Dashboard })),
)
const AlertaVacinasDetalhe = lazy(() =>
  import('@/features/alertas/components/AlertaVacinasDetalhe').then((m) => ({ default: m.AlertaVacinasDetalhe })),
)
const Animais = lazy(() => import('@/features/animais/components/Animais').then((m) => ({ default: m.Animais })))
const FichaAnimal = lazy(() =>
  import('@/features/animais/components/FichaAnimal').then((m) => ({ default: m.FichaAnimal })),
)
const CadastrarAnimal = lazy(() =>
  import('@/features/animais/components/CadastrarAnimal').then((m) => ({ default: m.CadastrarAnimal })),
)
const EditarAnimal = lazy(() =>
  import('@/features/animais/components/EditarAnimal').then((m) => ({ default: m.EditarAnimal })),
)
const GestaoBaias = lazy(() =>
  import('@/features/baias/components/GestaoBaias').then((m) => ({ default: m.GestaoBaias })),
)
const Ocorrencias = lazy(() =>
  import('@/features/ocorrencias/components/Ocorrencias').then((m) => ({ default: m.Ocorrencias })),
)
const OcorrenciaDetalhe = lazy(() =>
  import('@/features/ocorrencias/components/OcorrenciaDetalhe').then((m) => ({ default: m.OcorrenciaDetalhe })),
)
const CadastrarOcorrencia = lazy(() =>
  import('@/features/ocorrencias/components/CadastrarOcorrencia').then((m) => ({ default: m.CadastrarOcorrencia })),
)
const Processos = lazy(() =>
  import('@/features/processos/components/Processos').then((m) => ({ default: m.Processos })),
)
const ProcessoDetalhe = lazy(() =>
  import('@/features/processos/components/ProcessoDetalhe').then((m) => ({ default: m.ProcessoDetalhe })),
)
const CadastrarProcesso = lazy(() =>
  import('@/features/processos/components/CadastrarProcesso').then((m) => ({ default: m.CadastrarProcesso })),
)
const Perfil = lazy(() => import('@/features/perfil/components/Perfil').then((m) => ({ default: m.Perfil })))
const Configuracoes = lazy(() =>
  import('@/features/configuracoes/components/Configuracoes').then((m) => ({ default: m.Configuracoes })),
)
const Usuarios = lazy(() =>
  import('@/features/usuarios/components/Usuarios').then((m) => ({ default: m.Usuarios })),
)

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
              <Route path="/ocorrencias" element={<Ocorrencias />} />
              <Route path="/ocorrencias/:id" element={<OcorrenciaDetalhe />} />
              <Route element={<RotaEscritaOcorrencias />}>
                <Route path="/ocorrencias/novo" element={<CadastrarOcorrencia />} />
              </Route>
              <Route path="/processos" element={<Processos />} />
              <Route path="/processos/:id" element={<ProcessoDetalhe />} />
              <Route element={<RotaEscritaProcessos />}>
                <Route path="/processos/novo" element={<CadastrarProcesso />} />
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
