import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EVENTO_REDE_FALHA, EVENTO_REDE_OK } from '@/lib/http'
import { BannerOffline } from './BannerOffline'

function emitir(nome: string) {
  act(() => {
    window.dispatchEvent(new Event(nome))
  })
}

describe('BannerOffline', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('não aparece enquanto a conexão está normal', () => {
    render(<BannerOffline />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('aparece no evento offline e desaparece no online', () => {
    render(<BannerOffline />)

    emitir('offline')
    expect(screen.getByText('Sem conexão com a internet.')).toBeInTheDocument()
    expect(screen.getByText(/continua guardado neste computador/)).toBeInTheDocument()

    emitir('online')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('falha de requisição fala em instabilidade, não em offline', () => {
    render(<BannerOffline />)

    emitir(EVENTO_REDE_FALHA)

    expect(screen.getByText('Possível instabilidade na conexão.')).toBeInTheDocument()
    expect(screen.queryByText(/Sem conexão com a internet/)).not.toBeInTheDocument()
    expect(screen.getByText(/Não conseguimos falar com o servidor/)).toBeInTheDocument()
  })

  it('uma resposta do servidor tira o aviso de instabilidade', () => {
    render(<BannerOffline />)
    emitir(EVENTO_REDE_FALHA)

    emitir(EVENTO_REDE_OK)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('o aviso é anunciado sem roubar o foco de quem está digitando', () => {
    render(<BannerOffline />)

    emitir('offline')

    const aviso = screen.getByRole('status')
    expect(aviso).toHaveAttribute('aria-live', 'polite')
    expect(aviso).toHaveClass('alert', 'warning')
  })
})
