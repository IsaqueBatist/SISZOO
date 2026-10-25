import { extrairBairrosDistintos } from '../utils/mapearOcorrenciasPorBairro'
import { useContagemPorBairroQuery } from './useOcorrencias'

// Datalist do formulário de ocorrência: as grafias de bairro já usadas, a
// partir da contagem por bairro do backend (T45) — a mesma consulta do
// gráfico de distribuição, sem baixar ocorrências.
export function useSugestoesBairroQuery() {
  return useContagemPorBairroQuery(extrairBairrosDistintos)
}
