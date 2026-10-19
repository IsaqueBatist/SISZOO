import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErroComRetry } from './ErroComRetry'

describe('ErroComRetry', () => {
  it('renderiza a mensagem e chama onTentarNovamente ao clicar no botão', async () => {
    const onTentarNovamente = vi.fn()
    const user = userEvent.setup()
    render(<ErroComRetry mensagem="Falhou." onTentarNovamente={onTentarNovamente} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Falhou.')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onTentarNovamente).toHaveBeenCalledTimes(1)
  })
})
