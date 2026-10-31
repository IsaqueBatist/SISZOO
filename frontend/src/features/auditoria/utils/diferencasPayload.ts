// Antes e depois de um evento de auditoria, em linhas legíveis. Os payloads são
// JSON de snapshots diferentes por entidade, então a comparação é genérica: cada
// folha vira um caminho ("responsavel.cpf", "processo.amostras.0.peso").
export interface DiferencaPayload {
  campo: string
  antes: string
  depois: string
}

const VAZIO = '—'

const ROTULOS: Record<string, string> = {
  doenca: 'Doença',
  cid: 'CID',
  laboratorio: 'Laboratório',
  observacoes: 'Observações',
  galNumero: 'Nº GAL',
  sinanNumero: 'Nº SINAN',
  urgente: 'Urgente',
  statusProcesso: 'Status',
  resultado: 'Resultado',
  dataResultado: 'Data do resultado',
  desfechoAnimal: 'Desfecho do animal',
  nome: 'Nome',
  cpf: 'CPF',
  telefone: 'Telefone',
  email: 'E-mail',
  cep: 'CEP',
  endereco: 'Endereço',
  bairroResidencial: 'Bairro residencial',
  bairroOcorrencia: 'Bairro da ocorrência',
  statusClinico: 'Status clínico',
  tipoAbrigo: 'Tipo de abrigo',
  dataColeta: 'Data de coleta',
  materialBiologico: 'Material biológico',
  contatoHumano: 'Contato humano-animal',
  nivelContato: 'Nível de contato',
  agrediuHumano: 'Agrediu o munícipe',
  alteracaoComportamental: 'Alteração comportamental',
  sobrenome: 'Sobrenome',
  crmv: 'CRMV',
  cargos: 'Perfil',
  ativo: 'Ativo',
  telefoneAlterado: 'Telefone alterado',
  senhaRedefinida: 'Senha redefinida',
  senhaAlteradaEm: 'Senha alterada em',
}

const GRUPOS: Record<string, string> = {
  responsavel: 'Responsável',
}

function lerJson(payload: string | null | undefined): unknown {
  if (!payload) return null
  try {
    return JSON.parse(payload) as unknown
  } catch {
    return null
  }
}

function achatar(valor: unknown, prefixo: string, saida: Map<string, unknown>) {
  if (Array.isArray(valor) && valor.every((item) => typeof item !== 'object' || item === null)) {
    saida.set(prefixo, valor.join(', '))
  } else if (typeof valor === 'object' && valor !== null) {
    for (const [chave, filho] of Object.entries(valor)) {
      achatar(filho, prefixo ? `${prefixo}.${chave}` : chave, saida)
    }
  } else {
    saida.set(prefixo, valor)
  }
}

function folhas(payload: string | null | undefined): Map<string, unknown> {
  const saida = new Map<string, unknown>()
  achatar(lerJson(payload), '', saida)
  saida.delete('')
  return saida
}

function textoDe(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return VAZIO
  if (valor === true) return 'Sim'
  if (valor === false) return 'Não'
  return String(valor)
}

function rotuloDe(caminho: string): string {
  const partes = caminho.split('.').filter((parte) => parte !== 'processo')
  const folha = partes[partes.length - 1]
  const rotulo = ROTULOS[folha] ?? folha
  const amostra = partes.indexOf('amostras')
  if (amostra >= 0) return `Amostra ${Number(partes[amostra + 1]) + 1} · ${rotulo}`
  const grupo = GRUPOS[partes[0]]
  return grupo ? `${grupo} · ${rotulo}` : rotulo
}

// Em amostras, `id`, `sintomas.N.codigo` e afins não dizem nada a quem lê.
function campoRelevante(caminho: string): boolean {
  return !/(^|\.)(id|animalId|protocolo|dataAbertura|ocorrenciaId|codigo|justificativa)$/.test(caminho)
}

export function diferencasDoEvento(antes: string | null | undefined, depois: string | null | undefined): DiferencaPayload[] {
  const valoresAntes = folhas(antes)
  const valoresDepois = folhas(depois)
  const caminhos = new Set([...valoresAntes.keys(), ...valoresDepois.keys()])

  const diferencas: DiferencaPayload[] = []
  for (const caminho of caminhos) {
    if (!campoRelevante(caminho)) continue
    const valorAntes = textoDe(valoresAntes.get(caminho))
    const valorDepois = textoDe(valoresDepois.get(caminho))
    if (valorAntes !== valorDepois) {
      diferencas.push({ campo: rotuloDe(caminho), antes: valorAntes, depois: valorDepois })
    }
  }
  return diferencas
}

export function justificativaDoEvento(depois: string | null | undefined): string | null {
  const payload = lerJson(depois)
  if (typeof payload !== 'object' || payload === null || !('justificativa' in payload)) return null
  const { justificativa } = payload as { justificativa: unknown }
  return typeof justificativa === 'string' ? justificativa : null
}
