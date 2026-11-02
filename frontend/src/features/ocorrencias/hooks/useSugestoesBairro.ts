import { extrairBairrosDistintos } from '../utils/mapearOcorrenciasPorBairro'
import { useContagemPorBairroQuery } from './useOcorrencias'

export function useSugestoesBairroQuery() {
  return useContagemPorBairroQuery(extrairBairrosDistintos)
}
