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

export function gerarSenhaTemporaria(): string {
  const caracteres = [caractereDe(MAIUSCULAS), caractereDe(MINUSCULAS), caractereDe(DIGITOS), caractereDe(SIMBOLOS)]
  while (caracteres.length < TAMANHO) caracteres.push(caractereDe(TODOS))

  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = sorteio(i + 1)
    ;[caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]]
  }
  return caracteres.join('')
}
