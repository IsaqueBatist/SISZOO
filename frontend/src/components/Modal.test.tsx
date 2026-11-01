import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Modal } from './Modal'

function Exemplo() {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setAberto(true)}>
        Abrir
      </button>
      {aberto && (
        <Modal titulo="Registrar" onFechar={() => setAberto(false)}>
          <div className="modal-body">
            <label htmlFor="campo">Campo</label>
            <input id="campo" />
          </div>
          <div className="modal-footer">
            <button type="button">Salvar</button>
          </div>
        </Modal>
      )}
    </>
  )
}

describe('Modal', () => {
  it('anuncia o título, leva o foco ao primeiro campo e devolve a quem abriu ao fechar com Esc', async () => {
    const user = userEvent.setup()
    render(<Exemplo />)
    const abrir = screen.getByRole('button', { name: 'Abrir' })
    await user.click(abrir)

    expect(screen.getByRole('dialog', { name: 'Registrar' })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByLabelText('Campo')).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(abrir).toHaveFocus()
  })

  it('mantém o Tab dentro do diálogo, nos dois sentidos', async () => {
    const user = userEvent.setup()
    render(<Exemplo />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))

    screen.getByRole('button', { name: 'Salvar' }).focus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()

    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveFocus()
  })

  it('clicar fora não fecha: um clique perdido não encerra um registro', async () => {
    const user = userEvent.setup()
    const { container } = render(<Exemplo />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))

    await user.click(container.querySelector('.modal-overlay') as HTMLElement)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
