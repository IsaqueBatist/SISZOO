import { Toasts } from '@/components/toast/Toasts'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { Configuracoes } from './Configuracoes'

function renderConfiguracoes() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
        <Configuracoes />
      <Toasts />
    </QueryClientProvider>,
  )
}

describe('Configuracoes', () => {
  afterEach(() => {
    document.documentElement.style.cssText = ''
  })

  it('carrega as preferências e mantém alertas críticos sempre ligado e travado', async () => {
    renderConfiguracoes()

    await screen.findByText('Densidade da interface')
    const [alertasCriticos] = screen.getAllByRole('checkbox')
    expect(alertasCriticos).toBeChecked()
    expect(alertasCriticos).toBeDisabled()
  })

  it('salva as preferências e aplica o tema imediatamente', async () => {
    const user = userEvent.setup()
    renderConfiguracoes()

    await screen.findByText('Densidade da interface')
    await user.selectOptions(screen.getByRole('combobox'), 'Compacto')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    expect(await screen.findByText(/preferências salvas/i)).toBeInTheDocument()
    expect(document.documentElement.style.getPropertyValue('--space-4')).toBe('12px')
  })

  it('escolher o tema aplica na hora, não grava e volta ao salvo ao sair sem salvar', async () => {
    let gravacoes = 0
    server.use(
      http.patch(`${API_BASE_URL}/usuarios/me/preferencias`, () => {
        gravacoes += 1
        return HttpResponse.json({})
      }),
    )
    const user = userEvent.setup()
    const { unmount } = renderConfiguracoes()

    await screen.findByText('Densidade da interface')
    await user.click(screen.getByRole('button', { name: 'Escuro' }))

    expect(document.documentElement.dataset.tema).toBe('escuro')
    expect(screen.getByRole('status')).toHaveTextContent(/Salvar alterações/)
    expect(gravacoes).toBe(0)

    unmount()
    expect(document.documentElement.dataset.tema).toBe('claro')
  })

  it('mantém a seleção do usuário quando salvar falha', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/usuarios/me/preferencias`, () => {
        return HttpResponse.json({ mensagem: 'Erro' }, { status: 500 })
      }),
    )

    const user = userEvent.setup()
    renderConfiguracoes()

    await screen.findByText('Densidade da interface')
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'Compacto')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    expect(await screen.findByText(/não foi possível salvar/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('COMPACTO')
    expect(screen.getByRole('combobox')).toBe(select)
  })
})
