import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CardDenunciante } from './CardDenunciante'
import type { Denunciante } from '../types/ocorrencias.types'

const DENUNCIANTE_COMPLETO: Denunciante = {
  nome: 'Maria Souza Oliveira',
  cpf: '123.456.789-00',
  telefone: '(11) 9 8765-4321',
  email: 'maria.souza@email.com',
  cep: '13301-000',
  endereco: 'Rua dos Ipês, 220',
  bairroResidencial: 'Vila Esperança',
}

const DENUNCIANTE_MASCARADO: Denunciante = {
  nome: null,
  cpf: null,
  telefone: null,
  email: null,
  cep: null,
  endereco: null,
  bairroResidencial: null,
}

describe('CardDenunciante', () => {
  it('exibe os dados do denunciante quando não sigilosa', () => {
    render(<CardDenunciante mascarado={false} anonima={false} denunciante={DENUNCIANTE_COMPLETO} />)

    expect(screen.getByText('Maria Souza Oliveira')).toBeInTheDocument()
    expect(screen.getByText('123.456.789-00')).toBeInTheDocument()
    expect(screen.getByText('maria.souza@email.com')).toBeInTheDocument()
  })

  it('exibe o placeholder "Sigiloso" quando o denunciante vem mascarado (sigilosa sem permissão) e os campos vêm null, sem quebrar o layout', () => {
    render(<CardDenunciante mascarado={true} anonima={false} denunciante={DENUNCIANTE_MASCARADO} />)

    expect(screen.getAllByText('Sigiloso').length).toBeGreaterThan(0)
    expect(screen.queryByText('Maria Souza Oliveira')).not.toBeInTheDocument()
  })

  it('exibe "—" (não "Sigiloso") quando o campo é null mas o denunciante não está mascarado', () => {
    render(<CardDenunciante mascarado={false} anonima={false} denunciante={DENUNCIANTE_MASCARADO} />)

    expect(screen.queryByText('Sigiloso')).not.toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('mostra estado vazio quando não há denunciante registrado', () => {
    render(<CardDenunciante mascarado={false} anonima={false} denunciante={null} />)

    expect(screen.getByText('Nenhum denunciante registrado para esta ocorrência.')).toBeInTheDocument()
  })

  it('mostra o aviso de denúncia anônima, sem campos nem placeholder "Sigiloso"', () => {
    render(<CardDenunciante mascarado={false} anonima={true} denunciante={null} />)

    expect(screen.getByText(/Denúncia anônima/)).toBeInTheDocument()
    expect(screen.queryByText('Sigiloso')).not.toBeInTheDocument()
    expect(screen.queryByText('CPF')).not.toBeInTheDocument()
  })
})
