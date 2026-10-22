import { describe, expect, it } from 'vitest'
import { extrairBairrosDistintos, mapearOcorrenciasPorBairro } from './mapearOcorrenciasPorBairro'

function ocorrencia(bairro: string) {
  return { bairro }
}

describe('mapearOcorrenciasPorBairro', () => {
  it('agrupa e conta por bairro, ordenado do mais frequente ao menos', () => {
    const resultado = mapearOcorrenciasPorBairro([
      ocorrencia('Centro'),
      ocorrencia('Centro'),
      ocorrencia('Vila Nova'),
    ])

    expect(resultado).toEqual([
      { bairro: 'Centro', quantidade: 2 },
      { bairro: 'Vila Nova', quantidade: 1 },
    ])
  })

  it('agrupa grafias diferentes do mesmo bairro (acento, maiúsculas, espaços) na mesma chave', () => {
    const resultado = mapearOcorrenciasPorBairro([
      ocorrencia('São Luiz'),
      ocorrencia('Sao Luiz'),
      ocorrencia(' SÃO LUIZ '),
    ])

    expect(resultado).toHaveLength(1)
    expect(resultado[0].quantidade).toBe(3)
  })

  it('usa a grafia mais frequente do grupo como rótulo, não uma forma "corrigida" arbitrária', () => {
    const resultado = mapearOcorrenciasPorBairro([
      ocorrencia('Sao Luiz'),
      ocorrencia('Sao Luiz'),
      ocorrencia('São Luiz'),
    ])

    expect(resultado[0].bairro).toBe('Sao Luiz')
  })

  it('ignora bairro vazio ou só espaços', () => {
    const resultado = mapearOcorrenciasPorBairro([ocorrencia('Centro'), ocorrencia('   '), ocorrencia('')])

    expect(resultado).toEqual([{ bairro: 'Centro', quantidade: 1 }])
  })

  it('agrupa em "Outros" a partir do 16º bairro mais frequente', () => {
    const ocorrencias = Array.from({ length: 17 }, (_, indice) =>
      // bairro índice 0 aparece 17 vezes, índice 1 aparece 16 vezes, ...,
      // garantindo uma ordem de frequência decrescente clara.
      Array.from({ length: 17 - indice }, () => ocorrencia(`Bairro ${indice}`)),
    ).flat()

    const resultado = mapearOcorrenciasPorBairro(ocorrencias)

    expect(resultado).toHaveLength(16) // 15 principais + "Outros"
    expect(resultado[15].bairro).toBe('Outros')
    const somaEsperadaOutros = Array.from({ length: 2 }, (_, i) => 17 - (15 + i)).reduce((a, b) => a + b, 0)
    expect(resultado[15].quantidade).toBe(somaEsperadaOutros)
  })
})

describe('extrairBairrosDistintos', () => {
  it('devolve uma grafia por bairro, em ordem alfabética, sem corte de Top N', () => {
    const ocorrencias = Array.from({ length: 20 }, (_, indice) => ocorrencia(`Bairro ${indice}`))

    const resultado = extrairBairrosDistintos(ocorrencias)
    const ordenadoEsperado = [...resultado].sort((a, b) => a.localeCompare(b, 'pt-BR'))

    expect(resultado).toHaveLength(20)
    expect(resultado).not.toContain('Outros')
    expect(resultado).toEqual(ordenadoEsperado)
  })

  it('agrupa grafias diferentes do mesmo bairro numa única sugestão (a mais frequente)', () => {
    const resultado = extrairBairrosDistintos([
      ocorrencia('Sao Luiz'),
      ocorrencia('Sao Luiz'),
      ocorrencia('São Luiz'),
      ocorrencia('Centro'),
    ])

    expect(resultado).toEqual(['Centro', 'Sao Luiz'])
  })

  it('ignora bairro vazio', () => {
    expect(extrairBairrosDistintos([ocorrencia('Centro'), ocorrencia('')])).toEqual(['Centro'])
  })
})
