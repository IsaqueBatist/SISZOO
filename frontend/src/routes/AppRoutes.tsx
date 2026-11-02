import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { ThemeProvider } from '@/components/ThemeProvider'
import { PaginaNaoEncontrada } from '../pages/PaginaNaoEncontrada'
import { RotaAdmin } from './RotaAdmin'
import { RotaEscritaAnimais } from './RotaEscritaAnimais'
import { RotaEscritaOcorrencias } from './RotaEscritaOcorrencias'
import { RotaEscritaProcessos } from './RotaEscritaProcessos'
import { RotaGestaoBaias } from './RotaGestaoBaias'
import { RotaLeituraOcorrencias } from './RotaLeituraOcorrencias'
import { RotaProtegida } from './RotaProtegida'
import { RouteErrorBoundary } from './RouteErrorBoundary'

const EditarProcesso = lazy(() =>
  import('@/features/processos/components/EditarProcesso').then((m) => ({ default: m.EditarProcesso })),
)
const Login = lazy(() => import('@/features/auth/components/Login').then((m) => ({ default: m.Login })))
const EsqueciSenha = lazy(() =>
  import('@/features/auth/components/EsqueciSenha').then((m) => ({ default: m.EsqueciSenha })),
)
const RedefinirSenha = lazy(() =>
  import('@/features/auth/components/RedefinirSenha').then((m) => ({ default: m.RedefinirSenha })),
)
const TrocarSenha = lazy(() =>
  import('@/features/auth/components/TrocarSenha').then((m) => ({ default: m.TrocarSenha })),
)
const Dashboard = lazy(() =>
  import('@/features/dashboard/components/Dashboard').then((m) => ({ default: m.Dashboard })),
)
const AlertaVacinasDetalhe = lazy(() =>
  import('@/features/alertas/components/AlertaVacinasDetalhe').then((m) => ({ default: m.AlertaVacinasDetalhe })),
)
const AlertaEsterilizacaoDetalhe = lazy(() =>
  import('@/features/alertas/components/AlertaEsterilizacaoDetalhe').then((m) => ({
    default: m.AlertaEsterilizacaoDetalhe,
  })),
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
const Medicamentos = lazy(() =>
  import('@/features/medicamentos/components/Medicamentos').then((m) => ({ default: m.Medicamentos })),
)
const Vacinas = lazy(() =>
  import('@/features/vacinas/components/Vacinas').then((m) => ({ default: m.Vacinas })),
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
const EditarOcorrencia = lazy(() =>
  import('@/features/ocorrencias/components/EditarOcorrencia').then((m) => ({ default: m.EditarOcorrencia })),
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
const Relatorios = lazy(() =>
  import('@/features/relatorios/components/Relatorios').then((m) => ({ default: m.Relatorios })),
)
const Perfil = lazy(() => import('@/features/perfil/components/Perfil').then((m) => ({ default: m.Perfil })))
const Configuracoes = lazy(() =>
  import('@/features/configuracoes/components/Configuracoes').then((m) => ({ default: m.Configuracoes })),
)
const Usuarios = lazy(() =>
  import('@/features/usuarios/components/Usuarios').then((m) => ({ default: m.Usuarios })),
)
const Logs = lazy(() => import('@/features/auditoria/components/Logs').then((m) => ({ default: m.Logs })))

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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />

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
              <Route path="/alertas/esterilizacao" element={<AlertaEsterilizacaoDetalhe />} />
              <Route path="/animais" element={<Animais />} />
              <Route path="/animais/:id" element={<FichaAnimal />} />
              <Route element={<RotaEscritaAnimais />}>
                <Route path="/animais/novo" element={<CadastrarAnimal />} />
                <Route path="/animais/:id/editar" element={<EditarAnimal />} />
              </Route>
              <Route path="/medicamentos" element={<Medicamentos />} />
              <Route path="/vacinas" element={<Vacinas />} />
              <Route element={<RotaGestaoBaias />}>
                <Route path="/baias" element={<GestaoBaias />} />
              </Route>
              <Route element={<RotaLeituraOcorrencias />}>
                <Route path="/ocorrencias" element={<Ocorrencias />} />
                <Route path="/ocorrencias/:id" element={<OcorrenciaDetalhe />} />
                <Route element={<RotaEscritaOcorrencias />}>
                  <Route path="/ocorrencias/novo" element={<CadastrarOcorrencia />} />
                  <Route path="/ocorrencias/:id/editar" element={<EditarOcorrencia />} />
                </Route>
              </Route>
              <Route path="/processos" element={<Processos />} />
              <Route path="/processos/:id" element={<ProcessoDetalhe />} />
              <Route element={<RotaEscritaProcessos />}>
                <Route path="/processos/novo" element={<CadastrarProcesso />} />
              </Route>
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route element={<RotaAdmin />}>
                <Route path="/processos/:id/editar" element={<EditarProcesso />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/logs" element={<Logs />} />
              </Route>
              <Route path="*" element={<PaginaNaoEncontrada />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  )
}
