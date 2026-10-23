// Top N + "Outros": evita um gráfico com dezenas de barras minúsculas.
const TOP_N_BAIRROS = 15
const ROTULO_OUTROS = 'Outros'

export interface BairroDatum {
  bairro: string
  quantidade: number
}

// `bairro` é texto livre (sem catálogo) — grafias diferentes da mesma
// região (ex. "São Luiz" vs. "Sao Luiz", ou maiúsculas/espaços) são
// agrupadas pela CHAVE normalizada (trim + minúsculo + sem acento); o
// RÓTULO exibido continua sendo a grafia mais frequente do grupo, nunca
// uma forma "corrigida" inventada.
function normalizarChave(bairro: string): string {
  return bairro
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

// Núcleo compartilhado entre o gráfico (com corte Top N) e a lista de
// sugestões do formulário (sem corte, precisa de todo mundo).
function agruparBairros(ocorrencias: { bairro: string }[]): BairroDatum[] {
  const quantidadePorChave = new Map<string, number>()
  const rotulosPorChave = new Map<string, Map<string, number>>()

  for (const ocorrencia of ocorrencias) {
    const bairro = ocorrencia.bairro?.trim()
    if (!bairro) continue

    const chave = normalizarChave(bairro)
    quantidadePorChave.set(chave, (quantidadePorChave.get(chave) ?? 0) + 1)

    const rotulos = rotulosPorChave.get(chave) ?? new Map<string, number>()
    rotulos.set(bairro, (rotulos.get(bairro) ?? 0) + 1)
    rotulosPorChave.set(chave, rotulos)
  }

  return [...quantidadePorChave.entries()].map(([chave, quantidade]) => {
    const rotulos = rotulosPorChave.get(chave) as Map<string, number>
    const [rotuloMaisFrequente] = [...rotulos.entries()].sort((a, b) => b[1] - a[1])[0]
    return { bairro: rotuloMaisFrequente, quantidade }
  })
}

export function mapearOcorrenciasPorBairro(ocorrencias: { bairro: string }[]): BairroDatum[] {
  const agrupado = agruparBairros(ocorrencias)
  agrupado.sort((a, b) => b.quantidade - a.quantidade)

  if (agrupado.length <= TOP_N_BAIRROS) return agrupado

  const principais = agrupado.slice(0, TOP_N_BAIRROS)
  const somaOutros = agrupado.slice(TOP_N_BAIRROS).reduce((soma, item) => soma + item.quantidade, 0)
  return [...principais, { bairro: ROTULO_OUTROS, quantidade: somaOutros }]
}

// Para sugestão de preenchimento (datalist do formulário de ocorrência):
// todas as grafias distintas (sem corte Top N — aqui não é gráfico, é lista
// de opções), uma por grupo (a grafia mais frequente, mesma regra acima),
// em ordem alfabética.
export function extrairBairrosDistintos(ocorrencias: { bairro: string }[]): string[] {
  return agruparBairros(ocorrencias)
    .map((item) => item.bairro)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
