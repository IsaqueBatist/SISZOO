import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider, SESSION_STORAGE_KEY } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import {
  OCORRENCIA_ABERTA_ID,
  OCORRENCIA_ENCERRADA_ID,
  OCORRENCIA_PROCESSO_PENDENTE_ID,
} from '@/mocks/ocorrenciasFixtures'
import { PROCESSO_CRIADO_ID, processoCriadoFixture } from '@/mocks/processosFixtures'
import { CadastrarProcesso } from './CadastrarProcesso'

const ADMIN = ['Administrador']
const AGENTE = ['Agente Sanitário']
const VET = ['Veterinário']
const REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'

type Usuario_ = ReturnType<typeof userEvent.setup>

function DestinoProcesso() {
  const { id } = useParams()
  return <div>Detalhe do processo {id}</div>
}

function DestinoOcorrencia() {
  const { id } = useParams()
  return <div>Detalhe da ocorrência {id}</div>
}

function renderCadastrar(initialEntry = '/processos/novo', cargos = ADMIN) {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000099',
    nome: 'Ana',
    sobrenome: 'Silva',
    email: 'ana.silva@itu.sp.gov.br',
    cargos,
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-existente', usuario }))
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/ocorrencias/:id" element={<DestinoOcorrencia />} />
            <Route path="/processos" element={<div>Lista de processos</div>} />
            <Route path="/processos/novo" element={<CadastrarProcesso />} />
            <Route path="/processos/:id" element={<DestinoProcesso />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// Captura o corpo do POST /processos e devolve a fixture criada.
function capturarCriacao() {
  const corpos: unknown[] = []
  server.use(
    http.post(`${API_BASE_URL}/processos`, async ({ request }) => {
      corpos.push(await request.json())
      return HttpResponse.json(processoCriadoFixture())
    }),
  )
  return corpos
}

function paneDoStep(regex: RegExp) {
  const titulo = screen.getByText(regex)
  return within(titulo.closest('.card') as HTMLElement)
}

async function escolherDoencaELaboratorio(user: Usuario_) {
  await user.selectOptions(await screen.findByLabelText(/Tipo de doença investigada/i), await screen.findByRole('option', { name: 'Raiva' }))
  await user.selectOptions(screen.getByLabelText(/Laboratório de destino/i), screen.getByRole('option', { name: 'Pasteur — SP' }))
}

async function preencherEtapa1SemVinculoEAvancar(user: Usuario_, botaoSemVinculo = 'Pular esta etapa') {
  const pane = paneDoStep(/^1\. Dados/)
  await user.click(await pane.findByRole('button', { name: botaoSemVinculo }))
  await escolherDoencaELaboratorio(user)
  await user.click(pane.getByRole('button', { name: 'Continuar →' }))
}

async function preencherEtapa2EAvancar(user: Usuario_) {
  const pane = paneDoStep(/^2\. Responsável/)
  await user.type(screen.getByLabelText(/^Nome/i), 'Maria Responsável')
  await user.click(pane.getByRole('button', { name: 'Continuar →' }))
}

async function preencherClinicoMinimo(user: Usuario_, status = 'ASSINTOMATICO') {
  await user.selectOptions(screen.getByLabelText(/Status clínico/i), status)
  await user.selectOptions(screen.getByLabelText(/Tipo de abrigo/i), 'INTRADOMICILIAR')
  await user.selectOptions(screen.getByLabelText(/Material biológico/i), 'SORO')
}

async function preencherAmostraDeCampo(user: Usuario_, status = 'ASSINTOMATICO') {
  const pane = paneDoStep(/^3\. Amostras/)
  await user.click(pane.getByRole('button', { name: 'Animal de campo' }))
  await user.selectOptions(await screen.findByLabelText(/Espécie/i), await screen.findByRole('option', { name: 'Canino' }))
  await user.selectOptions(screen.getByLabelText(/^Sexo/i), 'macho')
  await preencherClinicoMinimo(user, status)
}

async function avancarERegistrar(user: Usuario_) {
  await user.click(paneDoStep(/^3\. Amostras/).getByRole('button', { name: 'Continuar →' }))
  await user.click(paneDoStep(/^4\. Revisão/).getByRole('button', { name: /Registrar Processo Sanitário/ }))
}

describe('ProcessoForm — etapa 1 (vínculo com ocorrência)', () => {
  it('sem decisão de vínculo não avança', async () => {
    const user = userEvent.setup()
    renderCadastrar()

    await escolherDoencaELaboratorio(user)
    await user.click(paneDoStep(/^1\. Dados/).getByRole('button', { name: 'Continuar →' }))

    expect(await screen.findByText(/Selecione uma ocorrência ou clique em "Pular esta etapa"/)).toBeInTheDocument()
    expect(screen.getByText('Vínculo').closest('.step')).toHaveClass('active')
  })

  it('lista as ocorrências reais disponíveis: sem as encerradas e sem as que já têm processo (0..1, D20)', async () => {
    renderCadastrar()

    const lista = await screen.findByRole('radiogroup', { name: 'Ocorrências disponíveis para vínculo' })
    await within(lista).findByText('OC 089/2026')
    expect(within(lista).getByText('OC 090/2026')).toBeInTheDocument()
    expect(within(lista).getByText('OC 091/2026')).toBeInTheDocument()
    expect(within(lista).queryByText('OC 092/2026')).not.toBeInTheDocument()
    expect(within(lista).queryByText('OC 070/2026')).not.toBeInTheDocument()
  })

  it('não expõe o denunciante de sigilosa nem de anônima na lista (T26-9/T26-12)', async () => {
    renderCadastrar()

    const lista = await screen.findByRole('radiogroup', { name: 'Ocorrências disponíveis para vínculo' })
    const sigilosa = (await within(lista).findByText('OC 090/2026')).closest('[role="radio"]') as HTMLElement
    const anonima = within(lista).getByText('OC 091/2026').closest('[role="radio"]') as HTMLElement
    expect(within(sigilosa).getByText(/Sigiloso/)).toBeInTheDocument()
    expect(within(anonima).getByText(/Anônima/)).toBeInTheDocument()
  })

  it('a busca é enviada à API de ocorrências', async () => {
    const buscas: (string | null)[] = []
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias`, ({ request }) => {
        buscas.push(new URL(request.url).searchParams.get('q'))
        return HttpResponse.json({ itens: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0 })
      }),
    )
    const user = userEvent.setup()
    renderCadastrar()

    await user.type(await screen.findByLabelText('Buscar ocorrência'), 'Centro')

    await waitFor(() => expect(buscas).toContain('Centro'))
    expect(await screen.findByText('Nenhuma ocorrência disponível para vínculo.')).toBeInTheDocument()
  })

  it('selecionar uma ocorrência avança e trava o vínculo ao voltar', async () => {
    const user = userEvent.setup()
    renderCadastrar()

    await user.click(await screen.findByText('OC 089/2026'))
    await escolherDoencaELaboratorio(user)
    await user.click(paneDoStep(/^1\. Dados/).getByRole('button', { name: 'Continuar →' }))
    await preencherEtapa2EAvancar(user)
    await user.click(paneDoStep(/^3\. Amostras/).getByRole('button', { name: '← Voltar' }))
    await user.click(paneDoStep(/^2\. Responsável/).getByRole('button', { name: '← Voltar' }))

    const travado = screen.getByTestId('vinculo-travado')
    expect(within(travado).getByText(/OC 089\/2026/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pular esta etapa' })).not.toBeInTheDocument()
  })

  it('entrada pela ocorrência (?ocorrencia=) pré-preenche e trava o vínculo; "Voltar" volta para a ocorrência', async () => {
    const user = userEvent.setup()
    renderCadastrar(`/processos/novo?ocorrencia=${OCORRENCIA_ABERTA_ID}`, AGENTE)

    const vinculo = await screen.findByTestId('vinculo-travado')
    expect(within(vinculo).getByText(/OC 089\/2026/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pular esta etapa' })).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('link', { name: '← Voltar' })[0])
    expect(await screen.findByText(`Detalhe da ocorrência ${OCORRENCIA_ABERTA_ID}`)).toBeInTheDocument()
  })

  it.each([
    ['já tem processo', OCORRENCIA_PROCESSO_PENDENTE_ID, /já tem o processo PS 045\/2026 vinculado/],
    ['está encerrada', OCORRENCIA_ENCERRADA_ID, /está encerrada e não aceita processo vinculado/],
  ])('?ocorrencia= de ocorrência que %s mostra o motivo, sem abrir o wizard', async (_caso, id, motivo) => {
    renderCadastrar(`/processos/novo?ocorrencia=${id}`)

    expect(await screen.findByText(motivo)).toBeInTheDocument()
    expect(screen.queryByText(/^1\. Dados/)).not.toBeInTheDocument()
  })

  it('Veterinário: sem lista de ocorrências (sem acesso ao módulo, V11/D33) e com "Continuar sem vínculo"', async () => {
    let listagens = 0
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias`, () => {
        listagens += 1
        return HttpResponse.json({ itens: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0 })
      }),
    )
    const user = userEvent.setup()
    renderCadastrar('/processos/novo', VET)

    expect(await screen.findByText(/exige permissão de escrita em ocorrências e denúncias/)).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Ocorrências disponíveis para vínculo' })).not.toBeInTheDocument()
    await preencherEtapa1SemVinculoEAvancar(user, 'Continuar sem vínculo')
    expect(screen.getByText('Responsável').closest('.step')).toHaveClass('active')
    expect(listagens).toBe(0)
  })

  it('Veterinário com ?ocorrencia= recebe o motivo e não carrega a ocorrência', async () => {
    let detalhes = 0
    server.use(
      http.get(`${API_BASE_URL}/ocorrencias/:id`, () => {
        detalhes += 1
        return HttpResponse.json({}, { status: 403 })
      }),
    )
    renderCadastrar(`/processos/novo?ocorrencia=${OCORRENCIA_ABERTA_ID}`, VET)

    expect(await screen.findByText(/exige permissão de escrita em ocorrências e denúncias/)).toBeInTheDocument()
    expect(detalhes).toBe(0)
  })
})

