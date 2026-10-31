import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { Avisos } from '@/components/Avisos'
import { Usuarios } from './Usuarios'

function renderUsuarios() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <Usuarios />
      <Avisos />
    </QueryClientProvider>,
  )
}

describe('Usuarios', () => {
  beforeEach(() => {
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lista os usuários cadastrados', async () => {
    renderUsuarios()

    expect(await screen.findByText('Stéphanie Lima')).toBeInTheDocument()
    expect(screen.getByText('Paulo Henriques')).toBeInTheDocument()
  })

  it('exibe o campo CRMV apenas para o perfil Veterinário', async () => {
    const user = userEvent.setup()
    renderUsuarios()

    await screen.findByText('Stéphanie Lima')
    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }))

    expect(screen.queryByLabelText(/crmv/i)).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/^perfil/i), 'Veterinário')
    expect(screen.getByLabelText(/crmv/i)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/^perfil/i), 'Administrador')
    expect(screen.queryByLabelText(/crmv/i)).not.toBeInTheDocument()
  })

  it('botão "Gerar outra" atualiza o valor visível da senha temporária', async () => {
    const user = userEvent.setup()
    renderUsuarios()

    await screen.findByText('Stéphanie Lima')
    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }))

    const campoSenha = screen.getByLabelText(/senha temporária/i)
    const senhaOriginal = (campoSenha as HTMLInputElement).value
    await user.click(screen.getByRole('button', { name: /^gerar outra$/i }))

    expect((campoSenha as HTMLInputElement).value).not.toBe(senhaOriginal)
  })

  it('exige perfil ao criar usuário sem selecionar nenhum', async () => {
    const user = userEvent.setup()
    renderUsuarios()

    const totalInicial = (await screen.findAllByRole('row')).length
    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }))

    await user.type(screen.getByLabelText(/nome completo/i), 'Fernanda Rocha')
    await user.type(screen.getByLabelText(/e-mail institucional/i), 'fernanda.rocha@itu.sp.gov.br')
    await user.click(screen.getByRole('button', { name: /^criar usuário$/i }))

    expect(await screen.findByText('Selecione um perfil.')).toBeInTheDocument()
    expect((await screen.findAllByRole('row')).length).toBe(totalInicial)
  })

  it('exige CRMV ao criar usuário com perfil Veterinário', async () => {
    const user = userEvent.setup()
    renderUsuarios()

    const totalInicial = (await screen.findAllByRole('row')).length
    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }))

    await user.type(screen.getByLabelText(/nome completo/i), 'Fernanda Rocha')
    await user.type(screen.getByLabelText(/e-mail institucional/i), 'fernanda.rocha@itu.sp.gov.br')
    await user.selectOptions(screen.getByLabelText(/^perfil/i), 'Veterinário')
    await user.click(screen.getByRole('button', { name: /^criar usuário$/i }))

    expect(await screen.findByText(/crmv é obrigatório/i)).toBeInTheDocument()
    expect((await screen.findAllByRole('row')).length).toBe(totalInicial)
  })

  it('rejeita e-mail fora do domínio institucional sem chamar a API', async () => {
    const user = userEvent.setup()
    renderUsuarios()

    const totalInicial = (await screen.findAllByRole('row')).length
    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }))

    await user.type(screen.getByLabelText(/nome completo/i), 'Fernanda Rocha')
    await user.type(screen.getByLabelText(/e-mail institucional/i), 'fernanda.rocha@gmail.com')
    await user.selectOptions(screen.getByLabelText(/^perfil/i), 'Agente Sanitário')
    await user.click(screen.getByRole('button', { name: /^criar usuário$/i }))

    expect(await screen.findByText(/use o e-mail institucional/i)).toBeInTheDocument()
    expect((await screen.findAllByRole('row')).length).toBe(totalInicial)
  })

  it('rejeita senha inicial fora da política de senha sem chamar a API', async () => {
    const user = userEvent.setup()
    renderUsuarios()

    const totalInicial = (await screen.findAllByRole('row')).length
    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }))

    await user.type(screen.getByLabelText(/nome completo/i), 'Fernanda Rocha')
    await user.type(screen.getByLabelText(/e-mail institucional/i), 'fernanda.rocha@itu.sp.gov.br')
    await user.selectOptions(screen.getByLabelText(/^perfil/i), 'Agente Sanitário')
    const campoSenha = screen.getByLabelText(/senha temporária/i)
    await user.clear(campoSenha)
    await user.type(campoSenha, 'Rocha-2026!')
    await user.click(screen.getByRole('button', { name: /^criar usuário$/i }))

    expect(await screen.findByText(/partes do nome do usuário/i)).toBeInTheDocument()
    expect((await screen.findAllByRole('row')).length).toBe(totalInicial)
  })

  it('cria um novo usuário e fecha o modal', async () => {
    const user = userEvent.setup()
    renderUsuarios()

    await screen.findByText('Stéphanie Lima')
    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }))

    await user.type(screen.getByLabelText(/nome completo/i), 'Fernanda Rocha')
    await user.type(screen.getByLabelText(/e-mail institucional/i), 'fernanda.rocha@itu.sp.gov.br')
    await user.selectOptions(screen.getByLabelText(/^perfil/i), 'Agente Sanitário')
    await user.click(screen.getByRole('button', { name: /^criar usuário$/i }))

    const dialogo = await screen.findByRole('dialog', { name: 'Usuário criado' })
    expect(within(dialogo).getByText('Fernanda Rocha')).toBeInTheDocument()
    expect(within(dialogo).getByRole('button', { name: 'Copiar' })).toBeInTheDocument()
    await user.click(within(dialogo).getByRole('button', { name: 'Concluir' }))

    expect(await screen.findByRole('cell', { name: /Fernanda Rocha/ })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('desativa um usuário ativo após confirmação', async () => {
    const user = userEvent.setup()
    renderUsuarios()

    const linha = (await screen.findByText('Carlos Martins')).closest('tr')
    if (!linha) throw new Error('linha não encontrada')

    await user.click(within(linha).getByRole('button', { name: /desativar/i }))
    const dialogo = await screen.findByRole('dialog', { name: 'Desativar usuário' })
    await user.click(within(dialogo).getByRole('button', { name: 'Desativar' }))

    expect(await within(linha).findByText('Inativo')).toBeInTheDocument()
    expect(await screen.findByText('Carlos Martins foi desativado(a).')).toBeInTheDocument()
  })

  it('falha ao desativar mostra o motivo e não finge que mudou', async () => {
    server.use(http.patch(`${API_BASE_URL}/usuarios/:id/status`, () => HttpResponse.json({}, { status: 500 })))
    const user = userEvent.setup()
    renderUsuarios()

    const linha = (await screen.findByText('Rafael Santos')).closest('tr')
    if (!linha) throw new Error('linha não encontrada')

    await user.click(within(linha).getByRole('button', { name: /desativar/i }))
    const dialogo = await screen.findByRole('dialog', { name: 'Desativar usuário' })
    await user.click(within(dialogo).getByRole('button', { name: 'Desativar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível alterar o acesso de Rafael Santos')
    expect(within(linha).getByText('Ativo')).toBeInTheDocument()
  })

  it('mostra e-mail duplicado no campo, sem sugerir tentar de novo', async () => {
    server.use(http.post(`${API_BASE_URL}/usuarios`, () => HttpResponse.json({ mensagem: 'Email ja cadastrado' }, { status: 409 })))
    const user = userEvent.setup()
    renderUsuarios()

    await screen.findByText('Rafael Santos')
    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }))
    await user.type(screen.getByLabelText(/nome completo/i), 'Fernanda Rocha')
    await user.type(screen.getByLabelText(/e-mail institucional/i), 'fernanda.rocha@itu.sp.gov.br')
    await user.selectOptions(screen.getByLabelText(/^perfil/i), 'Agente Sanitário')
    await user.click(screen.getByRole('button', { name: /^criar usuário$/i }))

    expect(await screen.findByText('Já existe um usuário com este e-mail.')).toBeInTheDocument()
  })

  it('não altera o status quando o usuário cancela a confirmação', async () => {
    const user = userEvent.setup()
    renderUsuarios()

    const linha = (await screen.findByText('Rafael Santos')).closest('tr')
    if (!linha) throw new Error('linha não encontrada')

    await user.click(within(linha).getByRole('button', { name: /desativar/i }))
    const dialogo = await screen.findByRole('dialog', { name: 'Desativar usuário' })
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))

    expect(within(linha).getByText('Ativo')).toBeInTheDocument()
  })
})
