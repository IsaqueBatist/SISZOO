export interface EnderecoViaCep {
  logradouro: string
  bairro: string
}

// Timeout curto: preenchimento automático é bônus, não pode travar o
// formulário com a internet instável do CCZ — se não responder a tempo, o
// usuário preenche manualmente.
const TIMEOUT_VIACEP_MS = 5000

interface RespostaViaCep {
  logradouro?: string
  bairro?: string
  erro?: boolean
}

// ViaCEP é um serviço de terceiro (fora do backend do SISZOO) — fetch direto,
// sem Authorization/baseURL do projeto. CEP com formato válido mas
// inexistente devolve HTTP 200 com {"erro": true}; isso é "não encontrado",
// não sucesso. Qualquer falha (rede, timeout, resposta inesperada) devolve
// null em vez de lançar — o campo continua editável manualmente.
export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoViaCep | null> {
  const digitos = cep.replace(/\D/g, '')
  if (digitos.length !== 8) return null

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_VIACEP_MS)

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, { signal: controller.signal })
    if (!resposta.ok) return null

    const dados = (await resposta.json()) as RespostaViaCep
    if (dados.erro) return null

    return { logradouro: dados.logradouro ?? '', bairro: dados.bairro ?? '' }
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}
