import type { IconName } from '../components/layout/Icon'

// Portado de docs/prototipo/assets/shell.js — manter chaves, labels e
// access arrays idênticos ao protótipo (fonte da verdade do design system).

export type RoleKey = 'admin' | 'vet' | 'agente'

export interface Role {
  label: string
  short: string
  badgeCls: string
  name: string
  initials: string
  email: string
  access: string[]
}

export const ROLES: Record<RoleKey, Role> = {
  admin: {
    label: 'Administrador',
    short: 'ADMIN',
    badgeCls: 'badge-role-admin',
    name: 'Paulo Henriques',
    initials: 'PH',
    email: 'paulo.henriques@itu.sp.gov.br',
    access: ['dashboard', 'animais', 'ocorrencias', 'processos', 'relatorios', 'baias', 'usuarios', 'config'],
  },
  vet: {
    label: 'Veterinária',
    short: 'VET',
    badgeCls: 'badge-role-vet',
    name: 'Stéphanie Lima',
    initials: 'SL',
    email: 'stephanie.lima@itu.sp.gov.br',
    access: ['dashboard', 'animais', 'ocorrencias', 'processos', 'relatorios', 'baias', 'config'],
  },
  agente: {
    label: 'Agente Sanitário',
    short: 'AGENTE',
    badgeCls: 'badge-role-agent',
    name: 'Rafael Santos',
    initials: 'RS',
    email: 'rafael.santos@itu.sp.gov.br',
    access: ['dashboard', 'animais', 'ocorrencias', 'processos', 'relatorios', 'config'],
  },
}

interface NavGroup {
  group: string
}

interface NavItem {
  id: string
  label: string
  to: string
  icon: IconName
  badge?: number
}

export type NavEntry = NavGroup | NavItem

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'group' in entry
}

export const NAV_ALL: NavEntry[] = [
  { group: 'PRINCIPAL' },
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'home' },
  { id: 'animais', label: 'Animais', to: '/animais', icon: 'paw' },
  { id: 'ocorrencias', label: 'Ocorrências', to: '/ocorrencias', icon: 'alert', badge: 4 },
  { id: 'processos', label: 'Processos Sanitários', to: '/processos', icon: 'clipboard' },
  { id: 'relatorios', label: 'Relatórios', to: '/relatorios', icon: 'chart' },
  { group: 'ADMINISTRAÇÃO' },
  { id: 'baias', label: 'Gestão de Baias', to: '/baias', icon: 'grid' },
  { id: 'usuarios', label: 'Usuários', to: '/usuarios', icon: 'users' },
  { id: 'config', label: 'Configurações', to: '/configuracoes', icon: 'cog' },
]

// Mapeamento provisório entre `usuario.cargos` (schema real N:N do backend)
// e as chaves de perfil do design system. Comparação por substring
// normalizada tolera variação de acento/gênero entre o cargo real e o
// rótulo interno (ex.: "Veterinário" vs. label "Veterinária"). Quando o
// usuário acumula múltiplos cargos, a precedência é fixa:
// admin > veterinário > agente — independente da ordem vinda do backend.
const PRECEDENCIA_CARGOS: { chave: RoleKey; correspondeA: string }[] = [
  { chave: 'admin', correspondeA: 'admin' },
  { chave: 'vet', correspondeA: 'veterin' },
  { chave: 'agente', correspondeA: 'agente' },
]

// Marcas diacríticas combinantes (U+0300–U+036F), isoladas por normalize('NFD').
const DIACRITICOS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g')

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(DIACRITICOS, '')
    .toLowerCase()
}

export function roleKeyFromCargos(cargos: string[]): RoleKey {
  const normalizados = cargos.map(normalizar)

  for (const { chave, correspondeA } of PRECEDENCIA_CARGOS) {
    if (normalizados.some((cargo) => cargo.includes(correspondeA))) return chave
  }

  return 'agente'
}

export function getNavForRole(roleKey: RoleKey): NavEntry[] {
  const allowed = new Set(ROLES[roleKey].access)
  const out: NavEntry[] = []

  for (let i = 0; i < NAV_ALL.length; i++) {
    const entry = NAV_ALL[i]
    if (isNavGroup(entry)) {
      let hasItem = false
      for (let j = i + 1; j < NAV_ALL.length; j++) {
        const next = NAV_ALL[j]
        if (isNavGroup(next)) break
        if (allowed.has(next.id)) {
          hasItem = true
          break
        }
      }
      if (hasItem) out.push(entry)
      continue
    }
    if (allowed.has(entry.id)) out.push(entry)
  }

  return out
}

export { isNavGroup }
