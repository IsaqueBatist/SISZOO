import type { ChangeEvent } from 'react'

export function formatarCpf(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 10) {
    return digitos.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  return digitos.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

export function formatarCep(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8)
  return digitos.replace(/^(\d{5})(\d)/, '$1-$2')
}

export function cpfValido(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '')
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false

  function calcularDigito(ate: number): number {
    let soma = 0
    for (let indice = 0; indice < ate; indice += 1) {
      soma += Number(digitos[indice]) * (ate + 1 - indice)
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return calcularDigito(9) === Number(digitos[9]) && calcularDigito(10) === Number(digitos[10])
}

export function telefoneValido(valor: string): boolean {
  return /^\(\d{2}\) \d{4}-\d{4}$/.test(valor) || /^\(\d{2}\) \d{5}-\d{4}$/.test(valor)
}

export function cepValido(valor: string): boolean {
  return /^\d{5}-\d{3}$/.test(valor)
}

export function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
}

export function aplicarMascaraAoDigitar(formatar: (valor: string) => string) {
  return (evento: ChangeEvent<HTMLInputElement>) => {
    evento.target.value = formatar(evento.target.value)
  }
}
