import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { atualizarVacina, criarVacina, desativarVacina, listarVacinas } from '../api/vacinasApi'
import type { AtualizarVacinaRequest } from '../types/vacinas.types'

const VACINAS_QUERY_KEY = ['vacinas']

// Só as ativas: é o que o modal de registro de vacinação precisa oferecer.
export function useVacinasAtivasQuery() {
  return useQuery({
    queryKey: [...VACINAS_QUERY_KEY, { ativo: true }],
    queryFn: () => listarVacinas(true),
    select: (pagina) => pagina.itens,
  })
}

// A tela de catálogo também lista as inativas, para permitir reativar — sem
// isso, recadastrar uma vacina desativada daria 409 sem saída.
export function useVacinasQuery(incluirInativas: boolean) {
  return useQuery({
    queryKey: [...VACINAS_QUERY_KEY, { ativo: incluirInativas ? undefined : true }],
    queryFn: () => listarVacinas(incluirInativas ? undefined : true),
    select: (pagina) => pagina.itens,
  })
}

// Invalida ['vacinas'] (esta tela) E ['animais','catalogos'] (o select do
// modal de vacinação, que lê GET /api/animais/catalogos).
//
// A segunda invalidação não é redundante nem defensiva: `useCatalogosAnimaisQuery`
// tem `staleTime: Infinity`, e `invalidarAnimaisEBaias` exclui `'catalogos'` do
// predicate de propósito (T45 — antes cada gravação de animal recarregava os
// catálogos). Sem invalidar aqui, a vacina recém-cadastrada não apareceria no
// select até a página ser recarregada, e o "+" pareceria não ter funcionado.
function useInvalidarVacinas() {
  const queryClient = useQueryClient()
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: VACINAS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ['animais', 'catalogos'] }),
    ])
  }
}

export function useCriarVacinaMutation() {
  const invalidar = useInvalidarVacinas()
  return useMutation({ mutationFn: criarVacina, onSuccess: invalidar })
}

export function useAtualizarVacinaMutation() {
  const invalidar = useInvalidarVacinas()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AtualizarVacinaRequest }) => atualizarVacina(id, payload),
    onSuccess: invalidar,
  })
}

export function useDesativarVacinaMutation() {
  const invalidar = useInvalidarVacinas()
  return useMutation({ mutationFn: desativarVacina, onSuccess: invalidar })
}
