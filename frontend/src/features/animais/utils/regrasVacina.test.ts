import { describe, expect, it } from 'vitest'
import { badgeReforcoVacina, diasAteVencimento } from './regrasVacina'

const HOJE = '2026-06-15'

function addDias(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias))
  return data.toISOString().slice(0, 10)
}

describe('badgeReforcoVacina', () => {
  it('classifica "vencida" quando a validade já passou', () => {
    const badge = badgeReforcoVacina(addDias(HOJE, -1), HOJE)
    expect(badge?.status).toBe('vencida')
    expect(badge?.classeLinha).toBe('reforco-warning')
  })

  it('classifica "em dia" quando faltam mais de 7 dias', () => {
    const badge = badgeReforcoVacina(addDias(HOJE, 8), HOJE)
    expect(badge?.status).toBe('em_dia')
    expect(badge?.classeLinha).toBe('')
  })

  it('fronteira: dataValidade === hoje (diff 0) é "a vencer", nunca "vencida"', () => {
    const badge = badgeReforcoVacina(HOJE, HOJE)
    expect(badge?.status).toBe('a_vencer')
    expect(diasAteVencimento(HOJE, HOJE)).toBe(0)
  })

  it('fronteira: dataValidade === hoje + 7 dias (limite inclusive) é "a vencer"', () => {
    const dataValidade = addDias(HOJE, 7)
    const badge = badgeReforcoVacina(dataValidade, HOJE)
    expect(diasAteVencimento(dataValidade, HOJE)).toBe(7)
    expect(badge?.status).toBe('a_vencer')
  })

  it('fronteira: dataValidade === hoje + 8 dias já cai em "em dia"', () => {
    const dataValidade = addDias(HOJE, 8)
    const badge = badgeReforcoVacina(dataValidade, HOJE)
    expect(diasAteVencimento(dataValidade, HOJE)).toBe(8)
    expect(badge?.status).toBe('em_dia')
  })

  it('dataValidade nula não gera badge (vacina sem intervaloMeses cadastrado)', () => {
    expect(badgeReforcoVacina(null, HOJE)).toBeNull()
  })
})
