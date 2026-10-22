import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/lib/env'
import { hojeEmItu } from '@/lib/datas'

// O backend devolve datas com hora como LocalDateTime sem fuso, já no horário
// de Itu ("2026-05-20T14:32:00"); nenhum DTO de resposta usa instante. O mock
// tem de seguir esse contrato, senão os testes do front passam sobre um
// formato ("...Z") que a API real nunca envia.

const ANIMAL_REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'
const COM_FUSO = /T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/

// Caminha pela resposta e devolve "caminho = valor" de toda string com fuso.
function datasComFuso(valor: unknown, caminho = '$'): string[] {
  if (typeof valor === 'string') return COM_FUSO.test(valor) ? [`${caminho} = ${valor}`] : []
  if (Array.isArray(valor)) return valor.flatMap((item, i) => datasComFuso(item, `${caminho}[${i}]`))
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([chave, item]) => datasComFuso(item, `${caminho}.${chave}`))
  }
  return []
}

async function obter(caminho: string) {
  return (await fetch(`${API_BASE_URL}${caminho}`)).json()
}

describe('datas do mock seguem o contrato da API (LocalDateTime sem fuso)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    '/usuarios',
    '/usuarios/me',
    '/animais',
    `/animais/${ANIMAL_REX_ID}`,
    `/vacinacoes?animalId=${ANIMAL_REX_ID}`,
    `/procedimentos?animalId=${ANIMAL_REX_ID}`,
    `/prescricoes?animalId=${ANIMAL_REX_ID}`,
    '/alertas/vacinas',
  ])('GET %s não traz data com fuso', async (caminho) => {
    expect(datasComFuso(await obter(caminho))).toEqual([])
  })

  it('registros criados pelo mock levam o horário de Itu, sem fuso', async () => {
    vi.useFakeTimers({ toFake: ['Date'], shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2031-01-01T00:30:00Z')) // 31/12/2030 21:30 em Itu

    const animal = await (
      await fetch(`${API_BASE_URL}/animais`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Contrato',
          especie: 'canino',
          sexo: 'macho',
          esterilizado: false,
          status: 'em_tratamento',
          motivoEntrada: 'resgate',
          dataEntrada: `${hojeEmItu()}T09:00:00`,
        }),
      })
    ).json()
    const vacinacao = await (
      await fetch(`${API_BASE_URL}/vacinacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalId: animal.id,
          vacina: 'v10',
          dataAplicacao: hojeEmItu(),
          doseQuantidade: 1,
          doseUnidade: 'MILILITRO',
        }),
      })
    ).json()

    expect(datasComFuso([animal, vacinacao])).toEqual([])
    expect(animal.criadoEm).toMatch(/^2030-12-31T21:30/)
    expect(vacinacao.criadoEm).toMatch(/^2030-12-31T21:30/)
  })
})
