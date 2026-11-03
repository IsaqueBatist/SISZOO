import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { Toasts } from '@/components/toast/Toasts'
import { AuthProvider, definirSessaoEmMemoria } from '@/features/auth/hooks/AuthContext'
import { Usuarios } from './Usuarios'

const ID_DE_QUEM_ESTA_LOGADA = 'a1b2c3d4-0000-0000-0000-000000000001'

function renderUsuarios() {
  const queryClient = new QueryClient()
  definirSessaoEmMemoria({
    token: 'token-existente',
    usuario: {
      id: ID_DE_QUEM_ESTA_LOGADA,
      nome: 'Stéphanie',
      sobrenome: 'Lima',
      email: 'stephanie.lima@itu.sp.gov.br',
      cargos: ['Administrador'],
      senhaAlteradaEm: '2026-01-10T12:00:00Z',
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <Usuarios />
        </AuthProvider>
      </MemoryRouter>
      <Toasts />
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

  describe('edição do cadastro', () => {
    it('edita o cadastro e mostra a confirmação', async () => {
      const user = userEvent.setup()
      let corpo: unknown = null
      server.use(
        http.put(`${API_BASE_URL}/usuarios/:id`, async ({ request }) => {
          corpo = await request.json()
          return HttpResponse.json({})
        }),
      )
      renderUsuarios()

      await user.click(await screen.findByRole('button', { name: 'Editar Paulo Henriques' }))
      const dialogo = screen.getByRole('dialog')
      await user.clear(within(dialogo).getByLabelText(/^sobrenome/i))
      await user.type(within(dialogo).getByLabelText(/^sobrenome/i), 'Henriques Souza')
      await user.type(within(dialogo).getByLabelText(/telefone/i), '11 4000-1234')
      await user.click(within(dialogo).getByRole('button', { name: 'Salvar alterações' }))

      expect(await screen.findByText('Cadastro de Paulo Henriques Souza atualizado.')).toBeInTheDocument()
      expect(corpo).toMatchObject({ nome: 'Paulo', sobrenome: 'Henriques Souza', telefone: '11 4000-1234' })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('valida no formulário antes de chamar a API', async () => {
      const user = userEvent.setup()
      renderUsuarios()

      await user.click(await screen.findByRole('button', { name: 'Editar Paulo Henriques' }))
      const dialogo = screen.getByRole('dialog')
      await user.clear(within(dialogo).getByLabelText(/^nome/i))
      await user.click(within(dialogo).getByRole('button', { name: 'Salvar alterações' }))

      expect(await within(dialogo).findByText('Informe o nome.')).toBeInTheDocument()
    })

    it('avisa que mudar o perfil encerra as sessões da pessoa', async () => {
      const user = userEvent.setup()
      renderUsuarios()

      await user.click(await screen.findByRole('button', { name: 'Editar Paulo Henriques' }))
      const dialogo = screen.getByRole('dialog')
      expect(within(dialogo).queryByText(/encerra as sessões/i)).not.toBeInTheDocument()

      await user.selectOptions(within(dialogo).getByLabelText(/^perfil/i), 'Agente Sanitário')

      expect(within(dialogo).getByText(/encerra as sessões/i)).toBeInTheDocument()
    })

    it('recusa da API aparece no formulário, com a mensagem dela', async () => {
      const user = userEvent.setup()
      server.use(
        http.put(`${API_BASE_URL}/usuarios/:id`, () =>
          HttpResponse.json({ mensagem: 'O sistema precisa de pelo menos um Administrador ativo.' }, { status: 422 }),
        ),
      )
      renderUsuarios()

      await user.click(await screen.findByRole('button', { name: 'Editar Paulo Henriques' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Salvar alterações' }))

      expect(await screen.findByText('O sistema precisa de pelo menos um Administrador ativo.')).toBeInTheDocument()
    })

    it('na própria conta o perfil fica bloqueado, sem redefinir senha nem desativar', async () => {
      const user = userEvent.setup()
      renderUsuarios()

      await screen.findByText('Stéphanie Lima')
      expect(screen.queryByRole('button', { name: 'Mais ações para Stéphanie Lima' })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Editar Stéphanie Lima' }))

      expect(within(screen.getByRole('dialog')).getByLabelText(/^perfil/i)).toBeDisabled()
    })
  })

  describe('redefinição de senha', () => {
    it('confirma, mostra a senha temporária uma vez e nunca a recebe da API', async () => {
      const user = userEvent.setup()
      let enviada = ''
      server.use(
        http.post(`${API_BASE_URL}/usuarios/:id/senha`, async ({ request }) => {
          enviada = ((await request.json()) as { senhaTemporaria: string }).senhaTemporaria
          return new HttpResponse(null, { status: 204 })
        }),
      )
      renderUsuarios()

      await user.click(await screen.findByRole('button', { name: 'Mais ações para Paulo Henriques' }))
      await user.click(screen.getByRole('menuitem', { name: 'Redefinir senha de Paulo Henriques' }))
      const dialogo = screen.getByRole('dialog')
      expect(within(dialogo).getByText(/perderá a senha atual/i)).toBeInTheDocument()
      await user.click(within(dialogo).getByRole('button', { name: 'Redefinir senha' }))

      expect(await screen.findByRole('heading', { name: 'Senha redefinida' })).toBeInTheDocument()
      expect(enviada.length).toBeGreaterThanOrEqual(8)
      expect(screen.getByText(enviada)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Concluir' }))
      expect(screen.queryByText(enviada)).not.toBeInTheDocument()
    })

    it('falha na redefinição explica que nada mudou', async () => {
      const user = userEvent.setup()
      server.use(http.post(`${API_BASE_URL}/usuarios/:id/senha`, () => HttpResponse.json({}, { status: 500 })))
      renderUsuarios()

      await user.click(await screen.findByRole('button', { name: 'Mais ações para Paulo Henriques' }))
      await user.click(screen.getByRole('menuitem', { name: 'Redefinir senha de Paulo Henriques' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Redefinir senha' }))

      expect(await screen.findByText(/não foi possível redefinir a senha de paulo henriques/i)).toBeInTheDocument()
    })
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

    await user.click(within(linha).getByRole('button', { name: /mais ações/i }))
    await user.click(within(linha).getByRole('menuitem', { name: /desativar/i }))
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

    await user.click(within(linha).getByRole('button', { name: /mais ações/i }))
    await user.click(within(linha).getByRole('menuitem', { name: /desativar/i }))
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

    await user.click(within(linha).getByRole('button', { name: /mais ações/i }))
    await user.click(within(linha).getByRole('menuitem', { name: /desativar/i }))
    const dialogo = await screen.findByRole('dialog', { name: 'Desativar usuário' })
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))

    expect(within(linha).getByText('Ativo')).toBeInTheDocument()
  })
})
