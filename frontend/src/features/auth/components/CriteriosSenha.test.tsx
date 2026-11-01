import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CriteriosSenha } from './CriteriosSenha'

const DONO = { email: 'erin.hagens@itu.sp.gov.br', nomeExibicao: 'Erin M. Hagens' }

function itemDeCriterio(texto: RegExp) {
  return screen.getByText(texto).closest('li') as HTMLLIElement
}

describe('CriteriosSenha', () => {
  it('antes de digitar, todos os critérios ficam neutros', () => {
    render(<CriteriosSenha senha="" dono={DONO} />)

    expect(itemDeCriterio(/ao menos 8 caracteres/i)).toHaveClass('pendente')
    expect(itemDeCriterio(/3 tipos de caractere/i)).toHaveClass('pendente')
    expect(screen.queryByText(/não atendido/)).not.toBeInTheDocument()
  })

  it('marca o que foi atendido e o que falta enquanto a senha é digitada', () => {
    render(<CriteriosSenha senha="abc1" dono={DONO} />)

    expect(itemDeCriterio(/ao menos 8 caracteres/i)).toHaveClass('falha')
    expect(itemDeCriterio(/3 tipos de caractere/i)).toHaveClass('falha')
    expect(screen.getByText('(2 tipos)')).toBeInTheDocument()
    expect(screen.getByText(/letra minúscula/i).closest('li')).toHaveClass('presente')
    expect(screen.getByText(/letra maiúscula/i).closest('li')).not.toHaveClass('presente')
    expect(itemDeCriterio(/nome da conta/i)).toHaveClass('ok')
    expect(itemDeCriterio(/partes do seu nome/i)).toHaveClass('ok')
  })

  it('aponta nome da conta e partes do nome quando aparecem na senha', () => {
    render(<CriteriosSenha senha="X1!erin.hagens" dono={DONO} />)

    expect(itemDeCriterio(/nome da conta/i)).toHaveClass('falha')
    expect(itemDeCriterio(/partes do seu nome/i)).toHaveClass('falha')
    expect(itemDeCriterio(/3 tipos de caractere/i)).toHaveClass('ok')
  })

  it('senha dentro da política deixa tudo atendido', () => {
    render(<CriteriosSenha senha="Mm-Forte-2026" dono={DONO} />)

    for (const item of screen.getAllByText(/\(atendido\)/)) {
      expect(item.closest('li')).toHaveClass('ok')
    }
    expect(screen.queryByText(/não atendido/)).not.toBeInTheDocument()
  })

  it('sem dono, omite os critérios de nome e avisa que a API os confere', () => {
    render(<CriteriosSenha senha="abc" />)

    expect(screen.queryByText(/não conter o nome da conta/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/não conter partes do seu nome/i)).not.toBeInTheDocument()
    expect(screen.getByText(/conferido ao salvar/i)).toBeInTheDocument()
  })
})
