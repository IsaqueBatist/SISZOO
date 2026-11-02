import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

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
