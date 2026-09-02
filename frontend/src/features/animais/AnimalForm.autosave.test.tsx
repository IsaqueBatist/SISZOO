import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CadastrarAnimal } from './CadastrarAnimal'

// jsdom não implementa IndexedDB (typeof indexedDB === 'undefined'), então o
// módulo de rascunho é mockado diretamente — o mesmo padrão já usado para
// comprimirImagem.ts em AnimalForm.test.tsx. Isso testa exatamente o que
// importa aqui: QUANDO agendarSalvarRascunhoAnimal é chamado (gate de
// hidratação) e COM QUE FORMA (compatibilidade retroativa do rascunho), não
// a mecânica de IndexedDB em si (isso é responsabilidade de
// rascunhoAnimalStorage.ts, inalterado nesta migração).
vi.mock('./rascunhoAnimalStorage', async () => {
  const real = await vi.importActual<typeof import('./rascunhoAnimalStorage')>('./rascunhoAnimalStorage')
  return {
    ...real,
    carregarRascunhoAnimal: vi.fn(),
    agendarSalvarRascunhoAnimal: vi.fn(),
    salvarRascunhoAnimal: vi.fn().mockResolvedValue(undefined),
    removerRascunhoAnimal: vi.fn().mockResolvedValue(undefined),
  }
})

import { agendarSalvarRascunhoAnimal, carregarRascunhoAnimal } from './rascunhoAnimalStorage'

function renderCadastrar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/animais/novo']}>
        <Routes>
          <Route path="/animais" element={<div>Lista de animais</div>} />
          <Route path="/animais/novo" element={<CadastrarAnimal />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AnimalForm — autosave do rascunho', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não agenda salvar o rascunho antes da checagem inicial terminar', async () => {
    let resolverCarregamento: (valor: unknown) => void = () => {}
    vi.mocked(carregarRascunhoAnimal).mockImplementation(
      () => new Promise((resolve) => { resolverCarregamento = resolve }),
    )

    const user = userEvent.setup()
    renderCadastrar()

    // Digitar antes da checagem do rascunho salvo terminar: nada pode ser
    // agendado ainda — senão um objeto vazio/parcial sobrescreveria, no
    // IndexedDB real, um rascunho de verdade do usuário.
    await user.type(screen.getByLabelText(/nome do animal/i), 'Rex')
    expect(agendarSalvarRascunhoAnimal).not.toHaveBeenCalled()

    await act(async () => {
      resolverCarregamento(null)
    })

    await user.type(screen.getByLabelText(/nome do animal/i), ' Teste')
    await waitFor(() => expect(agendarSalvarRascunhoAnimal).toHaveBeenCalled())
  })

  it('agenda salvar com exatamente as 19 chaves de RascunhoAnimalValores', async () => {
    vi.mocked(carregarRascunhoAnimal).mockResolvedValue(null)

    const user = userEvent.setup()
    renderCadastrar()

    await user.type(screen.getByLabelText(/nome do animal/i), 'Rex')

    await waitFor(() => expect(agendarSalvarRascunhoAnimal).toHaveBeenCalled())
    const [, valoresSalvos] = vi.mocked(agendarSalvarRascunhoAnimal).mock.calls.at(-1)!
    expect(Object.keys(valoresSalvos as object).sort()).toEqual(
      [
        'nome',
        'especie',
        'sexo',
        'raca',
        'coloracao',
        'pelagem',
        'porte',
        'pesoKg',
        'idadeAprox',
        'dataNascimentoAprox',
        'microchip',
        'castracaoOpcao',
        'dataEsterilizacao',
        'status',
        'motivoEntrada',
        'dataEntrada',
        'baiaId',
        'fotoUrl',
        'observacoes',
      ].sort(),
    )
  })

  it('restaura um rascunho salvo no formato anterior à migração, sem lançar erro', async () => {
    vi.mocked(carregarRascunhoAnimal).mockResolvedValue({
      nome: 'Rascunho Antigo',
      especie: 'felino',
      sexo: 'femea',
      raca: '',
      coloracao: '',
      pelagem: '',
      porte: '',
      pesoKg: '4.2',
      idadeAprox: '',
      dataNascimentoAprox: '',
      microchip: '',
      castracaoOpcao: 'nao_castrado',
      dataEsterilizacao: '',
      status: '',
      motivoEntrada: '',
      dataEntrada: '2026-01-01',
      baiaId: '',
      fotoUrl: '',
      observacoes: '',
    })

    const user = userEvent.setup()
    renderCadastrar()

    await user.click(await screen.findByRole('button', { name: /restaurar rascunho/i }))

    expect(screen.getByLabelText(/nome do animal/i)).toHaveValue('Rascunho Antigo')
    expect(await screen.findByRole('radio', { name: 'Felino' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Fêmea' })).toHaveAttribute('aria-checked', 'true')
  })
})
