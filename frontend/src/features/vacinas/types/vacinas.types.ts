// Espelha com.siszoo.animais.clinico.dto.VacinaResponse.
export interface Vacina {
  id: string
  // Derivado do nome no servidor e imutável depois de criado: é a chave que
  // os registros de vacinação usam (`vacinaCodigo`).
  codigo: string
  nome: string
  // Nulo = vacina sem reforço definido; não gera alerta (RN-A03).
  intervaloMeses: number | null
  ativo: boolean
}

// Espelha CriarVacinaRequest (sem `codigo`: o servidor o deriva do nome).
export interface CriarVacinaRequest {
  nome: string
  intervaloMeses?: number
}

// Espelha AtualizarVacinaRequest.
export interface AtualizarVacinaRequest {
  nome: string
  intervaloMeses?: number
  ativo: boolean
}
