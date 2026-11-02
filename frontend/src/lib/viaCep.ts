export interface EnderecoViaCep {
  logradouro: string
  bairro: string
}

const TIMEOUT_VIACEP_MS = 5000

interface RespostaViaCep {
  logradouro?: string
  bairro?: string
  erro?: boolean
}

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
