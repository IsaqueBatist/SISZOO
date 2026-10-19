import { http } from '@/lib/http'
import { listarAnimais } from '@/features/animais/api/animaisApi'
import { animalSobCustodia } from '@/features/animais/utils/statusCustodia'
import { listarOcorrencias } from '@/features/ocorrencias/api/ocorrenciasApi'
import type { DashboardKpis, KpiAnimais, KpiOcorrencias } from '../types/dashboard.types'

// Paliativos: GET /animais e GET /ocorrencias não têm filtro de servidor que
// resolva isso numa única chamada barata (sem status "ativo" agregável no
// primeiro caso, sem filtro de data no segundo — pedido registrado em
// docs/contratos/ocorrencias-filtro-data.md). `tamanho` grande o bastante
// para cobrir o volume do CCZ hoje, até existirem esses filtros.
const LIMITE_ANIMAIS_KPI = 1000
const LIMITE_OCORRENCIAS_KPI = 500

// "Hoje" no fuso fixo do projeto (America/São_Paulo) — nunca
// `toISOString()`/`toDateString()`, que usam o fuso local do navegador ou
// UTC e mudam de dia cedo demais/tarde demais em relação ao horário real do
// CCZ (ex.: 22h em SP ainda é o mesmo dia local, mas já é o dia seguinte em
// UTC).
function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

function horaAtualEmSaoPaulo(): number {
  return Number(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date()),
  )
}

async function buscarKpiAnimais(): Promise<KpiAnimais> {
  const pagina = await listarAnimais({ pagina: 0, tamanho: LIMITE_ANIMAIS_KPI })
  // GET /animais sem filtro de status devolve todo mundo, inclusive
  // adotados/óbitos/transferidos — "Total de Animais" é sobre quem está no
  // canil hoje, não o histórico completo.
  const sobCustodia = pagina.itens.filter(animalSobCustodia)
  return {
    total: sobCustodia.length,
    caninos: sobCustodia.filter((animal) => animal.especieCodigo === 'canino').length,
    felinos: sobCustodia.filter((animal) => animal.especieCodigo === 'felino').length,
  }
}

async function buscarKpiOcorrencias(): Promise<KpiOcorrencias> {
  const hoje = hojeEmSaoPaulo()
  const pagina = await listarOcorrencias({ pagina: 0, tamanho: LIMITE_OCORRENCIAS_KPI })
  const registradasHoje = pagina.itens.filter((ocorrencia) => ocorrencia.dataAbertura === hoje)
  const horasDecorridas = horaAtualEmSaoPaulo()
  return {
    registradasHoje: registradasHoje.length,
    mediaPorHora: horasDecorridas > 0 ? Math.round((registradasHoje.length / horasDecorridas) * 10) / 10 : undefined,
  }
}

// Sempre real, independente de VITE_USE_MOCK_KPIS: usa endpoints que já
// existem em produção (GET /animais, GET /ocorrencias), diferente de
// vacinacao/adocoes abaixo, que dependem de um endpoint que não existe.
export async function buscarKpisParciaisReais(): Promise<Pick<DashboardKpis, 'animais' | 'ocorrencias'>> {
  const [animais, ocorrencias] = await Promise.all([buscarKpiAnimais(), buscarKpiOcorrencias()])
  return { animais, ocorrencias }
}

// Lido pela UI (Dashboard.tsx) para decidir se mostra o selo "Dados de
// demonstração" nos cards de Vacinados/Adoções — os únicos que continuam
// mockados. É uma função (não uma constante congelada no import) de
// propósito: assim `vi.stubEnv` nos testes troca o comportamento sem
// precisar de `vi.resetModules()` (que arriscaria duplicar a instância do
// React no mesmo arquivo de teste). Não é usada para decidir o import()
// dinâmico do mock — ver `buscarVacinacaoEAdocoes` abaixo, que mantém a
// condição literal.
export function vacinacaoEAdocoesUsamMock(): boolean {
  return import.meta.env.VITE_USE_MOCK_KPIS !== 'false'
}

async function buscarVacinacaoEAdocoes(): Promise<Pick<DashboardKpis, 'vacinacao' | 'adocoes'>> {
  // Condição literal e INLINE (não uma constante/função importada): é o que
  // permite ao Rollup podar o chunk de dashboardApi.mock.ts do bundle de
  // produção quando a flag é 'false' em build time.
  if (import.meta.env.VITE_USE_MOCK_KPIS !== 'false') {
    const { buscarVacinacaoEAdocoesMock } = await import('./dashboardApi.mock')
    return buscarVacinacaoEAdocoesMock()
  }
  const { data } = await http.get<DashboardKpis>('/dashboard/kpis')
  return { vacinacao: data.vacinacao, adocoes: data.adocoes }
}

export async function getKpisDashboard(): Promise<DashboardKpis> {
  const [parciaisReais, vacinacaoEAdocoes] = await Promise.all([
    buscarKpisParciaisReais(),
    buscarVacinacaoEAdocoes(),
  ])
  return { ...parciaisReais, ...vacinacaoEAdocoes }
}
