import { describe, expect, it } from 'vitest'
import { formatarProtocoloOcorrencia, formatarProtocoloProcesso } from './protocolo'

describe('prefixo de protocolo na exibição (D36)', () => {
  it('distingue ocorrência e processo com o mesmo número', () => {
    expect(formatarProtocoloOcorrencia('015/2026')).toBe('OC 015/2026')
    expect(formatarProtocoloProcesso('015/2026')).toBe('PS 015/2026')
  })

  it('não limita o número a 3 dígitos', () => {
    expect(formatarProtocoloOcorrencia('1000/2026')).toBe('OC 1000/2026')
  })
})
