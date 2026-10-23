import { useQuery } from '@tanstack/react-query'
import { listarOcorrencias } from '../api/ocorrenciasApi'
import { extrairBairrosDistintos } from '../utils/mapearOcorrenciasPorBairro'

// Paliativo até existir um endpoint de valores distintos — mesmo padrão já
// usado em LIMITE_OCORRENCIAS_GRAFICO (GraficoOcorrenciasPorBairro.tsx).
const LIMITE_SUGESTOES_BAIRRO = 500

// É só uma sugestão de preenchimento (datalist), não dado crítico — cache
// mais longo evita rebuscar a cada vez que o formulário de ocorrência abre.
const STALE_TIME_SUGESTOES_MS = 5 * 60 * 1000

export function useSugestoesBairroQuery() {
  return useQuery({
    queryKey: ['ocorrencias', 'sugestoes-bairro'],
    queryFn: () => listarOcorrencias({ pagina: 0, tamanho: LIMITE_SUGESTOES_BAIRRO }),
    staleTime: STALE_TIME_SUGESTOES_MS,
    select: (pagina) => extrairBairrosDistintos(pagina.itens),
  })
}
