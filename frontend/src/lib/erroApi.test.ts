import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { aplicarErrosDeCampo, mapaDeCampos } from './erroApi'

function erroHttp(status: number, data: unknown): AxiosError {
  const response = { status, data, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } } as AxiosResponse
  return new AxiosError('falha', undefined, undefined, undefined, response)
}

const CAMPOS_422 = {
  mensagem: 'Dados invalidos',
  campos: [
    { campo: 'dataEntrada', mensagem: 'Data de entrada nao pode ser futura' },
    { campo: 'esterilizado', mensagem: 'nao deve ser nulo' },
    { campo: 'animalId', mensagem: 'nao deve ser nulo' },
  ],
}

describe('aplicarErrosDeCampo', () => {
  it('aplica cada campo com o mesmo nome quando não há mapa', () => {
    const setError = vi.fn()
    const aplicados = aplicarErrosDeCampo(erroHttp(422, CAMPOS_422), setError)

    expect(aplicados).toEqual(['dataEntrada', 'esterilizado', 'animalId'])
    expect(setError).toHaveBeenCalledWith('dataEntrada', { type: 'server', message: 'Data de entrada nao pode ser futura' })
  })

  it('com mapa, traduz o nome e ignora o que o formulário não tem', () => {
    const setError = vi.fn()
    const mapa = { ...mapaDeCampos<{ dataEntrada: string; castracao: string }>(['dataEntrada']), esterilizado: 'castracao' as const }

    const aplicados = aplicarErrosDeCampo(erroHttp(422, CAMPOS_422), setError, mapa)

    expect(aplicados).toEqual(['dataEntrada', 'castracao'])
    expect(setError).toHaveBeenCalledWith('castracao', { type: 'server', message: 'nao deve ser nulo' })
    expect(setError).not.toHaveBeenCalledWith('animalId', expect.anything())
  })

  it('não aplica nada fora de 422 ou sem `campos`', () => {
    const setError = vi.fn()

    expect(aplicarErrosDeCampo(erroHttp(409, CAMPOS_422), setError)).toEqual([])
    expect(aplicarErrosDeCampo(erroHttp(422, { mensagem: 'Data de aplicacao nao pode ser futura' }), setError)).toEqual([])
    expect(aplicarErrosDeCampo(new Error('rede'), setError)).toEqual([])
    expect(setError).not.toHaveBeenCalled()
  })
})
