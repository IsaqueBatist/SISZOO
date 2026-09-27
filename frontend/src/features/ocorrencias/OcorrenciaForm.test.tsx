import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext'
import type { Usuario } from '../auth/auth.types'
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
    expect(await screen.findByText('Informe o nome do denunciante ou marque a ocorrência como sigilosa.')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Ocorrência sigilosa'))
    await user.click(screen.getByRole('button', { name: 'Registrar Ocorrência' }))

    await waitFor(() =>
      expect(
        screen.queryByText('Informe o nome do denunciante ou marque a ocorrência como sigilosa.'),
      ).not.toBeInTheDocument(),
    )
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
})
