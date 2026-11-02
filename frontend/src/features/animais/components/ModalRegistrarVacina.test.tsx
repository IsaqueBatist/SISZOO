import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Toasts } from '@/components/toast/Toasts'
import { AuthProvider, definirSessaoEmMemoria } from '@/features/auth/hooks/AuthContext'
import type { Usuario } from '@/features/auth/types/auth.types'
import { API_BASE_URL } from '@/lib/env'
import { server } from '@/mocks/server'
import { adicionarDiasIso } from '@/test/datas'
import type { CatalogosAnimal } from '../types/animais.types'
import { AbaVacinas } from './AbaVacinas'
import { hojeEmItu } from '../utils/regrasVacina'

const REX_ID = 'b2c3d4e5-0000-0000-0000-000000000001'

// Catálogo mínimo para os cenários que sobrescrevem GET /animais/catalogos.
const CATALOGO_BASE: CatalogosAnimal = {
  especies: [],
  status: [],
  motivosEntrada: [],
  tiposBaia: [],
  vacinas: [{ codigo: 'antirrabica', nome: 'Antirrábica', intervaloMeses: 12 }],
  tiposProcedimento: [],
  condicoesSaude: [],
}

function renderAba() {
  const usuario: Usuario = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nome: 'Stéphanie',
    sobrenome: 'Lima',
    email: 'stephanie.lima@itu.sp.gov.br',
    cargos: ['Administrador'],
    senhaAlteradaEm: '2026-01-10T12:00:00Z',
  }
  definirSessaoEmMemoria({ token: 'token-existente', usuario })

  // Sem retry: o teste de erro do catálogo mostra a falha na primeira resposta.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
          <AuthProvider>
            <AbaVacinas animalId={REX_ID} onRegistroCriado={() => {}} />
          </AuthProvider>
      </MemoryRouter>
      <Toasts />
    </QueryClientProvider>,
  )
}

// Espiona o POST sem substituir o handler padrão: o resolver só registra o
// corpo e não devolve resposta, então o MSW segue para o handler de
// mocks/handlers.ts (clone(): o corpo continua legível por ele).
function espionarPostDeVacinacao(): unknown[] {
  const corpos: unknown[] = []
  server.use(
    http.post(`${API_BASE_URL}/vacinacoes`, async ({ request }) => {
      corpos.push(await request.clone().json())
    }),
  )
  return corpos
}

async function abrirModalDeRegistro(user: ReturnType<typeof userEvent.setup>, opcaoEsperada = 'Antirrábica') {
  renderAba()
  await screen.findByText('V10')
  await user.click(screen.getByRole('button', { name: /registrar vacina/i }))
  const modal = screen.getByRole('heading', { name: 'Registrar vacina' }).closest<HTMLElement>('.modal')
  if (!modal) throw new Error('modal não encontrado')
  // O select do catálogo só aparece depois de GET /animais/catalogos.
  await within(modal).findByRole('option', { name: opcaoEsperada })
  return modal
}

// Preenche todos os obrigatórios, exceto a unidade da dose.
async function preencherObrigatoriosSemUnidade(
  user: ReturnType<typeof userEvent.setup>,
  modal: HTMLElement,
  dataAplicacao: string,
) {
  await user.selectOptions(within(modal).getByLabelText(/^vacina/i), 'antirrabica')
  await user.type(within(modal).getByLabelText(/data de aplicação/i), dataAplicacao)
  await user.type(within(modal).getByLabelText(/quantidade da dose/i), '1')
}

