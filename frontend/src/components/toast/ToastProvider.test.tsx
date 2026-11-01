import { StrictMode } from 'react'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from './ToastProvider'
import { useToast } from './useToast'

// setTimeout/clearTimeout e também Date: o componente agenda com setTimeout
// mas mede o tempo decorrido com Date.now() (para a pausa retomar de onde
// parou), então os dois relógios precisam andar juntos — com Date real, o
// tempo gasto entre a montagem e a remontagem do StrictMode era descontado do
// prazo e o toast fechava alguns milissegundos antes.
// Não falsificar mais que isso: a suíte usa fake-indexeddb e MSW, que agendam
// o próprio trabalho com setImmediate/microtasks, e falsificar tudo trava esse
// trabalho (lição já registrada em rascunhoDbLimpeza.test.ts).
function usarTimersFalsos() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
}

afterEach(() => {
  vi.useRealTimers()
})

function montar() {
  const { result, unmount } = renderHook(() => useToast(), {
    wrapper: ({ children }) => <ToastProvider>{children}</ToastProvider>,
  })
  return { toast: result.current, unmount }
}

async function avancar(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('ToastProvider', () => {
  it('lança quando useToast é usado fora do provider', () => {
    // O erro é intencional: silencia o ruído do React no console.
    const erroDoConsole = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useToast())).toThrow(/dentro de um ToastProvider/)
    erroDoConsole.mockRestore()
  })

  it('mantém as duas regiões live montadas mesmo sem nenhum toast', () => {
    render(
      <ToastProvider>
        <span />
      </ToastProvider>,
    )

    const avisos = screen.getByLabelText('Avisos')
    const erros = screen.getByLabelText('Erros')

    expect(avisos).toHaveAttribute('aria-live', 'polite')
    expect(erros).toHaveAttribute('aria-live', 'assertive')
    expect(avisos).toBeEmptyDOMElement()
    expect(erros).toBeEmptyDOMElement()
  })

  it('mostra título e descrição do toast de sucesso', () => {
    usarTimersFalsos()
    const { toast } = montar()

    act(() => toast.sucesso('Animal cadastrado!', 'Rex foi adicionado à Baia 3'))

    expect(screen.getByText('Animal cadastrado!')).toBeInTheDocument()
    expect(screen.getByText('Rex foi adicionado à Baia 3')).toBeInTheDocument()
    // Sucesso vai para a região polite, nunca para a assertiva.
    expect(screen.getByLabelText('Avisos')).toHaveTextContent('Animal cadastrado!')
    expect(screen.getByLabelText('Erros')).toBeEmptyDOMElement()
  })

  it('envia erro para a região assertiva e info para a polite', () => {
    usarTimersFalsos()
    const { toast } = montar()

    act(() => toast.erro('Falhou'))
    act(() => toast.info('Informação'))

    expect(screen.getByLabelText('Erros')).toHaveTextContent('Falhou')
    expect(screen.getByLabelText('Avisos')).toHaveTextContent('Informação')
  })

  it('fecha o toast de sucesso aos 5s, e não antes', async () => {
    usarTimersFalsos()
    const { toast } = montar()
    act(() => toast.sucesso('Salvo'))

    await avancar(4999)
    expect(screen.getByText('Salvo')).toBeInTheDocument()

    await avancar(1)
    expect(screen.queryByText('Salvo')).not.toBeInTheDocument()
  })

  it('mantém o erro por mais tempo que o sucesso', async () => {
    usarTimersFalsos()
    const { toast } = montar()
    act(() => toast.erro('Não foi possível excluir'))

    await avancar(5000)
    expect(screen.getByText('Não foi possível excluir')).toBeInTheDocument()

    await avancar(3000)
    expect(screen.queryByText('Não foi possível excluir')).not.toBeInTheDocument()
  })

  it('pausa a contagem enquanto o ponteiro está sobre o toast', async () => {
    usarTimersFalsos()
    const { toast } = montar()
    act(() => toast.sucesso('Salvo'))

    fireEvent.mouseEnter(screen.getByText('Salvo').closest('.toast')!)
    await avancar(20000)
    expect(screen.getByText('Salvo')).toBeInTheDocument()

    fireEvent.mouseLeave(screen.getByText('Salvo').closest('.toast')!)
    await avancar(5000)
    expect(screen.queryByText('Salvo')).not.toBeInTheDocument()
  })

  it('pausa a contagem também com o foco do teclado', async () => {
    usarTimersFalsos()
    const { toast } = montar()
    act(() => toast.sucesso('Salvo'))

    const botaoFechar = screen.getByRole('button', { name: 'Fechar aviso: Salvo' })
    fireEvent.focus(botaoFechar)
    await avancar(20000)
    expect(screen.getByText('Salvo')).toBeInTheDocument()

    fireEvent.blur(botaoFechar)
    await avancar(5000)
    expect(screen.queryByText('Salvo')).not.toBeInTheDocument()
  })

  it('o botão de fechar remove só o toast correspondente', () => {
    usarTimersFalsos()
    const { toast } = montar()
    act(() => toast.sucesso('Primeiro'))
    act(() => toast.sucesso('Segundo'))

    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso: Primeiro' }))

    expect(screen.queryByText('Primeiro')).not.toBeInTheDocument()
    expect(screen.getByText('Segundo')).toBeInTheDocument()
  })

  it('limita a fila a 3, descartando o mais antigo', () => {
    usarTimersFalsos()
    const { toast } = montar()
    act(() => toast.sucesso('Um'))
    act(() => toast.sucesso('Dois'))
    act(() => toast.sucesso('Três'))
    act(() => toast.sucesso('Quatro'))

    expect(screen.queryByText('Um')).not.toBeInTheDocument()
    expect(screen.getByText('Dois')).toBeInTheDocument()
    expect(screen.getByText('Quatro')).toBeInTheDocument()
  })

  it('no StrictMode renderiza um único toast e respeita o prazo', async () => {
    usarTimersFalsos()
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }) => (
        <StrictMode>
          <ToastProvider>{children}</ToastProvider>
        </StrictMode>
      ),
    })

    act(() => result.current.sucesso('Salvo'))
    expect(screen.getAllByText('Salvo')).toHaveLength(1)

    await avancar(4999)
    expect(screen.getByText('Salvo')).toBeInTheDocument()

    await avancar(1)
    expect(screen.queryByText('Salvo')).not.toBeInTheDocument()
  })

  it('não dispara nada depois de desmontado', async () => {
    usarTimersFalsos()
    const erroDoConsole = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { toast, unmount } = montar()

    act(() => toast.sucesso('Salvo'))
    unmount()
    await avancar(10000)

    expect(erroDoConsole).not.toHaveBeenCalled()
    erroDoConsole.mockRestore()
  })
})
