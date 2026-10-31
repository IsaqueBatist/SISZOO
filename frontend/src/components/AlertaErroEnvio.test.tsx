import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AlertaErroEnvio } from './AlertaErroEnvio'

describe('AlertaErroEnvio', () => {
  it('leva a tela e o foco até o erro, para a falha não passar despercebida', () => {
    const rolar = vi.fn()
    Element.prototype.scrollIntoView = rolar
    render(<AlertaErroEnvio mensagem="Não foi possível salvar." />)

    expect(screen.getByRole('alert')).toHaveFocus()
    expect(rolar).toHaveBeenCalled()
  })

  it('sem mensagem, não mostra nada', () => {
    const { container } = render(<AlertaErroEnvio mensagem={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
