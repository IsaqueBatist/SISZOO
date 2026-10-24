import { act, renderHook, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import type { ArmazenamentoRascunho, RegistroRascunho } from './rascunhoDb'
import { useRascunho } from './useRascunho'

interface Valores {
  lote: string
}

// 24/10/2026 19:42 no fuso de Itu, para a asserção da data no aviso.
const SALVO_EM = new Date('2026-10-24T22:42:00Z').getTime()

function armazenamentoFalso(salvo: Valores | null, salvoEm: number | null = SALVO_EM) {
  let resolverCarga: (valor: RegistroRascunho<Valores> | null) => void = () => {}
  const armazenamento = {
    carregar: vi.fn(() => new Promise<RegistroRascunho<Valores> | null>((resolve) => (resolverCarga = resolve))),
    agendarSalvar: vi.fn(),
    salvar: vi.fn().mockResolvedValue(undefined),
    remover: vi.fn().mockResolvedValue(undefined),
    cancelarAgendado: vi.fn(),
  } satisfies ArmazenamentoRascunho<Valores>
  return {
    armazenamento,
    terminarCarga: () => act(() => resolverCarga(salvo ? { dados: salvo, salvoEm } : null)),
  }
}

function renderRascunho(armazenamento: ArmazenamentoRascunho<Valores>) {
  return renderHook(() => {
    const form = useForm<Valores>({ defaultValues: { lote: '' } })
    const rascunho = useRascunho<Valores>({
      armazenamento,
      chave: 'u1:vacina:a1',
      watch: form.watch,
      reset: form.reset,
      getValues: form.getValues,
    })
    return { form, rascunho }
  })
}

describe('useRascunho', () => {
  it('só agenda salvar depois de terminar a checagem do rascunho existente', async () => {
    const { armazenamento, terminarCarga } = armazenamentoFalso(null)
    const { result } = renderRascunho(armazenamento)

    act(() => result.current.form.setValue('lote', 'L1'))
    expect(armazenamento.agendarSalvar).not.toHaveBeenCalled()

    await terminarCarga()
    act(() => result.current.form.setValue('lote', 'L2'))

    await waitFor(() => expect(armazenamento.agendarSalvar).toHaveBeenCalledWith('u1:vacina:a1', { lote: 'L2' }))
  })

  it('oferece o rascunho salvo e só preenche o formulário ao restaurar', async () => {
    const { armazenamento, terminarCarga } = armazenamentoFalso({ lote: 'SALVO' })
    const { result } = renderRascunho(armazenamento)

    await terminarCarga()
    expect(result.current.rascunho.rascunhoDisponivel).toEqual({ lote: 'SALVO' })
    expect(result.current.form.getValues('lote')).toBe('')

    act(() => result.current.rascunho.restaurar())

    expect(result.current.form.getValues('lote')).toBe('SALVO')
    expect(result.current.rascunho.rascunhoDisponivel).toBeNull()
  })

  it('depois do envio com sucesso cancela o salvamento pendente e remove', async () => {
    const { armazenamento, terminarCarga } = armazenamentoFalso(null)
    const { result } = renderRascunho(armazenamento)
    await terminarCarga()

    await act(() => result.current.rascunho.removerAposSucesso())

    expect(armazenamento.cancelarAgendado).toHaveBeenCalledWith('u1:vacina:a1')
    expect(armazenamento.remover).toHaveBeenCalledWith('u1:vacina:a1')
    expect(armazenamento.cancelarAgendado.mock.invocationCallOrder[0]).toBeLessThan(
      armazenamento.remover.mock.invocationCallOrder[0],
    )
  })

  it('expõe o instante do salvamento e o zera ao restaurar', async () => {
    const { armazenamento, terminarCarga } = armazenamentoFalso({ lote: 'SALVO' })
    const { result } = renderRascunho(armazenamento)

    await terminarCarga()
    expect(result.current.rascunho.rascunhoSalvoEm).toBe(SALVO_EM)

    act(() => result.current.rascunho.restaurar())

    expect(result.current.rascunho.rascunhoSalvoEm).toBeNull()
  })

  it('rascunho gravado antes da T42 vem sem instante, mas continua restaurável', async () => {
    const { armazenamento, terminarCarga } = armazenamentoFalso({ lote: 'LEGADO' }, null)
    const { result } = renderRascunho(armazenamento)

    await terminarCarga()

    expect(result.current.rascunho.rascunhoDisponivel).toEqual({ lote: 'LEGADO' })
    expect(result.current.rascunho.rascunhoSalvoEm).toBeNull()
  })

  it('o descarte zera o aviso e apaga do armazenamento', async () => {
    const { armazenamento, terminarCarga } = armazenamentoFalso({ lote: 'SALVO' })
    const { result } = renderRascunho(armazenamento)
    await terminarCarga()

    await act(() => result.current.rascunho.descartar())

    expect(result.current.rascunho.rascunhoDisponivel).toBeNull()
    expect(result.current.rascunho.rascunhoSalvoEm).toBeNull()
    expect(armazenamento.remover).toHaveBeenCalledWith('u1:vacina:a1')
  })

  it('sem chamada de removerAposSucesso (envio que falhou) o rascunho fica', async () => {
    const { armazenamento, terminarCarga } = armazenamentoFalso({ lote: 'SALVO' })
    const { result } = renderRascunho(armazenamento)
    await terminarCarga()

    act(() => result.current.form.setValue('lote', 'L3'))

    await waitFor(() => expect(armazenamento.agendarSalvar).toHaveBeenCalled())
    expect(armazenamento.remover).not.toHaveBeenCalled()
  })
})
