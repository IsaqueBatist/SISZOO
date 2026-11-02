import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import type { AnimalFormUiValues } from '../schemas/animalFormSchema'
import { rascunhoParaValores, valoresVazios } from '../utils/animalFormMapeamento'
import { CamposEutanasia } from './CamposEutanasia'
import { CamposSaudeBaia } from './CamposSaudeBaia'

function Formulario({ children, status }: { children: ReactNode; status: string }) {
  const formulario = useForm<AnimalFormUiValues>({
    defaultValues: { ...rascunhoParaValores(valoresVazios(), undefined), status },
  })
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <FormProvider {...formulario}>{children}</FormProvider>
    </QueryClientProvider>
  )
}

describe('CamposEutanasia', () => {
  it('pede laudo, método e insensibilização prévia, sem afirmar que o sistema garante a legalidade', () => {
    render(
      <Formulario status="obito_eutanasia">
        <CamposEutanasia registrado={null} />
      </Formulario>,
    )

    expect(screen.getByLabelText(/Laudo de eutanásia/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Método/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /insensibilizado antes do procedimento/ })).toBeInTheDocument()
    expect(screen.getByText(/O sistema registra o laudo; a decisão técnica é do veterinário responsável./)).toBeInTheDocument()
    expect(screen.queryByText(/garante/i)).not.toBeInTheDocument()
  })

  it('laudo registrado aparece só para leitura, com veterinário, CRMV, método e data', () => {
    render(
      <Formulario status="obito_eutanasia">
        <CamposEutanasia
          registrado={{
            laudoEutanasia: 'Quadro irreversível',
            laudoEutanasiaResponsavelNome: 'Renato Albuquerque',
            laudoEutanasiaCrmv: 'SP-99001',
            laudoEutanasiaMetodo: 'Barbitúrico intravenoso',
            laudoEutanasiaInsensibilizacaoPrevia: true,
            laudoEutanasiaRegistradoEm: '2026-09-10T12:00:00',
          }}
        />
      </Formulario>,
    )

    expect(screen.getByText(/não pode ser alterado/)).toBeInTheDocument()
    expect(screen.getByText('Renato Albuquerque')).toBeInTheDocument()
    expect(screen.getByText('SP-99001')).toBeInTheDocument()
    expect(screen.getByText('Barbitúrico intravenoso')).toBeInTheDocument()
    expect(screen.getByText('10/09/2026, 12:00')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Método/)).not.toBeInTheDocument()
  })
})

describe('CamposSaudeBaia — status de eutanásia', () => {
  it('sem veterinário com CRMV, a opção de eutanásia fica desabilitada com explicação', async () => {
    render(
      <Formulario status="em_tratamento">
        <CamposSaudeBaia baiaAtualId="" podeRegistrarEutanasia={false} />
      </Formulario>,
    )

    const opcao = await screen.findByRole('option', { name: /eutan/i })
    expect(opcao).toBeDisabled()
    expect(screen.getByText(/só veterinário com CRMV cadastrado pode registrar o laudo/)).toBeInTheDocument()
  })

  it('veterinário com CRMV pode escolher eutanásia', async () => {
    render(
      <Formulario status="em_tratamento">
        <CamposSaudeBaia baiaAtualId="" podeRegistrarEutanasia />
      </Formulario>,
    )

    expect(await screen.findByRole('option', { name: /eutan/i })).toBeEnabled()
    expect(screen.queryByText(/só veterinário com CRMV/)).not.toBeInTheDocument()
  })
})
