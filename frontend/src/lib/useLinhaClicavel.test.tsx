import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useLinhaClicavel } from './useLinhaClicavel'

function Tabela({ aoAcionar }: { aoAcionar: () => void }) {
  const propsDaLinha = useLinhaClicavel()
  return (
    <table>
      <tbody>
        <tr {...propsDaLinha('/animais/a1')} data-testid="linha">
          <td>Canino</td>
          <td>
            <a href="/animais/a1/editar">Editar</a>
          </td>
          <td>
            <button type="button" onClick={aoAcionar}>
              Desativar
            </button>
          </td>
          <td>
            <div role="menu">
              <span>Item de menu</span>
            </div>
          </td>
        </tr>
        <tr {...propsDaLinha(aoAcionar)}>
          <td>Linha com ação</td>
        </tr>
      </tbody>
    </table>
  )
}

function renderTabela(aoAcionar = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/animais']}>
      <Routes>
        <Route path="/animais" element={<Tabela aoAcionar={aoAcionar} />} />
        <Route path="/animais/:id" element={<p>Ficha do animal</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return aoAcionar
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useLinhaClicavel', () => {
  it('clique numa célula comum abre o destino da linha', async () => {
    renderTabela()

    await userEvent.setup().click(screen.getByText('Canino'))

    expect(await screen.findByText('Ficha do animal')).toBeInTheDocument()
  })

  it('botão, link e menu dentro da linha não disparam a navegação da linha', async () => {
    const user = userEvent.setup()
    const aoAcionar = renderTabela()

    await user.click(screen.getByRole('button', { name: 'Desativar' }))
    await user.click(screen.getByText('Item de menu'))
    fireEvent.click(screen.getByRole('link', { name: 'Editar' }))

    expect(aoAcionar).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Ficha do animal')).not.toBeInTheDocument()
  })

  it('não tem atalho de teclado: clique com Ctrl se comporta como clique comum, sem abrir nova aba', async () => {
    const abrir = vi.spyOn(window, 'open').mockReturnValue(null)
    renderTabela()

    fireEvent.click(screen.getByText('Canino'), { ctrlKey: true })

    expect(abrir).not.toHaveBeenCalled()
    expect(await screen.findByText('Ficha do animal')).toBeInTheDocument()
  })

  it('não navega quando o usuário está selecionando texto da linha', () => {
    vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => 'Canino' } as Selection)
    renderTabela()

    fireEvent.click(screen.getByText('Canino'))

    expect(screen.queryByText('Ficha do animal')).not.toBeInTheDocument()
  })

  it('aceita uma ação no lugar de um destino', async () => {
    const aoAcionar = renderTabela()

    await userEvent.setup().click(screen.getByText('Linha com ação'))

    expect(aoAcionar).toHaveBeenCalledTimes(1)
  })
})
