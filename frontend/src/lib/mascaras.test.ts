import { describe, expect, it } from 'vitest'
import {
  cepValido,
  cpfValido,
  emailValido,
  formatarCep,
  formatarCpf,
  formatarTelefone,
  telefoneValido,
} from './mascaras'

describe('formatarCpf', () => {
  it('formata 11 dígitos como 000.000.000-00', () => {
    expect(formatarCpf('11144477735')).toBe('111.444.777-35')
  })

  it('formata progressivamente enquanto o usuário digita', () => {
    expect(formatarCpf('111')).toBe('111')
    expect(formatarCpf('1114')).toBe('111.4')
    expect(formatarCpf('111444777')).toBe('111.444.777')
  })

  it('ignora caracteres não numéricos já digitados e limita a 11 dígitos', () => {
    expect(formatarCpf('111.444.777-35999')).toBe('111.444.777-35')
  })
})

describe('formatarTelefone', () => {
  it('formata fixo (10 dígitos) como (00) 0000-0000', () => {
    expect(formatarTelefone('1133224455')).toBe('(11) 3322-4455')
  })

  it('formata celular (11 dígitos) como (00) 00000-0000', () => {
    expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321')
  })
})

describe('formatarCep', () => {
  it('formata 8 dígitos como 00000-000', () => {
    expect(formatarCep('13300000')).toBe('13300-000')
  })
})

describe('cpfValido', () => {
  it('aceita CPF com dígito verificador correto', () => {
    expect(cpfValido('111.444.777-35')).toBe(true)
  })

  it('rejeita dígito verificador errado', () => {
    expect(cpfValido('111.444.777-36')).toBe(false)
  })

  it('rejeita sequência repetida (matematicamente "válida", mas nunca é um CPF real)', () => {
    expect(cpfValido('111.111.111-11')).toBe(false)
  })

  it('rejeita quantidade errada de dígitos', () => {
    expect(cpfValido('111.444.777')).toBe(false)
  })
})

describe('telefoneValido', () => {
  it('aceita fixo e celular formatados', () => {
    expect(telefoneValido('(11) 3322-4455')).toBe(true)
    expect(telefoneValido('(11) 98765-4321')).toBe(true)
  })

  it('rejeita sem máscara', () => {
    expect(telefoneValido('11987654321')).toBe(false)
  })
})

describe('cepValido', () => {
  it('aceita formato 00000-000', () => {
    expect(cepValido('13300-000')).toBe(true)
  })

  it('rejeita sem máscara ou incompleto', () => {
    expect(cepValido('13300000')).toBe(false)
    expect(cepValido('13300-00')).toBe(false)
  })
})

describe('emailValido', () => {
  it('aceita e-mail com formato razoável', () => {
    expect(emailValido('maria@exemplo.com')).toBe(true)
  })

  it('rejeita sem @ ou sem domínio', () => {
    expect(emailValido('maria.exemplo.com')).toBe(false)
    expect(emailValido('maria@exemplo')).toBe(false)
  })
})