describe('ModalRegistrarVacina — validação', () => {
  it('[RN-C05] sem unidade não envia; com a unidade selecionada envia uma vez com doseUnidade', async () => {
    const user = userEvent.setup()
    const corposEnviados = espionarPostDeVacinacao()
    const modal = await abrirModalDeRegistro(user)
    await preencherObrigatoriosSemUnidade(user, modal, hojeEmItu())

    await user.click(within(modal).getByRole('button', { name: /^registrar vacina$/i }))

    expect(await within(modal).findByText('Selecione a unidade da dose.')).toBeInTheDocument()
    expect(within(modal).getByLabelText(/^unidade/i)).toHaveClass('error')
    expect(corposEnviados).toHaveLength(0)

    // Controle: só a unidade faltava; com ela o mesmo formulário é enviado.
    await user.selectOptions(within(modal).getByLabelText(/^unidade/i), 'MILILITRO')
    await user.click(within(modal).getByRole('button', { name: /^registrar vacina$/i }))

    await waitFor(() => expect(corposEnviados).toHaveLength(1))
    expect(corposEnviados[0]).toMatchObject({ doseUnidade: 'MILILITRO', dataAplicacao: hojeEmItu() })
  })

  it('[RN-C06] bloqueia data de aplicação futura no formulário, sem enviar', async () => {
    const user = userEvent.setup()
    const corposEnviados = espionarPostDeVacinacao()
    const modal = await abrirModalDeRegistro(user)
    await preencherObrigatoriosSemUnidade(user, modal, adicionarDiasIso(hojeEmItu(), 1))
    await user.selectOptions(within(modal).getByLabelText(/^unidade/i), 'MILILITRO')

    await user.click(within(modal).getByRole('button', { name: /^registrar vacina$/i }))

    expect(await within(modal).findByText('A data de aplicação não pode ser futura.')).toBeInTheDocument()
    expect(within(modal).getByLabelText(/data de aplicação/i)).toHaveAttribute('max', hojeEmItu())
    expect(corposEnviados).toHaveLength(0)
  })

  it('exibe a mensagem de regra devolvida pela API (422) em vez do texto genérico', async () => {
    server.use(
      http.post(`${API_BASE_URL}/vacinacoes`, () =>
        HttpResponse.json({ mensagem: 'A data de aplicação não pode ser futura.' }, { status: 422 }),
      ),
    )
    const user = userEvent.setup()
    const modal = await abrirModalDeRegistro(user)
    // Data válida no cliente: simula o servidor recusando (ex.: relógio do
    // navegador adiantado em relação ao do backend).
    await preencherObrigatoriosSemUnidade(user, modal, hojeEmItu())
    await user.selectOptions(within(modal).getByLabelText(/^unidade/i), 'MILILITRO')

    await user.click(within(modal).getByRole('button', { name: /^registrar vacina$/i }))

    expect(await within(modal).findByRole('alert')).toHaveTextContent('A data de aplicação não pode ser futura.')
    expect(within(modal).queryByText(/não foi possível registrar/i)).not.toBeInTheDocument()
  })
})

describe('ModalRegistrarVacina — retifica', () => {
  it('corrige uma vacinação existente sem alterar o original, deixando o número da dose em branco', async () => {
    const user = userEvent.setup()
    renderAba()

    const linhaOriginal = (await screen.findByText('V10')).closest('tr')
    if (!linhaOriginal) throw new Error('linha não encontrada')
    await user.click(within(linhaOriginal).getByRole('button', { name: /corrigir/i }))

    const modal = screen.getByRole('heading', { name: 'Corrigir vacinação' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    // O select do catálogo só aparece depois de GET /animais/catalogos.
    await within(modal).findByRole('option', { name: 'Antirrábica' })
    expect(within(modal).getByText(/o registro original não será alterado/i)).toBeInTheDocument()
    // O código gravado no registro original continua selecionado com o
    // catálogo vindo da API (mesmos códigos da V5 que os rascunhos guardam).
    expect(within(modal).getByLabelText(/^vacina/i)).toHaveValue('v10')
    expect(within(modal).getByLabelText(/número da dose/i)).toHaveValue(1)

    // Número da dose é opcional: apagar o valor não pode travar o submit.
    await user.clear(within(modal).getByLabelText(/número da dose/i))
    await user.clear(within(modal).getByLabelText(/^lote/i))
    await user.type(within(modal).getByLabelText(/^lote/i), 'LOTE-99')
    await user.click(within(modal).getByRole('button', { name: /^salvar correção$/i }))

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Corrigir vacinação' })).not.toBeInTheDocument())

    const linhasV10 = await waitFor(() => {
      const linhas = screen.getAllByText('V10').map((celula) => celula.closest('tr'))
      expect(linhas).toHaveLength(2)
      return linhas
    })
    const comBadgeRetificado = linhasV10.filter(
      (linha): linha is HTMLTableRowElement => linha !== null && within(linha).queryByText('Retificado') !== null,
    )
    expect(comBadgeRetificado).toHaveLength(1)
  })
})

describe('ModalRegistrarVacina — catálogo de vacinas da API', () => {
  async function abrirSemEsperarCatalogo(user: ReturnType<typeof userEvent.setup>) {
    renderAba()
    await screen.findByText('V10')
    await user.click(screen.getByRole('button', { name: /registrar vacina/i }))
    const modal = screen.getByRole('heading', { name: 'Registrar vacina' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    return modal
  }

  it('enquanto o catálogo carrega, o select fica desabilitado e o envio bloqueado', async () => {
    server.use(
      http.get(`${API_BASE_URL}/animais/catalogos`, async () => {
        await delay(300)
        return HttpResponse.json({ ...CATALOGO_BASE, vacinas: [{ codigo: 'antirrabica', nome: 'Antirrábica', intervaloMeses: 12 }] })
      }),
    )
    const user = userEvent.setup()
    const modal = await abrirSemEsperarCatalogo(user)

    expect(within(modal).getByLabelText(/^vacina/i)).toBeDisabled()
    expect(within(modal).getByRole('option', { name: 'Carregando…' })).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: /^registrar vacina$/i })).toBeDisabled()

    expect(await within(modal).findByRole('option', { name: 'Antirrábica' })).toBeInTheDocument()
    expect(within(modal).getByLabelText(/^vacina/i)).toBeEnabled()
    expect(within(modal).getByRole('button', { name: /^registrar vacina$/i })).toBeEnabled()
  })

  it('falha ao carregar mostra o erro com "Tentar novamente" e bloqueia o envio até recuperar', async () => {
    let chamadas = 0
    server.use(
      http.get(`${API_BASE_URL}/animais/catalogos`, () => {
        chamadas += 1
        if (chamadas === 1) return HttpResponse.json({ mensagem: 'Erro interno' }, { status: 500 })
        return HttpResponse.json(CATALOGO_BASE)
      }),
    )
    const user = userEvent.setup()
    const modal = await abrirSemEsperarCatalogo(user)

    expect(await within(modal).findByText('Não foi possível carregar as opções.')).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: /^registrar vacina$/i })).toBeDisabled()

    await user.click(within(modal).getByRole('button', { name: 'Tentar novamente' }))

    expect(await within(modal).findByRole('option', { name: 'Antirrábica' })).toBeInTheDocument()
    expect(within(modal).queryByText('Não foi possível carregar as opções.')).not.toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: /^registrar vacina$/i })).toBeEnabled()
  })

  it('catálogo vazio informa que não há opção cadastrada e não permite enviar', async () => {
    server.use(http.get(`${API_BASE_URL}/animais/catalogos`, () => HttpResponse.json({ ...CATALOGO_BASE, vacinas: [] })))
    const user = userEvent.setup()
    const modal = await abrirSemEsperarCatalogo(user)

    expect(await within(modal).findByText('Nenhuma opção cadastrada.')).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: /^registrar vacina$/i })).toBeDisabled()
  })
})

