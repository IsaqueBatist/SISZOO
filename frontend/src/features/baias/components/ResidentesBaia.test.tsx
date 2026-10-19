import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Animal } from '@/features/animais/types/animais.types'
import { ResidentesBaia } from './ResidentesBaia'

function animal(sobrescrever: Partial<Animal>): Animal {
  return {
    id: 'id-padrao',
    nome: 'Rex',
    especieCodigo: 'canino',
    especieNome: 'Canino',
    sexo: 'macho',
    raca: null,
    coloracao: null,
    pelagem: null,
    porte: null,
    pesoKg: null,
    idadeAprox: null,
    dataNascimentoAprox: null,
    microchip: null,
    esterilizado: false,
    dataEsterilizacao: null,
    statusCodigo: 'disponivel_adocao',
    statusNome: 'Disponível',
    motivoEntradaCodigo: 'resgate',
    motivoEntradaNome: 'Resgate',
    dataEntrada: '2026-01-01T09:00:00Z',
    baiaId: 'baia-1',
    baiaNome: 'Baia 1',
    tipoBaiaNome: 'Canil',
    fichaCompleta: true,
    fotoUrl: null,
    observacoes: null,
    criadoPorId: 'id',
    criadoPorNome: 'Nome',
    criadoEm: '2026-01-01T09:00:00Z',
    atualizadoEm: '2026-01-01T09:00:00Z',
    ...sobrescrever,
  }
}

function renderResidentes(animais: Animal[]) {
  return render(
    <MemoryRouter>
      <ResidentesBaia animais={animais} />
    </MemoryRouter>,
  )
}

describe('ResidentesBaia', () => {
  it('mostra "Vazia" quando não há residentes', () => {
    renderResidentes([])
    expect(screen.getByText('Vazia')).toBeInTheDocument()
  })

  it('sem fotoUrl, mostra o ícone de pata e linka para a ficha do animal', () => {
    renderResidentes([animal({ id: 'rex-id', nome: 'Rex', fotoUrl: null })])

    const link = screen.getByRole('link', { name: 'Rex' })
    expect(link).toHaveAttribute('href', '/animais/rex-id')
    expect(link.querySelector('img')).not.toBeInTheDocument()
  })

  it('com fotoUrl, mostra a foto em vez do ícone', () => {
    renderResidentes([animal({ nome: 'Luna', fotoUrl: 'https://exemplo.com/luna.jpg' })])

    const img = screen.getByRole('link', { name: 'Luna' }).querySelector('img')
    expect(img).toHaveAttribute('src', 'https://exemplo.com/luna.jpg')
  })

  it('se a foto falhar ao carregar, cai para o ícone de pata', () => {
    renderResidentes([animal({ nome: 'Luna', fotoUrl: 'https://exemplo.com/quebrada.jpg' })])

    const link = screen.getByRole('link', { name: 'Luna' })
    const img = link.querySelector('img') as HTMLImageElement
    fireEvent.error(img)

    expect(link.querySelector('img')).not.toBeInTheDocument()
  })

  it('mostra no máximo 5 avatares e "+N" para o restante', () => {
    const animais = Array.from({ length: 8 }, (_, indice) => animal({ id: `id-${indice}`, nome: `Animal ${indice}` }))
    renderResidentes(animais)

    expect(screen.getAllByRole('link')).toHaveLength(5)
    expect(screen.getByText('+3')).toBeInTheDocument()
  })
})