describe('ProcessoForm — amostras e envio', () => {
  it('cada etapa bloqueia avanço com campo obrigatório vazio', async () => {
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1SemVinculoEAvancar(user)

    await user.click(paneDoStep(/^2\. Responsável/).getByRole('button', { name: 'Continuar →' }))

    expect(await screen.findByText('Informe o nome do responsável.')).toBeInTheDocument()
    expect(screen.getByText('Responsável').closest('.step')).toHaveClass('active')
  })

  it('envia o processo completo no contrato da API (amostra de campo) e abre o processo criado', async () => {
    const corpos = capturarCriacao()
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1SemVinculoEAvancar(user)
    await preencherEtapa2EAvancar(user)
    await preencherAmostraDeCampo(user)
    await user.type(screen.getByLabelText(/Raça/i), 'SRD')
    await user.type(screen.getByLabelText(/Peso \(kg\)/i), '12.5')

    await avancarERegistrar(user)

    expect(await screen.findByText(`Detalhe do processo ${PROCESSO_CRIADO_ID}`)).toBeInTheDocument()
    expect(corpos).toHaveLength(1)
    expect(corpos[0]).toEqual({
      dataAbertura: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      doenca: 'raiva',
      laboratorio: 'pasteur_sp',
      ocorrenciaId: null,
      responsavel: { nome: 'Maria Responsável' },
      amostras: [
        {
          especie: 'canino',
          sexo: 'macho',
          raca: 'SRD',
          pesoKg: 12.5,
          statusClinico: 'ASSINTOMATICO',
          tipoAbrigo: 'INTRADOMICILIAR',
          dataColeta: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          materialBiologico: 'SORO',
          contatoHumano: false,
          sintomas: [],
        },
      ],
    })
  })

  it('amostra do animal do canil envia só o animalId, sem a identificação do modo abandonado (DH-5)', async () => {
    const corpos = capturarCriacao()
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1SemVinculoEAvancar(user)
    await preencherEtapa2EAvancar(user)
    // Preenche o modo "animal de campo" e troca para "Já cadastrado".
    await preencherAmostraDeCampo(user)
    const pane = paneDoStep(/^3\. Amostras/)
    await user.click(pane.getByRole('button', { name: 'Já cadastrado' }))
    await user.type(pane.getByLabelText(/Buscar animal do canil/i), 'Rex')
    await user.click(await pane.findByText('Rex'))
    expect(await pane.findByText(/copiados da ficha ao registrar/)).toBeInTheDocument()

    await avancarERegistrar(user)

    await waitFor(() => expect(corpos).toHaveLength(1))
    const amostra = (corpos[0] as { amostras: Record<string, unknown>[] }).amostras[0]
    expect(amostra.animalId).toBe(REX_ID)
    for (const campo of ['especie', 'sexo', 'raca', 'coloracao', 'pelagem', 'idadeAprox', 'pesoKg', 'origem', 'animalDescricao']) {
      expect(amostra).not.toHaveProperty(campo)
    }
  })

  it('vinculado pela ocorrência, envia o ocorrenciaId', async () => {
    const corpos = capturarCriacao()
    const user = userEvent.setup()
    renderCadastrar(`/processos/novo?ocorrencia=${OCORRENCIA_ABERTA_ID}`)
    await screen.findByTestId('vinculo-travado')
    await escolherDoencaELaboratorio(user)
    await user.click(paneDoStep(/^1\. Dados/).getByRole('button', { name: 'Continuar →' }))
    await preencherEtapa2EAvancar(user)
    await preencherAmostraDeCampo(user)

    await avancarERegistrar(user)

    await waitFor(() => expect(corpos).toHaveLength(1))
    expect((corpos[0] as { ocorrenciaId: string }).ocorrenciaId).toBe(OCORRENCIA_ABERTA_ID)
  })

  it('sintomas vêm do catálogo e só aparecem em amostra sintomática; sair de SINTOMATICO descarta os marcados (T29-3)', async () => {
    const corpos = capturarCriacao()
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1SemVinculoEAvancar(user)
    await preencherEtapa2EAvancar(user)
    await preencherAmostraDeCampo(user, 'SINTOMATICO')

    const sintomas = await screen.findByRole('group', { name: 'Sintomas do animal amostrado 1' })
    await user.click(within(sintomas).getByLabelText('Apatia'))

    await user.selectOptions(screen.getByLabelText(/Status clínico/i), 'ASSINTOMATICO')
    expect(screen.queryByRole('group', { name: 'Sintomas do animal amostrado 1' })).not.toBeInTheDocument()
    expect(screen.getByText(/apenas em amostra com status clínico sintomático/)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/Status clínico/i), 'SINTOMATICO')
    expect(within(await screen.findByRole('group', { name: 'Sintomas do animal amostrado 1' })).getByLabelText('Apatia')).not.toBeChecked()
    await user.click(screen.getByLabelText('Coriza'))

    await avancarERegistrar(user)

    await waitFor(() => expect(corpos).toHaveLength(1))
    const amostra = (corpos[0] as { amostras: Record<string, unknown>[] }).amostras[0]
    expect(amostra.statusClinico).toBe('SINTOMATICO')
    expect(amostra.sintomas).toEqual(['coriza'])
  })

  it('contato humano: aviso de urgência sem regra inventada; nível e agressão obrigatórios e enviados (regra 18)', async () => {
    const corpos = capturarCriacao()
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1SemVinculoEAvancar(user)
    await preencherEtapa2EAvancar(user)
    await preencherAmostraDeCampo(user)

    await user.click(screen.getByLabelText('Contato humano-animal'))
    expect(await screen.findByText(/ATENÇÃO — CONTATO HUMANO-ANIMAL/)).toBeInTheDocument()
    expect(screen.getByText('Este processo será marcado como urgente.')).toBeInTheDocument()
    expect(screen.queryByText(/Resultado laboratorial será obrigatório/)).not.toBeInTheDocument()

    await user.click(paneDoStep(/^3\. Amostras/).getByRole('button', { name: 'Continuar →' }))
    expect(await screen.findByText('Informe o nível de contato.')).toBeInTheDocument()
    expect(screen.getByText('Informe se o animal agrediu o munícipe.')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Indireta'))
    await user.click(within(screen.getByRole('radiogroup', { name: 'Animal agrediu o munícipe' })).getByLabelText('Não'))
    await avancarERegistrar(user)

    await waitFor(() => expect(corpos).toHaveLength(1))
    const amostra = (corpos[0] as { amostras: Record<string, unknown>[] }).amostras[0]
    expect(amostra).toMatchObject({ contatoHumano: true, nivelContato: 'INDIRETA', agrediuHumano: false })
  })

  it('data de coleta futura bloqueia o avanço com mensagem', async () => {
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1SemVinculoEAvancar(user)
    await preencherEtapa2EAvancar(user)
    await preencherAmostraDeCampo(user)

    const data = screen.getByLabelText(/Data de coleta/i)
    await user.clear(data)
    await user.type(data, '2999-01-01')
    await user.click(paneDoStep(/^3\. Amostras/).getByRole('button', { name: 'Continuar →' }))

    expect(await screen.findByText('A data de coleta não pode ser uma data futura.')).toBeInTheDocument()
  })

  it('recusa do servidor (422) mostra a mensagem e os campos recusados, sem sair do wizard', async () => {
    server.use(
      http.post(`${API_BASE_URL}/processos`, () =>
        HttpResponse.json(
          { mensagem: 'Dados invalidos', campos: [{ campo: 'amostras[0].especie', mensagem: 'Especie invalida' }] },
          { status: 422 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1SemVinculoEAvancar(user)
    await preencherEtapa2EAvancar(user)
    await preencherAmostraDeCampo(user)

    await avancarERegistrar(user)

    expect(await screen.findByText('Dados invalidos: amostras[0].especie — Especie invalida')).toBeInTheDocument()
    expect(screen.getByText('Revisão').closest('.step')).toHaveClass('active')
  })

  it('vínculo recusado no envio (409, ocorrência já vinculada) mostra a mensagem do servidor', async () => {
    server.use(
      http.post(`${API_BASE_URL}/processos`, () =>
        HttpResponse.json({ mensagem: 'Ocorrencia ou processo ja possui vinculo' }, { status: 409 }),
      ),
    )
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1SemVinculoEAvancar(user)
    await preencherEtapa2EAvancar(user)
    await preencherAmostraDeCampo(user)

    await avancarERegistrar(user)

    expect(await screen.findByText('Ocorrencia ou processo ja possui vinculo')).toBeInTheDocument()
  })

  it('revisão mostra os nomes dos catálogos e não oferece edição da etapa 1', async () => {
    const user = userEvent.setup()
    renderCadastrar()
    await preencherEtapa1SemVinculoEAvancar(user)
    await preencherEtapa2EAvancar(user)
    await preencherAmostraDeCampo(user)
    await user.click(paneDoStep(/^3\. Amostras/).getByRole('button', { name: 'Continuar →' }))

    const revisao = paneDoStep(/^4\. Revisão/)
    expect(revisao.getAllByRole('button', { name: 'Editar' })).toHaveLength(2)
    expect(revisao.getByText('Sem vínculo')).toBeInTheDocument()
    expect(revisao.getByText('Raiva')).toBeInTheDocument()
    expect(revisao.getByText('Pasteur — SP')).toBeInTheDocument()
    expect(revisao.getByText('Canino · Macho')).toBeInTheDocument()
  })
})
