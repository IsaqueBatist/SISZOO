import axios from 'axios'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '../lib/env'

describe('mock de HTTP com MSW', () => {
  it('intercepta a chamada e retorna a resposta mockada', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`)

    expect(response.status).toBe(200)
    expect(response.data).toEqual({ status: 'ok' })
  })
})
