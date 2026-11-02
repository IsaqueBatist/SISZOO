export interface DonoDaSenha {
  email: string
  nomeExibicao: string
}

export const TAMANHO_MINIMO_SENHA = 8
export const CATEGORIAS_EXIGIDAS = 3

const DELIMITADORES_NOME = /[,.\-‐-―_ #\t]+/
const TAMANHO_MINIMO_PARTE = 3
const CARACTERES_ESPECIAIS = `'-!"#$%&()*,./:;?@[]^_\`{|}~+<=>`

export const MENSAGEM_CATEGORIAS =
  'Use ao menos 3 tipos de caractere: letras maiúsculas, letras minúsculas, números e símbolos.'

export interface CategoriasSenha {
  maiuscula: boolean
  minuscula: boolean
  digito: boolean
  especial: boolean
  outraLetra: boolean
}

export interface AvaliacaoSenha {
  tamanhoMinimo: boolean
  categorias: CategoriasSenha
  totalCategorias: number
  categoriasSuficientes: boolean
  contaVerificavel: boolean
  contemConta: boolean
  nomeVerificavel: boolean
  contemNome: boolean
}

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
