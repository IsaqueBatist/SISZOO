export function formatarData(valor: string): string {
  const [ano, mes, dia] = valor.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarHora(valor: string): string {
  return valor.slice(0, 5)
}

export function formatarDataHora(valor: string): string {
  return `${formatarData(valor)} · ${formatarHora(valor.slice(11))}`
}
