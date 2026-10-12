import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { ANEXO_CRIADO_FIXTURE, ocorrenciaCriadaFixture } from '@/mocks/ocorrenciasFixtures'
import { CadastrarOcorrencia } from './CadastrarOcorrencia'

function renderForm() {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos: ['Administrador'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/ocorrencias/novo']}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias/novo" element={<CadastrarOcorrencia />} />
            <Route path="/ocorrencias/:id" element={<div>Detalhe da ocorrência recém-criada</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const MENSAGEM_NOME_OBRIGATORIO = 'Informe o nome do denunciante ou marque a ocorrência como sigilosa ou anônima.'

async function preencherCamposObrigatorios(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Endereço da ocorrência/i), 'Rua Teste, 10')
  await user.type(screen.getByLabelText(/^Bairro/i), 'Bairro Teste')
  await user.type(screen.getByLabelText(/Descrição da ocorrência/i), 'Descrição de teste para a ocorrência.')
}

describe('OcorrenciaForm', () => {
  it('bloqueia o envio sem endereço, bairro ou descrição', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Registrar Ocorrência' }))

    expect(await screen.findByText('Informe o endereço da ocorrência.')).toBeInTheDocument()
    expect(screen.getByText('Informe o bairro.')).toBeInTheDocument()
    expect(screen.getByText('Informe a descrição da ocorrência.')).toBeInTheDocument()
  })

  it('exige o nome do denunciante quando a ocorrência não é sigilosa, e libera quando é', async () => {
    const user = userEvent.setup()
    renderForm()

    await preencherCamposObrigatorios(user)
    await user.click(screen.getByRole('button', { name: 'Registrar Ocorrência' }))
    expect(await screen.findByText(MENSAGEM_NOME_OBRIGATORIO)).toBeInTheDocument()

    await user.click(screen.getByLabelText('Ocorrência sigilosa'))
    await user.click(screen.getByRole('button', { name: 'Registrar Ocorrência' }))

    await waitFor(() => expect(screen.queryByText(MENSAGEM_NOME_OBRIGATORIO)).not.toBeInTheDocument())
  })

  it('não exige o nome do denunciante quando a denúncia é anônima (D19)', async () => {
    const user = userEvent.setup()
    renderForm()

    await preencherCamposObrigatorios(user)
    await user.click(screen.getByLabelText('Denunciante anônimo'))
    await user.click(screen.getByRole('button', { name: 'Registrar Ocorrência' }))

    expect(await screen.findByText('Detalhe da ocorrência recém-criada')).toBeInTheDocument()
  })

  it('anônima esconde o bloco do denunciante, limpa o que foi digitado e desabilita o sigilo (D32)', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/Nome completo/i), 'Fulano de Tal')
    await user.click(screen.getByLabelText('Denunciante anônimo'))

    expect(screen.queryByLabelText(/Nome completo/i)).not.toBeInTheDocument()
    expect(screen.getByText('Denúncia anônima: nenhum dado do denunciante é registrado.')).toBeInTheDocument()
    expect(screen.getByLabelText('Ocorrência sigilosa')).toBeDisabled()

    await user.click(screen.getByLabelText('Denunciante anônimo'))
    expect(screen.getByLabelText(/Nome completo/i)).toHaveValue('')
    expect(screen.getByLabelText('Ocorrência sigilosa')).toBeEnabled()
  })

  it('sigilosa desabilita a opção de denunciante anônimo (D32)', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByLabelText('Ocorrência sigilosa'))

    expect(screen.getByLabelText('Denunciante anônimo')).toBeDisabled()
  })

  it('mostra/esconde a seção do denunciado ao alternar o toggle "existe denunciado"', async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Existe denunciado identificado'))
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Existe denunciado identificado'))
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument()
  })

  it('rejeita um anexo de tipo não permitido', async () => {
    // `accept="image/jpeg,image/png,application/pdf"` no input já bloqueia a
    // seleção pelo seletor nativo do navegador — `applyAccept: false` simula
    // o caminho que ainda chega no `onChange` (ex.: arrastar-e-soltar, que
    // não respeita `accept` em todo navegador), para exercitar de fato a
    // validação em anexoOcorrencia.ts, não só o filtro do input.
    const user = userEvent.setup({ applyAccept: false })
    renderForm()

    const arquivo = new File(['conteudo'], 'nota.txt', { type: 'text/plain' })
    await user.upload(screen.getByLabelText('Adicionar anexo'), arquivo)

    expect(await screen.findByText('Envie um arquivo JPG, PNG ou PDF.')).toBeInTheDocument()
  })

  it('rejeita um anexo maior que 5MB', async () => {
    const user = userEvent.setup()
    renderForm()

    const arquivo = new File([new Uint8Array(6 * 1024 * 1024)], 'foto.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('Adicionar anexo'), arquivo)

    expect(await screen.findByText('Cada anexo deve ter no máximo 5MB.')).toBeInTheDocument()
  })

  it('rejeita mais de 5 anexos', async () => {
    const user = userEvent.setup()
    renderForm()

    const arquivos = Array.from(
      { length: 6 },
      (_, i) => new File(['x'], `anexo-${i}.png`, { type: 'image/png' }),
    )
    await user.upload(screen.getByLabelText('Adicionar anexo'), arquivos)

    expect(await screen.findByText('Máximo de 5 anexos.')).toBeInTheDocument()
  })

  it('registra a ocorrência com sucesso e navega para o detalhe da recém-criada', async () => {
    const user = userEvent.setup()
    renderForm()

    await preencherCamposObrigatorios(user)
    await user.type(screen.getByLabelText(/Nome completo/i), 'Fulano de Tal')
    await user.click(screen.getByRole('button', { name: 'Registrar Ocorrência' }))

    expect(await screen.findByText('Detalhe da ocorrência recém-criada')).toBeInTheDocument()
  })

  it('envia as flags sempre e nunca manda anexos no JSON nem o bloco do denunciante da anônima', async () => {
    const user = userEvent.setup()
    const corpos: Record<string, unknown>[] = []
    server.use(
      http.post(`${API_BASE_URL}/ocorrencias`, async ({ request }) => {
        corpos.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json(ocorrenciaCriadaFixture(), { status: 201 })
      }),
    )
    renderForm()

    await preencherCamposObrigatorios(user)
    await user.click(screen.getByLabelText('Urgente (contato humano-animal)'))
    await user.click(screen.getByLabelText('Denunciante anônimo'))
    await user.click(screen.getByRole('button', { name: 'Registrar Ocorrência' }))

    await screen.findByText('Detalhe da ocorrência recém-criada')
    expect(corpos).toHaveLength(1)
    expect(corpos[0]).toMatchObject({ urgente: true, sigilosa: false, anonima: true })
    expect(corpos[0]).not.toHaveProperty('anexos')
    expect(corpos[0]).not.toHaveProperty('denunciante')
  })

  it('mostra a mensagem do backend quando o cadastro é recusado (422)', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(`${API_BASE_URL}/ocorrencias`, () =>
        HttpResponse.json({ mensagem: 'Data de abertura nao pode ser futura' }, { status: 422 }),
      ),
    )
    renderForm()

    await preencherCamposObrigatorios(user)
    await user.type(screen.getByLabelText(/Nome completo/i), 'Fulano de Tal')
    await user.click(screen.getByRole('button', { name: 'Registrar Ocorrência' }))

    expect(await screen.findByText('Data de abertura nao pode ser futura')).toBeInTheDocument()
  })

  describe('anexos em duas fases (D15)', () => {
    // Conta as chamadas; a 2ª chamada de upload (o 2º arquivo — o envio é
    // sequencial) falha com `statusFalha`. O nome do arquivo não dá para ler
    // no handler: no jsdom o File chega ao MSW como um Blob anônimo
    // (filename="blob"), então "só o pendente" é conferido pela lista do aviso
    // e pela contagem de chamadas do reenvio.
    function contarChamadas(statusFalha: number) {
      const contagem = { cadastros: 0, uploads: 0, camposArquivo: 0 }
      server.use(
        http.post(`${API_BASE_URL}/ocorrencias`, () => {
          contagem.cadastros += 1
          return HttpResponse.json(ocorrenciaCriadaFixture(), { status: 201 })
        }),
        http.post(`${API_BASE_URL}/ocorrencias/:id/anexos`, async ({ request }) => {
          contagem.uploads += 1
          if ((await request.text()).includes('name="arquivo"')) contagem.camposArquivo += 1
          if (contagem.uploads === 2) {
            return HttpResponse.json({ mensagem: 'Arquivo excede o tamanho maximo de 5 MB' }, { status: statusFalha })
          }
          return HttpResponse.json(ANEXO_CRIADO_FIXTURE, { status: 201 })
        }),
      )
      return contagem
    }

    async function registrarComDoisAnexos(user: ReturnType<typeof userEvent.setup>) {
      await preencherCamposObrigatorios(user)
      await user.type(screen.getByLabelText(/Nome completo/i), 'Fulano de Tal')
      await user.upload(screen.getByLabelText('Adicionar anexo'), [
        new File(['a'], 'a.png', { type: 'image/png' }),
        new File(['b'], 'b.png', { type: 'image/png' }),
      ])
      await user.click(screen.getByRole('button', { name: 'Registrar Ocorrência' }))
    }

    it('falha no 2º anexo: avisa, e o reenvio manda só o pendente, sem novo POST /ocorrencias', async () => {
      const user = userEvent.setup()
      const contagem = contarChamadas(500)
      renderForm()

      await registrarComDoisAnexos(user)

      const aviso = await screen.findByText(/Há anexos pendentes da ocorrência OC 100\/2026/)
      expect(within(aviso).getByText('b.png')).toBeInTheDocument()
      expect(within(aviso).queryByText('a.png')).not.toBeInTheDocument()
      expect(screen.getByText(/b\.png: Não foi possível enviar o anexo/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Registrar Ocorrência' })).toBeDisabled()
      expect(contagem).toEqual({ cadastros: 1, uploads: 2, camposArquivo: 2 })

      await user.click(screen.getByRole('button', { name: 'Reenviar' }))

      expect(await screen.findByText('Detalhe da ocorrência recém-criada')).toBeInTheDocument()
      expect(contagem).toEqual({ cadastros: 1, uploads: 3, camposArquivo: 3 })
    })

    it('mostra "Arquivo excede o tamanho máximo de 5 MB" quando o backend responde 413', async () => {
      const user = userEvent.setup()
      contarChamadas(413)
      renderForm()

      await registrarComDoisAnexos(user)

      expect(await screen.findByText('b.png: Arquivo excede o tamanho máximo de 5 MB')).toBeInTheDocument()
    })

    it('limpa o formulário depois do cadastro, para não registrar a mesma ocorrência de novo', async () => {
      const user = userEvent.setup()
      contarChamadas(500)
      renderForm()

      await registrarComDoisAnexos(user)

      await screen.findByText(/Há anexos pendentes/)
      expect(screen.getByLabelText(/Endereço da ocorrência/i)).toHaveValue('')
      expect(screen.getByLabelText(/Nome completo/i)).toHaveValue('')
    })

    it('"Descartar" some com o aviso e libera um novo cadastro', async () => {
      const user = userEvent.setup()
      const contagem = contarChamadas(500)
      renderForm()

      await registrarComDoisAnexos(user)
      await user.click(await screen.findByRole('button', { name: 'Descartar' }))

      expect(screen.queryByText(/Há anexos pendentes/)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Registrar Ocorrência' })).toBeEnabled()
      expect(contagem.uploads).toBe(2)
    })
  })
})
