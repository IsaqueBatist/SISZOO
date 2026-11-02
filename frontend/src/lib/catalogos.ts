export function nomeNoCatalogo(itens: { codigo: string; nome: string }[] | undefined, codigo: string): string {
  if (!codigo) return '—'
  return itens?.find((item) => item.codigo === codigo)?.nome ?? codigo
}
