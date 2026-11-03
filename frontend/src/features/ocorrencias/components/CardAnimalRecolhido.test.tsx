import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/features/auth/hooks/authContextValue'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { criarOcorrenciaFixture } from '@/mocks/ocorrenciasFixtures'
import { CardAnimalRecolhido } from './CardAnimalRecolhido'
import type { Ocorrencia } from '../types/ocorrencias.types'

const ANIMAL = {
  id: 'animal-1',
  nome: 'Caramelo',
  microchip: '985000000000123',
  especieNome: 'Canino',
  sexo: 'macho',
}

const VINCULADO = { id: ANIMAL.id, nome: ANIMAL.nome, microchip: ANIMAL.microchip }

const ROTULO_BUSCA = 'Buscar animal recolhido por nome ou microchip'

function renderCard(ocorrencia: Ocorrencia, podeVincular = true, roleKey: AuthContextValue['roleKey'] = 'admin') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthContext.Provider value={{ roleKey } as AuthContextValue}>
          <CardAnimalRecolhido ocorrencia={ocorrencia} podeVincular={podeVincular} />
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function buscaDevolveAnimal() {
  server.use(
    http.get(`${API_BASE_URL}/animais`, () =>
      HttpResponse.json({ itens: [ANIMAL], pagina: 0, tamanho: 8, totalItens: 1, totalPaginas: 1 }),
    ),
  )
}

async function escolherAnimal(busca: string) {
  await userEvent.type(screen.getByRole('combobox', { name: ROTULO_BUSCA }), busca)
  await userEvent.click(await screen.findByRole('option', { name: /Caramelo/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Vincular animal' }))
}

describe('CardAnimalRecolhido', () => {
  it('fecha a lista de sugestões ao escolher o animal e mostra o escolhido no campo', async () => {
    buscaDevolveAnimal()
    renderCard(criarOcorrenciaFixture())

    const busca = screen.getByRole('combobox', { name: ROTULO_BUSCA })
    await userEvent.type(busca, 'Cara')
    await userEvent.click(await screen.findByRole('option', { name: /Caramelo/ }))

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(busca).toHaveValue('Caramelo')
    expect(busca).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Vincular animal' })).toBeInTheDocument()
  })

  it('busca o animal por microchip e envia o vínculo', async () => {
    buscaDevolveAnimal()
    let corpo: unknown = null
    server.use(
      http.put(`${API_BASE_URL}/ocorrencias/:id/animal`, async ({ request }) => {
        corpo = await request.json()
        return HttpResponse.json(criarOcorrenciaFixture({ animalVinculado: VINCULADO }))
      }),
    )
    renderCard(criarOcorrenciaFixture())

    await escolherAnimal('9850')

    await waitFor(() => expect(corpo).toEqual({ animalId: ANIMAL.id }))
  })

  it('mostra o animal vinculado com link para a ficha', () => {
    renderCard(criarOcorrenciaFixture({ animalVinculado: VINCULADO }))

    expect(screen.getByRole('link', { name: 'Caramelo' })).toHaveAttribute('href', '/animais/animal-1')
    expect(screen.getByRole('button', { name: 'Trocar animal' })).toBeInTheDocument()
  })

  it('para quem não acessa o módulo de animais mostra o nome sem link para a ficha', () => {
    renderCard(criarOcorrenciaFixture({ animalVinculado: VINCULADO }), true, 'agente')

    expect(screen.getByText('Caramelo')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Caramelo' })).not.toBeInTheDocument()
  })

  it('em ocorrência encerrada sem animal permite vincular uma vez, avisando que não poderá trocar', () => {
    renderCard(criarOcorrenciaFixture({ statusOcorrencia: 'ENCERRADA' }))

    expect(screen.getByText(/vinculado uma única vez e não poderá ser trocado/)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: ROTULO_BUSCA })).toBeInTheDocument()
  })

  it('em ocorrência encerrada com animal não oferece troca', () => {
    renderCard(criarOcorrenciaFixture({ statusOcorrencia: 'ENCERRADA', animalVinculado: VINCULADO }))

    expect(screen.queryByRole('button', { name: 'Trocar animal' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('sem permissão de escrita só mostra o estado', () => {
    renderCard(criarOcorrenciaFixture(), false)

    expect(screen.getByText('Nenhum animal recolhido vinculado a esta ocorrência.')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('mostra a mensagem da API quando o vínculo é recusado', async () => {
    buscaDevolveAnimal()
    server.use(
      http.put(`${API_BASE_URL}/ocorrencias/:id/animal`, () =>
        HttpResponse.json({ mensagem: 'Este animal já está vinculado a outra ocorrência.' }, { status: 409 }),
      ),
    )
    renderCard(criarOcorrenciaFixture())

    await escolherAnimal('Car')

    expect(await screen.findByText('Este animal já está vinculado a outra ocorrência.')).toBeInTheDocument()
  })
})
