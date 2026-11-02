import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { animalFormUiSchema, type AnimalFormUiValues } from '../schemas/animalFormSchema'
import { rascunhoParaValores, valoresVazios } from '../utils/animalFormMapeamento'
import { CamposTransferencia, type TransferenciaRegistrada } from './CamposTransferencia'

function Formulario({ children, onValido }: { children: ReactNode; onValido: (dados: AnimalFormUiValues) => void }) {
  const formulario = useForm<AnimalFormUiValues>({
    resolver: zodResolver(animalFormUiSchema),
    defaultValues: {
      ...rascunhoParaValores(valoresVazios(), undefined),
      nome: 'Pipoca',
      especie: 'canino',
      sexo: 'femea',
      status: 'transferido',
      motivoEntrada: 'resgate',
      dataEntrada: '2026-01-10',
    },
  })
  return (
    <FormProvider {...formulario}>
      <form onSubmit={formulario.handleSubmit(onValido)}>
        {children}
        <button type="submit">Salvar</button>
      </form>
    </FormProvider>
  )
}

function renderCampos(registrada: TransferenciaRegistrada | null = null) {
  const onValido = vi.fn()
  render(
    <Formulario onValido={onValido}>
      <CamposTransferencia registrada={registrada} />
    </Formulario>,
  )
  return onValido
}

describe('CamposTransferencia', () => {
  it('exige tipo, destino e data de saída para salvar a transferência', async () => {
    const onValido = renderCampos()

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Selecione o tipo de destino.')).toBeInTheDocument()
    expect(screen.getByText('Informe o órgão ou a entidade de destino.')).toBeInTheDocument()
    expect(screen.getByText('Informe a data de saída.')).toBeInTheDocument()
    expect(onValido).not.toHaveBeenCalled()
  })

  it('aceita a transferência completa; o documento é opcional', async () => {
    const onValido = renderCampos()

    await userEvent.selectOptions(screen.getByLabelText(/Tipo de destino/), 'ENTIDADE_PROTECAO')
    await userEvent.type(screen.getByLabelText(/^Destino/), 'Associação Protetora')
    await userEvent.type(screen.getByLabelText(/Data e hora da saída/), '2026-01-12T10:00')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onValido).toHaveBeenCalledOnce()
    expect(onValido.mock.calls[0][0]).toMatchObject({
      tipoDestinoTransferencia: 'ENTIDADE_PROTECAO',
      destinoTransferencia: 'Associação Protetora',
      dataSaida: '2026-01-12T10:00',
    })
  })

  it('não oferece opção de adotante', () => {
    renderCampos()

    expect(screen.queryByRole('option', { name: /adot/i })).not.toBeInTheDocument()
  })

  it('transferência registrada aparece só para leitura, com o documento ainda editável se vazio', () => {
    renderCampos({
      tipoDestinoTransferencia: 'OUTRO_CCZ',
      destinoTransferencia: 'CCZ de Sorocaba',
      dataSaida: '2026-01-12T10:00:00',
      documentoTransferencia: null,
    })

    expect(screen.getByText(/não pode ser alterada/)).toBeInTheDocument()
    expect(screen.getByText('CCZ de Sorocaba')).toBeInTheDocument()
    expect(screen.getByText('12/01/2026, 10:00')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Tipo de destino/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Documento')).toBeInTheDocument()
  })
})
