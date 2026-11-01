// Espelha com.siszoo.usuarios.service.PoliticaSenha (backend), que é a fonte
// da verdade: complexidade de senha no modelo da política "Passwords must meet
// complexity requirements" do Windows, aplicada na senha inicial, na troca de
// senha e na redefinição por link.
// - Nome da conta = parte do e-mail antes do @, inteira, sem diferenciar
//   maiúsculas; ignorada se tiver menos de 3 caracteres.
// - Nome de exibição (nome + sobrenome) dividido nos delimitadores; cada parte
//   com 3+ caracteres não pode aparecer na senha.
// - Ao menos 3 das 5 categorias de caractere.
// O tamanho mínimo (8) fica nos schemas; aqui só entra na avaliação que o
// componente CriteriosSenha mostra enquanto a pessoa digita.

export interface DonoDaSenha {
  email: string
  nomeExibicao: string
}

export const TAMANHO_MINIMO_SENHA = 8
export const CATEGORIAS_EXIGIDAS = 3

const DELIMITADORES_NOME = /[,.\-‐-―_ #\t]+/
const TAMANHO_MINIMO_PARTE = 3
// Lista exata da política; símbolos de moeda não contam.
const CARACTERES_ESPECIAIS = `'-!"#$%&()*,./:;?@[]^_\`{|}~+<=>`

export const MENSAGEM_CATEGORIAS =
  'Use ao menos 3 tipos de caractere: letras maiúsculas, letras minúsculas, números e símbolos.'

export interface CategoriasSenha {
  maiuscula: boolean
  minuscula: boolean
  digito: boolean
  especial: boolean
  // Letra sem maiúscula/minúscula (ex.: ideogramas asiáticos): conta na
  // política, mas não aparece como item na lista de critérios.
  outraLetra: boolean
}

export interface AvaliacaoSenha {
  tamanhoMinimo: boolean
  categorias: CategoriasSenha
  totalCategorias: number
  categoriasSuficientes: boolean
  // Só há o que verificar quando o dono tem nome de conta ou partes do nome
  // com 3+ caracteres; sem isso, o critério não aparece.
  contaVerificavel: boolean
  contemConta: boolean
  nomeVerificavel: boolean
  contemNome: boolean
}

// Cada regra da política avaliada separadamente, para a lista de critérios
// acompanhar a digitação. violacaoPoliticaSenha deriva daqui.
export function avaliarSenha(senha: string, { email, nomeExibicao }: DonoDaSenha): AvaliacaoSenha {
  const senhaMinuscula = senha.toLowerCase()

  const arroba = email.indexOf('@')
  const conta = arroba > 0 ? email.slice(0, arroba) : ''
  const contaVerificavel = conta.length >= TAMANHO_MINIMO_PARTE
  const contemConta = contaVerificavel && senhaMinuscula.includes(conta.toLowerCase())

  const partesDoNome = nomeExibicao.split(DELIMITADORES_NOME).filter((parte) => parte.length >= TAMANHO_MINIMO_PARTE)
  const nomeVerificavel = partesDoNome.length > 0
  const contemNome = partesDoNome.some((parte) => senhaMinuscula.includes(parte.toLowerCase()))

  const categorias = categoriasDe(senha)
  const totalCategorias = Object.values(categorias).filter(Boolean).length

  return {
    tamanhoMinimo: senha.length >= TAMANHO_MINIMO_SENHA,
    categorias,
    totalCategorias,
    categoriasSuficientes: totalCategorias >= CATEGORIAS_EXIGIDAS,
    contaVerificavel,
    contemConta,
    nomeVerificavel,
    contemNome,
  }
}

// Primeira regra violada (mensagem para o usuário) ou null. Mesma ordem do
// backend: nome da conta, partes do nome, categorias.
export function violacaoPoliticaSenha(senha: string, dono: DonoDaSenha): string | null {
  const avaliacao = avaliarSenha(senha, dono)
  if (avaliacao.contemConta) {
    return 'A senha não pode conter o nome da conta (a parte do e-mail antes do @).'
  }
  if (avaliacao.contemNome) {
    return 'A senha não pode conter partes do nome do usuário.'
  }
  return avaliacao.categoriasSuficientes ? null : MENSAGEM_CATEGORIAS
}

function categoriasDe(senha: string): CategoriasSenha {
  const categorias: CategoriasSenha = {
    maiuscula: false,
    minuscula: false,
    digito: false,
    especial: false,
    outraLetra: false,
  }
  for (const c of senha) {
    if (/\p{Uppercase}/u.test(c)) categorias.maiuscula = true
    else if (/\p{Lowercase}/u.test(c)) categorias.minuscula = true
    else if (c >= '0' && c <= '9') categorias.digito = true
    else if (CARACTERES_ESPECIAIS.includes(c)) categorias.especial = true
    else if (/\p{Alphabetic}/u.test(c)) categorias.outraLetra = true
  }
  return categorias
}
