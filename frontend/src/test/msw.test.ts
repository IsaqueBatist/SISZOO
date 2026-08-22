import axios from 'axios'
import { describe, expect, it } from 'vitest'

describe('mock de HTTP com MSW', () => {
  it('intercepta a chamada e retorna a resposta mockada', async () => {
    const response = await axios.get('https://api.siszoo.local/health')

    expect(response.status).toBe(200)
    expect(response.data).toEqual({ status: 'ok' })
  })
})
