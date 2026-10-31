// Sem letras e dígitos que se confundem (I, l, O, 0, 1): a senha é entregue
// em mãos e digitada uma vez, no primeiro acesso.
const MAIUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const MINUSCULAS = 'abcdefghijkmnopqrstuvwxyz'
const DIGITOS = '23456789'
const SIMBOLOS = '!@#$%&*?'
const TODOS = MAIUSCULAS + MINUSCULAS + DIGITOS + SIMBOLOS

const TAMANHO = 14

function sorteio(limite: number): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] % limite
}

function caractereDe(conjunto: string): string {
  return conjunto[sorteio(conjunto.length)]
}

// Senha temporária para o primeiro acesso, trocada no primeiro login. Fonte
// criptográfica e as 4 categorias garantidas, para sempre cumprir a política de
// senha (docs/decisoes/politica-senha.md).
export function gerarSenhaTemporaria(): string {
  const caracteres = [caractereDe(MAIUSCULAS), caractereDe(MINUSCULAS), caractereDe(DIGITOS), caractereDe(SIMBOLOS)]
  while (caracteres.length < TAMANHO) caracteres.push(caractereDe(TODOS))

  // Fisher-Yates: as categorias garantidas não ficam sempre no início.
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = sorteio(i + 1)
    ;[caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]]
  }
  return caracteres.join('')
}
