import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { resetOcorrenciasMock } from '@/features/ocorrencias/api/ocorrenciasMockStore'
import { SeletorOcorrencia } from './SeletorOcorrencia'
import type { OcorrenciaParaVinculo, VinculoDecisao } from '../types/processos.types'

function autenticarComCargos(cargos: string[]) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana.silva@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))
}

function Wrapper() {
  const [vinculoDecisao, setVinculoDecisao] = useState<VinculoDecisao>('')
  const [ocorrenciaVinculada, setOcorrenciaVinculada] = useState<OcorrenciaParaVinculo | null>(null)

  return (
    <>
      {/* Exposto só para o teste observar a decisão sem depender de travado
          (quem decide esconder a lista é o ProcessoForm, não este
          componente — ver ProcessoForm.tsx::vinculoTravado). */}
      <p data-testid="decisao">{vinculoDecisao}</p>
      <SeletorOcorrencia
        vinculoDecisao={vinculoDecisao}
        ocorrenciaId={ocorrenciaVinculada?.id ?? null}
        travado={false}
        ocorrenciaVinculada={ocorrenciaVinculada}
        onSelecionar={(ocorrencia) => {
          setVinculoDecisao('vinculado')
          setOcorrenciaVinculada(ocorrencia)
        }}
        onPular={() => {
          setVinculoDecisao('sem_vinculo')
          setOcorrenciaVinculada(null)
        }}
      />
    </>
  )
}

function renderSeletor(cargos: string[]) {
  autenticarComCargos(cargos)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <Wrapper />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SeletorOcorrencia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetOcorrenciasMock()
  })

  it('mostra o nome do denunciante para Administrador em ocorrência sigilosa', async () => {
    renderSeletor(['Administrador'])
    expect(await screen.findByText(/João Pereira Lima/)).toBeInTheDocument()
  })

  it('mascara o denunciante para Agente Sanitário em ocorrência sigilosa', async () => {
    renderSeletor(['Agente Sanitário'])
    await screen.findByText('090/2026')
    expect(screen.getByText(/Denunciante sigiloso/)).toBeInTheDocument()
    expect(screen.queryByText(/João Pereira Lima/)).not.toBeInTheDocument()
  })

  it('busca pelo nome do denunciante sigiloso não retorna a ocorrência para quem não é Admin', async () => {
    const user = userEvent.setup()
    renderSeletor(['Agente Sanitário'])
    await screen.findByText('090/2026')

    await user.type(screen.getByLabelText('Buscar ocorrência'), 'João Pereira')

    expect(await screen.findByText('Nenhuma ocorrência encontrada.')).toBeInTheDocument()
    expect(screen.queryByText('090/2026')).not.toBeInTheDocument()
  })

  it('busca pelo nome do denunciante sigiloso retorna a ocorrência para Admin', async () => {
    const user = userEvent.setup()
    renderSeletor(['Administrador'])
    await screen.findByText('090/2026')

    await user.type(screen.getByLabelText('Buscar ocorrência'), 'João Pereira')

    expect(await screen.findByText('090/2026')).toBeInTheDocument()
  })

  it('não lista ocorrência que já tem processo sanitário vinculado', async () => {
    renderSeletor(['Administrador'])
    await screen.findByText('089/2026')
    // OCORRENCIA_PROCESSO_PENDENTE_ID já tem processoVinculado no seed —
    // uma ocorrência só pode ter 0 ou 1 processo (DER.md:485,698).
    expect(screen.queryByText('092/2026')).not.toBeInTheDocument()
  })

  it('lista ocorrência encerrada normalmente (abrir processo depois do encerramento é permitido)', async () => {
    renderSeletor(['Administrador'])
    expect(await screen.findByText('070/2026')).toBeInTheDocument()
  })

  it('selecionar uma ocorrência marca a linha como selecionada', async () => {
    const user = userEvent.setup()
    renderSeletor(['Administrador'])
    const linha = await screen.findByText('089/2026')

    await user.click(linha)

    expect(linha.closest('.occur-row')).toHaveClass('selected')
  })

  it('clicar em "Pular esta etapa" não exige seleção prévia', async () => {
    const user = userEvent.setup()
    renderSeletor(['Administrador'])
    await screen.findByText('089/2026')
    expect(screen.getByTestId('decisao')).toHaveTextContent('')

    await user.click(screen.getByRole('button', { name: 'Pular esta etapa' }))

    expect(screen.getByTestId('decisao')).toHaveTextContent('sem_vinculo')
  })
})
