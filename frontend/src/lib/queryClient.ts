import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

// T45: defaults do TanStack Query ajustados para as máquinas do CCZ (~2 GB):
// - refetchOnWindowFocus desligado: com o padrão, cada alt-tab refazia todas
//   as consultas ativas da tela.
// - retry: erro 4xx (403, 404, 422...) não muda tentando de novo; falha de
//   rede ou 5xx tenta mais uma vez (o padrão eram 3, com espera crescente).
// staleTime fica no padrão (0) de propósito: várias telas (card de urgentes,
// alertas, KPIs) dependem de recarregar ao montar para refletir o que outra
// tela acabou de gravar; o cache já é mostrado na hora enquanto recarrega.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (falhas, erro) => {
        const status = isAxiosError(erro) ? erro.response?.status : undefined
        if (status !== undefined && status >= 400 && status < 500) return false
        return falhas < 1
      },
    },
  },
})
