import { describe, expect, it } from 'vitest'
import { mapearCasosPorDoenca, mapearRaivaPorEspecie, mapearResultadosLaboratoriais } from './mapearGraficos'

describe('mapearCasosPorDoenca', () => {
  it('mapeia cada doença preservando quantidade 0', () => {
    const resultado = mapearCasosPorDoenca([
      { doenca: { codigo: 'raiva', nome: 'Raiva' }, quantidade: 7 },
      { doenca: { codigo: 'febre_amarela', nome: 'Febre Amarela' }, quantidade: 0 },
    ])

    expect(resultado).toHaveLength(2)
    expect(resultado[0]).toMatchObject({ codigo: 'raiva', nome: 'Raiva', quantidade: 7, cor: '#C62828' })
    expect(resultado[1]).toMatchObject({ codigo: 'febre_amarela', quantidade: 0 })
  })

  it('lista vazia devolve lista vazia', () => {
    expect(mapearCasosPorDoenca([])).toEqual([])
  })
})

describe('mapearRaivaPorEspecie', () => {
  it('mapeia cada espécie com a cor correspondente', () => {
    const resultado = mapearRaivaPorEspecie([{ especie: { codigo: 'canino', nome: 'Canino' }, quantidade: 10 }])
    expect(resultado[0]).toMatchObject({ codigo: 'canino', nome: 'Canino', quantidade: 10, cor: '#558B2F' })
  })
})

describe('mapearResultadosLaboratoriais', () => {
  it('soma positivos e negativos em totalExames', () => {
    const resultado = mapearResultadosLaboratoriais([
      { doenca: { codigo: 'esporotricose', nome: 'Esporotricose' }, positivos: 2, negativos: 3 },
    ])
    expect(resultado[0]).toMatchObject({ doencaNome: 'Esporotricose', positivos: 2, negativos: 3, totalExames: 5 })
  })

  it('lista vazia (nenhuma doença com exame) devolve lista vazia', () => {
    expect(mapearResultadosLaboratoriais([])).toEqual([])
  })
})
