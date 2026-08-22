import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('https://api.siszoo.local/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
]
