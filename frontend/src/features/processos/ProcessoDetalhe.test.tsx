import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'
import { ProcessoDetalhe } from './ProcessoDetalhe'
import { resetProcessosMock } from './processosMockStore'

// Ids/protocolos semeados em ./processosMockStore.ts (seedProcessosMock).
const PROCESSO_URGENTE_ID = 'p1000000-0000-0000-0000-000000000001' // 001/2026, raiva, aberto, urgente
const PROCESSO_NAO_URGENTE_ID = 'p1000000-0000-0000-0000-000000000003' // 003/2026, leptospirose, concluído
const PROCESSO_SIGILOSO_ID = 'p1000000-0000-0000-0000-000000000005' // 005/2026, vinculado à ocorrência sigilosa
const PROCESSO_SEM_VINCULO_ID = 'p1000000-0000-0000-0000-000000000006' // 006/2026, aberto, sem ocorrência vinculada
const PROCESSO_AGUARDANDO_RESULTADO_ID = 'p1000000-0000-0000-0000-000000000008' // 008/2026, aguardando_resultado, sem vínculo
const PROCESSO_COM_RESULTADO_INCONCLUSIVO_ID = 'p1000000-0000-0000-0000-000000000007' // 007/2026, com_resultado, inconclusivo
const OCORRENCIA_SIGILOSA_ID = 'h5000000-0000-0000-0000-000000000006'
// 089/2026, aberta, sem processo vinculado (../ocorrencias/ocorrenciasMockStore.ts)
// — referenciada abaixo pelo protocolo, não pelo id.

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
  // resetOcorrenciasMock já roda globalmente no afterEach de
  // ../../test/setup.ts — só o mock de processos (que não faz parte dessa
  // lista) precisa de reset explícito aqui.
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

  // RN5 original cobria a ausência de QUALQUER controle de edição — essa
  // entrega expande deliberadamente o escopo (pedido do usuário) para
  // adicionar as transições de status, o registro de resultado, o anexo de
  // documento e o vínculo pós-criação. RN5 continua valendo para edição
  // LIVRE de dados já gravados (amostras, responsável, dados gerais do
  // processo) — isso nunca existiu e continua não existindo. As novas ações
  // têm teste positivo próprio abaixo.
  it('não permite edição livre de amostras/responsável/dados gerais do processo (RN5)', async () => {
    renderDetalhe(PROCESSO_URGENTE_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 001/2026', level: 1 })
    expect(screen.queryByRole('button', { name: /^editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^editar/i })).not.toBeInTheDocument()
  })

  it('mostra "Enviar amostras ao laboratório" só quando o processo está aberto', async () => {
    renderDetalhe(PROCESSO_URGENTE_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 001/2026', level: 1 })
    expect(screen.getByRole('button', { name: 'Enviar amostras ao laboratório' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar resultado' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Concluir processo' })).not.toBeInTheDocument()
  })

  it('mostra "Registrar resultado" só quando o processo está aguardando resultado', async () => {
    renderDetalhe(PROCESSO_AGUARDANDO_RESULTADO_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 008/2026', level: 1 })
    expect(screen.getByRole('button', { name: 'Registrar resultado' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar amostras ao laboratório' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Concluir processo' })).not.toBeInTheDocument()
  })

  it('mostra "Concluir processo" só quando o processo já tem resultado', async () => {
    renderDetalhe(PROCESSO_COM_RESULTADO_INCONCLUSIVO_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 007/2026', level: 1 })
    expect(screen.getByRole('button', { name: 'Concluir processo' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar amostras ao laboratório' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar resultado' })).not.toBeInTheDocument()
  })

  it('mostra o aviso de notificação (regra 19) quando o resultado é inconclusivo', async () => {
    renderDetalhe(PROCESSO_COM_RESULTADO_INCONCLUSIVO_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 007/2026', level: 1 })
    expect(screen.getByText(/Vigilância Epidemiológica de Itu/)).toBeInTheDocument()
  })

  it('não mostra o aviso de notificação quando o resultado é negativo', async () => {
    renderDetalhe(PROCESSO_NAO_URGENTE_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 003/2026', level: 1 })
    expect(screen.queryByText(/Vigilância Epidemiológica de Itu/)).not.toBeInTheDocument()
  })

  it('percorre o ciclo completo: enviar amostras → registrar resultado → concluir', async () => {
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_SEM_VINCULO_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 006/2026', level: 1 })
    await user.click(screen.getByRole('button', { name: 'Enviar amostras ao laboratório' }))

    await screen.findByRole('button', { name: 'Registrar resultado' })
    await user.selectOptions(screen.getByLabelText('Resultado laboratorial'), 'negativo')
    await user.click(screen.getByRole('button', { name: 'Registrar resultado' }))

    await screen.findByRole('button', { name: 'Concluir processo' })
    expect(screen.getByText('Negativo')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Concluir processo' }))

    await screen.findByText('Concluído')
    expect(screen.queryByRole('button', { name: 'Concluir processo' })).not.toBeInTheDocument()
  })

  it('anexa um documento classificado por tipo', async () => {
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_URGENTE_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 001/2026', level: 1 })
    await user.selectOptions(screen.getByLabelText('Tipo do documento'), 'termo_envio')
    const arquivo = new File(['conteudo'], 'termo.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByLabelText(/^Anexar documento/i), arquivo)

    const nomeArquivo = await screen.findByText('termo.pdf')
    expect(nomeArquivo).toBeInTheDocument()
    expect(nomeArquivo.parentElement).toHaveTextContent('Termo de envio')
  })

  it('vincula uma ocorrência já cadastrada a um processo sem vínculo', async () => {
    const user = userEvent.setup()
    renderDetalhe(PROCESSO_SEM_VINCULO_ID, ['Administrador'])

    await screen.findByRole('heading', { name: 'Processo 006/2026', level: 1 })
    expect(screen.getByText('Este processo não está vinculado a nenhuma ocorrência.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Vincular uma ocorrência já cadastrada' }))
    await user.click(await screen.findByText('089/2026'))

    expect(await screen.findByRole('link', { name: '089/2026' })).toBeInTheDocument()
  })
})
