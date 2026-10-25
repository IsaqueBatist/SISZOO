// Espelha com.siszoo.usuarios.service.PoliticaSenha (backend), que é a fonte
// da verdade: complexidade de senha no modelo da política "Passwords must meet
// complexity requirements" do Windows, aplicada na senha inicial e na troca
// de senha. O tamanho mínimo (8) fica no próprio schema.
// - Nome da conta = parte do e-mail antes do @, inteira, sem diferenciar
//   maiúsculas; ignorada se tiver menos de 3 caracteres.
// - Nome de exibição (nome + sobrenome) dividido nos delimitadores; cada parte
//   com 3+ caracteres não pode aparecer na senha.
// - Ao menos 3 das 5 categorias de caractere.

export interface DonoDaSenha {
  email: string
  nomeExibicao: string
}

const DELIMITADORES_NOME = /[,.\-‐-―_ #\t]+/
const TAMANHO_MINIMO_PARTE = 3
const CATEGORIAS_EXIGIDAS = 3
// Lista exata da política; símbolos de moeda não contam.
const CARACTERES_ESPECIAIS = `'-!"#$%&()*,./:;?@[]^_\`{|}~+<=>`

export const MENSAGEM_CATEGORIAS =
  'Use ao menos 3 tipos de caractere: letras maiúsculas, letras minúsculas, números e símbolos.'

// Primeira regra violada (mensagem para o usuário) ou null.
export function violacaoPoliticaSenha(senha: string, { email, nomeExibicao }: DonoDaSenha): string | null {
  const senhaMinuscula = senha.toLowerCase()

  const arroba = email.indexOf('@')
  const conta = arroba > 0 ? email.slice(0, arroba) : ''
  if (conta.length >= TAMANHO_MINIMO_PARTE && senhaMinuscula.includes(conta.toLowerCase())) {
    return 'A senha não pode conter o nome da conta (a parte do e-mail antes do @).'
  }

  for (const parte of nomeExibicao.split(DELIMITADORES_NOME)) {
    if (parte.length >= TAMANHO_MINIMO_PARTE && senhaMinuscula.includes(parte.toLowerCase())) {
      return 'A senha não pode conter partes do nome do usuário.'
    }
  }

  return contarCategorias(senha) < CATEGORIAS_EXIGIDAS ? MENSAGEM_CATEGORIAS : null
}

function contarCategorias(senha: string): number {
  const categorias = new Set<string>()
  for (const c of senha) {
    if (/\p{Uppercase}/u.test(c)) categorias.add('maiuscula')
    else if (/\p{Lowercase}/u.test(c)) categorias.add('minuscula')
    else if (c >= '0' && c <= '9') categorias.add('digito')
    else if (CARACTERES_ESPECIAIS.includes(c)) categorias.add('especial')
    // Letra sem maiúscula/minúscula (ex.: ideogramas asiáticos).
    else if (/\p{Alphabetic}/u.test(c)) categorias.add('outraLetra')
  }
  return categorias.size
}
