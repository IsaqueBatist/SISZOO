import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Usuarios } from './Usuarios'

function renderUsuarios() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <Usuarios />
    </QueryClientProvider>,
  )
}

describe('Usuarios', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
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

  it('botão "Gerar" atualiza o valor visível da senha inicial', async () => {
    const user = userEvent.setup()
    renderUsuarios()

    await screen.findByText('Stéphanie Lima')
    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }))

    const campoSenha = screen.getByLabelText(/senha inicial/i)
    const senhaOriginal = (campoSenha as HTMLInputElement).value
    await user.click(screen.getByRole('button', { name: /^gerar$/i }))

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

  it('cria um novo usuário e fecha o modal', async () => {
    const user = userEvent.setup()
    renderUsuarios()

    await screen.findByText('Stéphanie Lima')
    await user.click(screen.getByRole('button', { name: /adicionar usuário/i }))

    await user.type(screen.getByLabelText(/nome completo/i), 'Fernanda Rocha')
    await user.type(screen.getByLabelText(/e-mail institucional/i), 'fernanda.rocha@itu.sp.gov.br')
    await user.selectOptions(screen.getByLabelText(/^perfil/i), 'Agente Sanitário')
    await user.click(screen.getByRole('button', { name: /^criar usuário$/i }))

    expect(await screen.findByText('Fernanda Rocha')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /adicionar usuário/i })).not.toBeInTheDocument()
  })

  it('desativa um usuário ativo após confirmação', async () => {
    const user = userEvent.setup()
    renderUsuarios()

    const linha = (await screen.findByText('Carlos Martins')).closest('tr')
    if (!linha) throw new Error('linha não encontrada')

    await user.click(within(linha).getByRole('button', { name: /desativar/i }))

    expect(window.confirm).toHaveBeenCalled()
    expect(await within(linha).findByText('Inativo')).toBeInTheDocument()
  })

  it('não altera o status quando o usuário cancela a confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderUsuarios()

    const linha = (await screen.findByText('Rafael Santos')).closest('tr')
    if (!linha) throw new Error('linha não encontrada')

    await user.click(within(linha).getByRole('button', { name: /desativar/i }))

    expect(within(linha).getByText('Ativo')).toBeInTheDocument()
  })
})