describe('ModalRegistrarVacina — previsão do próximo reforço', () => {
  // É o que explica de onde sai o alerta de vacina vencendo. A conta tem de ser
  // a mesma do servidor, senão a previsão divergiria da data que a tabela
  // mostra depois de salvar.
  it('mostra a data do próximo reforço com o intervalo da vacina escolhida', async () => {
    const user = userEvent.setup()
    const modal = await abrirModalDeRegistro(user)

    await user.selectOptions(within(modal).getByLabelText(/^vacina/i), 'antirrabica')
    await user.type(within(modal).getByLabelText(/data de aplicação/i), '2026-03-10')

    expect(await within(modal).findByText(/próximo reforço: 10\/03\/2027/i)).toBeInTheDocument()
    expect(within(modal).getByText(/intervalo de 12 meses/i)).toBeInTheDocument()
  })

  it('não mostra previsão enquanto falta a data', async () => {
    const user = userEvent.setup()
    const modal = await abrirModalDeRegistro(user)

    await user.selectOptions(within(modal).getByLabelText(/^vacina/i), 'antirrabica')

    expect(within(modal).queryByText(/próximo reforço/i)).not.toBeInTheDocument()
  })

  it('avisa que a vacina sem intervalo não gera alerta', async () => {
    server.use(
      http.get(`${API_BASE_URL}/animais/catalogos`, () =>
        HttpResponse.json({
          ...CATALOGO_BASE,
          vacinas: [{ codigo: 'sem_reforco', nome: 'Sem Reforço', intervaloMeses: null }],
        }),
      ),
    )
    const user = userEvent.setup()
    const modal = await abrirModalDeRegistro(user, 'Sem Reforço')

    await user.selectOptions(within(modal).getByLabelText(/^vacina/i), 'sem_reforco')
    await user.type(within(modal).getByLabelText(/data de aplicação/i), '2026-03-10')

    expect(await within(modal).findByText(/não tem intervalo de reforço/i)).toBeInTheDocument()
    expect(within(modal).queryByText(/próximo reforço/i)).not.toBeInTheDocument()
  })
})

