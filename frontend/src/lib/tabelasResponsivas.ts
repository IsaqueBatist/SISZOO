import { useEffect } from 'react'

export const COLUNAS_MINIMAS_PARA_CARTOES = 4

function definirSeDiferente(elemento: Element, atributo: string, valor: string) {
  if (elemento.getAttribute(atributo) !== valor) elemento.setAttribute(atributo, valor)
}

export function prepararTabela(tabela: HTMLTableElement) {
  const cabecalhos = [...tabela.querySelectorAll(':scope > thead > tr:first-child > th')]
  const rotulos = cabecalhos.flatMap((th) => {
    const texto = th.textContent?.trim() ?? ''
    return Array.from({ length: Number(th.getAttribute('colspan') ?? 1) }, () => texto)
  })
  tabela.classList.toggle('tabela-cartoes', rotulos.length >= COLUNAS_MINIMAS_PARA_CARTOES)

  definirSeDiferente(tabela, 'role', 'table')
  for (const grupo of tabela.querySelectorAll(':scope > thead, :scope > tbody')) definirSeDiferente(grupo, 'role', 'rowgroup')
  for (const th of cabecalhos) definirSeDiferente(th, 'role', 'columnheader')

  for (const linha of tabela.querySelectorAll(':scope > thead > tr, :scope > tbody > tr')) {
    definirSeDiferente(linha, 'role', 'row')
    if (linha.parentElement?.tagName !== 'TBODY') continue
    let coluna = 0
    for (const celula of linha.children) {
      definirSeDiferente(celula, 'role', 'cell')
      const extensao = Number(celula.getAttribute('colspan') ?? 1)
      if (extensao === 1 && rotulos[coluna]) definirSeDiferente(celula, 'data-rotulo', rotulos[coluna])
      else celula.removeAttribute('data-rotulo')
      coluna += extensao
    }
  }
}

export function prepararTabelasEm(raiz: ParentNode) {
  for (const tabela of raiz.querySelectorAll<HTMLTableElement>('table.data')) prepararTabela(tabela)
}

export function useTabelasResponsivas() {
  useEffect(() => {
    let quadro = 0
    const agendar = () => {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(() => prepararTabelasEm(document.body))
    }
    agendar()
    const observador = new MutationObserver(agendar)
    observador.observe(document.body, { childList: true, subtree: true })
    return () => {
      cancelAnimationFrame(quadro)
      observador.disconnect()
    }
  }, [])
}
