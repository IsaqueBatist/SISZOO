import { describe, expect, it } from 'vitest'
import { NAV_ALL, getNavForRole, isNavGroup, ordenarItensPorRotulo, type NavEntry } from './nav'

function rotulosPorGrupo(entradas: NavEntry[]): Record<string, string[]> {
  const grupos: Record<string, string[]> = {}
  let atual = ''
  for (const entrada of entradas) {
    if (isNavGroup(entrada)) {
      atual = entrada.group
      grupos[atual] = []
    } else {
      grupos[atual].push(entrada.label)
    }
  }
  return grupos
}

describe('ordem do menu lateral', () => {
  it('mantém os grupos e ordena os itens de cada grupo de A a Z pelo nome exibido', () => {
    expect(rotulosPorGrupo(NAV_ALL)).toEqual({
      PRINCIPAL: ['Animais', 'Início', 'Ocorrências', 'Processos Sanitários', 'Relatórios'],
      CADASTROS: ['Gestão de Baias', 'Medicamentos', 'Vacinas'],
      ADMINISTRAÇÃO: ['Histórico de ações', 'Usuários'],
      SISTEMA: ['Configurações'],
    })
  })

  it('ordena ignorando acentos e maiúsculas, sem misturar os grupos', () => {
    const ordenado = ordenarItensPorRotulo([
      { group: 'UM' },
      { id: 'z', label: 'zebra', to: '/z', icon: 'paw' },
      { id: 'a', label: 'Águia', to: '/a', icon: 'paw' },
      { id: 'b', label: 'abelha', to: '/b', icon: 'paw' },
      { group: 'DOIS' },
      { id: 'c', label: 'Cão', to: '/c', icon: 'paw' },
      { id: 'd', label: 'Baleia', to: '/d', icon: 'paw' },
    ])

    expect(rotulosPorGrupo(ordenado)).toEqual({ UM: ['abelha', 'Águia', 'zebra'], DOIS: ['Baleia', 'Cão'] })
  })

  it('cada perfil continua vendo só os módulos permitidos, já em ordem alfabética', () => {
    expect(rotulosPorGrupo(getNavForRole('vet'))).toEqual({
      PRINCIPAL: ['Animais', 'Início', 'Processos Sanitários', 'Relatórios'],
      CADASTROS: ['Gestão de Baias', 'Medicamentos', 'Vacinas'],
      SISTEMA: ['Configurações'],
    })
    expect(rotulosPorGrupo(getNavForRole('agente'))).toEqual({
      PRINCIPAL: ['Início', 'Ocorrências', 'Processos Sanitários', 'Relatórios'],
      CADASTROS: ['Medicamentos', 'Vacinas'],
      SISTEMA: ['Configurações'],
    })
    expect(getNavForRole('sem_perfil')).toEqual([])
  })
})
