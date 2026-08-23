import { http } from '../../lib/http'
import type { LoginRequest, LoginResponse } from './auth.types'

export function login(payload: LoginRequest): Promise<LoginResponse> {
  return http.post<LoginResponse>('/auth/login', payload).then((response) => response.data)
}