describe('ModalRegistrarVacina — cadastro rápido pelo "+"', () => {
  // Cadastra sem sair do registro: o que já foi digitado não corre risco, e a
  // vacina nova já entra escolhida (mesmo caminho da categoria em
  // Medicamentos.tsx).
  it('cadastra a vacina sem sair do modal e já a deixa escolhida', async () => {
    const user = userEvent.setup()
    const modal = await abrirModalDeRegistro(user)

    await user.click(within(modal).getByRole('button', { name: /cadastrar nova vacina/i }))
    await user.type(within(modal).getByLabelText(/^nome/i), 'Vacina Nova Teste')
    await user.type(within(modal).getByLabelText(/intervalo de reforço/i), '24')
    await user.click(within(modal).getByRole('button', { name: /^cadastrar vacina$/i }))

    // O select lê o catálogo, que a mutação invalida: a opção nova tem de
    // existir e estar selecionada quando o cadastro volta.
    const select = within(modal).getByLabelText(/^vacina/i) as HTMLSelectElement
    await waitFor(() => expect(select.value).toBe('vacina_nova_teste'))
    expect(within(modal).getByRole('option', { name: 'Vacina Nova Teste' })).toBeInTheDocument()

    // E a previsão passa a usar o intervalo recém-cadastrado.
    await user.type(within(modal).getByLabelText(/data de aplicação/i), '2026-03-10')
    expect(await within(modal).findByText(/próximo reforço: 10\/03\/2028/i)).toBeInTheDocument()
  })

  it('mostra o motivo quando o nome colide com uma vacina existente', async () => {
    const user = userEvent.setup()
    const modal = await abrirModalDeRegistro(user)

    await user.click(within(modal).getByRole('button', { name: /cadastrar nova vacina/i }))
    await user.type(within(modal).getByLabelText(/^nome/i), 'Antirrábica')
    await user.click(within(modal).getByRole('button', { name: /^cadastrar vacina$/i }))

    expect(await within(modal).findByText(/mesmo código/i)).toBeInTheDocument()
  })

  it('cancelar fecha o cadastro e devolve o "+"', async () => {
    const user = userEvent.setup()
    const modal = await abrirModalDeRegistro(user)

    await user.click(within(modal).getByRole('button', { name: /cadastrar nova vacina/i }))
    await user.click(within(modal).getByRole('button', { name: /cancelar cadastro/i }))

    expect(within(modal).queryByLabelText(/intervalo de reforço/i)).not.toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: /cadastrar nova vacina/i })).toBeInTheDocument()
  })
})

describe('AbaVacinas — registrar reforço', () => {
  // "Corrigir" não serve para lançar o reforço: criaria uma RETIFICAÇÃO, e a
  // aplicação anterior passaria a constar como se nunca tivesse valido. O
  // alerta sumiria e esconderia o estrago.
  it('oferece o reforço nas linhas vencida e a vencer, e não na que está em dia', async () => {
    renderAba()

    const linhaVencida = (await screen.findByText('V10')).closest('tr')
    const linhaAVencer = screen.getByText('Antirrábica').closest('tr')
    const linhaEmDia = screen.getByText('Giárdia').closest('tr')
    if (!linhaVencida || !linhaAVencer || !linhaEmDia) throw new Error('linhas não encontradas')

    expect(within(linhaVencida).getByRole('button', { name: /registrar reforço/i })).toBeInTheDocument()
    expect(within(linhaAVencer).getByRole('button', { name: /registrar reforço/i })).toBeInTheDocument()
    expect(within(linhaEmDia).queryByRole('button', { name: /registrar reforço/i })).not.toBeInTheDocument()
  })

  it('abre um registro novo com a vacina e a data de hoje, sem retificar', async () => {
    const user = userEvent.setup()
    const corpos = espionarPostDeVacinacao()
    renderAba()

    const linha = (await screen.findByText('V10')).closest('tr')
    if (!linha) throw new Error('linha não encontrada')
    await user.click(within(linha).getByRole('button', { name: /registrar reforço/i }))

    const modal = screen.getByRole('heading', { name: 'Registrar reforço' }).closest<HTMLElement>('.modal')
    if (!modal) throw new Error('modal não encontrado')
    await within(modal).findByRole('option', { name: 'V10' })

    expect(within(modal).getByText(/nova aplicação desta vacina/i)).toBeInTheDocument()
    expect((within(modal).getByLabelText(/^vacina/i) as HTMLSelectElement).value).toBe('v10')
    expect((within(modal).getByLabelText(/data de aplicação/i) as HTMLInputElement).value).toBe(hojeEmItu())

    await user.type(within(modal).getByLabelText(/quantidade da dose/i), '1')
    await user.selectOptions(within(modal).getByLabelText(/^unidade/i), 'MILILITRO')
    await user.click(within(modal).getByRole('button', { name: /^registrar vacina$/i }))

    // Registro independente: o reforço sucede a aplicação anterior, não a
    // corrige, por isso sem `retificaId`.
    await waitFor(() => expect(corpos).toHaveLength(1))
    expect(corpos[0]).toMatchObject({ vacina: 'v10', dataAplicacao: hojeEmItu() })
    expect(corpos[0]).not.toHaveProperty('retificaId', expect.anything())
  })

  it('"Corrigir" explica no title que não serve para nova aplicação', async () => {
    renderAba()

    const linha = (await screen.findByText('Giárdia')).closest('tr')
    if (!linha) throw new Error('linha não encontrada')

    expect(within(linha).getByRole('button', { name: /corrigir/i })).toHaveAttribute(
      'title',
      expect.stringContaining('Registrar reforço'),
    )
  })
})
