import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { avisar, limparAvisos } from '@/lib/avisos'
import { Avisos } from './Avisos'

afterEach(() => {
  vi.useRealTimers()
  act(() => limparAvisos())
})

describe('Avisos', () => {
  it('sucesso some sozinho', () => {
    vi.useFakeTimers()
    render(<Avisos />)

    act(() => avisar('Vacina registrada.'))
    expect(screen.getByText('Vacina registrada.')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(7000)
    })
    expect(screen.queryByText('Vacina registrada.')).not.toBeInTheDocument()
  })

  it('erro fica até a pessoa dispensar e é anunciado como alerta', async () => {
    const user = userEvent.setup()
    render(<Avisos />)

    act(() => avisar('Não foi possível salvar.', 'erro'))
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar.')

    await user.click(screen.getByRole('button', { name: 'Dispensar aviso' }))
    expect(screen.queryByText('Não foi possível salvar.')).not.toBeInTheDocument()
  })

  it('o mesmo texto não empilha', () => {
    render(<Avisos />)
    act(() => {
      avisar('Sem acesso.', 'atencao')
      avisar('Sem acesso.', 'atencao')
    })
    expect(screen.getAllByText('Sem acesso.')).toHaveLength(1)
  })
})
