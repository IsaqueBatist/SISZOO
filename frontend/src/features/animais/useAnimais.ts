import { useQuery } from '@tanstack/react-query'
import { listarAnimais, listarCatalogosAnimais } from './animaisApi'
import type { AnimaisFiltro } from './animais.types'

// A key inclui o objeto de filtro inteiro: qualquer mudança de status,
// espécie, busca ou página gera uma key nova e refaz a query automaticamente,
// sem precisar de invalidateQueries manual.
export function useAnimaisQuery(filtro: AnimaisFiltro) {
  return useQuery({
    queryKey: ['animais', filtro],
    queryFn: () => listarAnimais(filtro),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  })
}

export function useCatalogosAnimaisQuery() {
  return useQuery({
    queryKey: ['animais', 'catalogos'],
    queryFn: listarCatalogosAnimais,
    staleTime: Infinity,
  })
}
