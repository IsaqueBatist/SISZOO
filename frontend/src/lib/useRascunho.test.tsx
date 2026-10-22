import { act, renderHook, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import type { ArmazenamentoRascunho } from './rascunhoDb'
import { useRascunho } from './useRascunho'

interface Valores {
  lote: string
}

function armazenamentoFalso(salvo: Valores | null) {
  let resolverCarga: (valor: Valores | null) => void = () => {}
  const armazenamento = {
    carregar: vi.fn(() => new Promise<Valores | null>((resolve) => (resolverCarga = resolve))),
    agendarSalvar: vi.fn(),
    salvar: vi.fn().mockResolvedValue(undefined),
    remover: vi.fn().mockResolvedValue(undefined),
    cancelarAgendado: vi.fn(),
  } satisfies ArmazenamentoRascunho<Valores>
  return { armazenamento, terminarCarga: () => act(() => resolverCarga(salvo)) }
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
})
