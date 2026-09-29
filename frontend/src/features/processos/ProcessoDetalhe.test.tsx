import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'
import { ProcessoDetalhe } from './ProcessoDetalhe'
import { resetProcessosMock } from './processosMockStore'

// Ids/protocolos semeados em ./processosMockStore.ts (seedProcessosMock).
const PROCESSO_URGENTE_ID = 'p1000000-0000-0000-0000-000000000001' // 001/2026, raiva, urgente
const PROCESSO_NAO_URGENTE_ID = 'p1000000-0000-0000-0000-000000000003' // 003/2026, leptospirose, concluído
const PROCESSO_SIGILOSO_ID = 'p1000000-0000-0000-0000-000000000005' // 005/2026, vinculado à ocorrência sigilosa
const PROCESSO_SEM_VINCULO_ID = 'p1000000-0000-0000-0000-000000000006' // 006/2026, sem ocorrência vinculada
const OCORRENCIA_SIGILOSA_ID = 'h5000000-0000-0000-0000-000000000006'

function renderDetalhe(processoId: string, cargos: string[]) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Usuária',
    sobrenome: 'Teste',
    email: 'usuaria.teste@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/processos/${processoId}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/processos/:id" element={<ProcessoDetalhe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProcessoDetalhe', () => {
  beforeEach(() => {
    resetProcessosMock()
  })

  it('renderiza as seções com os dados do processo semeado', async () => {
    renderDetalhe(PROCESSO_URGENTE_ID, ['Administrador'])

    expect(await screen.findByRole('heading', { name: 'Processo 001/2026', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Dados do Processo')).toBeInTheDocument()
    expect(screen.getByText('Responsável / Munícipe')).toBeInTheDocument()
    expect(screen.getByText('Maria Souza Oliveira')).toBeInTheDocument()
    expect(screen.getByText('Resultado Laboratorial')).toBeInTheDocument()
    expect(screen.getByText('Documentos')).toBeInTheDocument()
    expect(screen.getByText('Amostra 1')).toBeInTheDocument()
    // Doença aparece como rótulo legível, não o valor cru do enum.
    expect(screen.getByText('Raiva')).toBeInTheDocument()
  })

  it('mostra o resultado laboratorial quando presente no contrato', async () => {
    renderDetalhe(PROCESSO_NAO_URGENTE_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 003/2026', level: 1 })
    expect(screen.getByText('Negativo')).toBeInTheDocument()
    expect(screen.getByText('Em acompanhamento')).toBeInTheDocument()
  })

  it('mostra os documentos anexados quando presentes no contrato', async () => {
    renderDetalhe(PROCESSO_NAO_URGENTE_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 003/2026', level: 1 })
    expect(screen.getByText('Termo de envio CCZ-SP.pdf')).toBeInTheDocument()
    expect(screen.getByText('Fotos da coleta.pdf')).toBeInTheDocument()
  })

  it('mostra estado vazio honesto quando não há resultado nem documentos', async () => {
    renderDetalhe(PROCESSO_SEM_VINCULO_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 006/2026', level: 1 })
    expect(screen.getByText(/Aguardando resultado do laboratório/)).toBeInTheDocument()
    expect(screen.getByText('Nenhum documento anexado a este processo.')).toBeInTheDocument()
  })

  it('mostra o nome do denunciante da ocorrência sigilosa vinculada para Administrador', async () => {
    renderDetalhe(PROCESSO_SIGILOSO_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 005/2026', level: 1 })
    expect(screen.getByText('Renata Costa Almeida')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: '095/2026' })
    expect(link).toHaveAttribute('href', `/ocorrencias/${OCORRENCIA_SIGILOSA_ID}`)
  })

  it('mostra "Sigiloso" no lugar do denunciante da ocorrência sigilosa para perfil não-admin', async () => {
    renderDetalhe(PROCESSO_SIGILOSO_ID, ['Agente Sanitário'])

    await screen.findByRole('heading', { name: 'Processo 005/2026', level: 1 })
    expect(screen.getByText('Sigiloso')).toBeInTheDocument()
    expect(screen.queryByText('Renata Costa Almeida')).not.toBeInTheDocument()
  })

  it('mostra estado adequado para processo sem ocorrência vinculada', async () => {
    renderDetalhe(PROCESSO_SEM_VINCULO_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 006/2026', level: 1 })
    expect(screen.getByText('Este processo não está vinculado a nenhuma ocorrência.')).toBeInTheDocument()
  })

  it('mostra o banner de urgência quando o processo é urgente', async () => {
    renderDetalhe(PROCESSO_URGENTE_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 001/2026', level: 1 })
    expect(screen.getByText(/Atenção — contato humano-animal confirmado/)).toBeInTheDocument()
  })

  it('não mostra o banner de urgência quando o processo não é urgente', async () => {
    renderDetalhe(PROCESSO_NAO_URGENTE_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 003/2026', level: 1 })
    expect(screen.queryByText(/Atenção — contato humano-animal confirmado/)).not.toBeInTheDocument()
  })

  it('mostra "não encontrado" para um id inexistente, sem quebrar a tela', async () => {
    renderDetalhe('id-que-nao-existe', ['Administrador'])

    expect(await screen.findByText('Processo sanitário não encontrado.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Voltar para Processos/i })).toBeInTheDocument()
  })

  it('não renderiza nenhum controle de edição (registros são imutáveis — RN5)', async () => {
    renderDetalhe(PROCESSO_URGENTE_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 001/2026', level: 1 })
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /registrar resultado/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /anexar documento/i })).not.toBeInTheDocument()
  })
})
