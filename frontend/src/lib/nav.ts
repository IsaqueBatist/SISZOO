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

export const ROLE_STORAGE_KEY = 'siszoo_role'

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

export function getCurrentRoleKey(): RoleKey {
  try {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY)
    if (stored && stored in ROLES) return stored as RoleKey
  } catch {
    /* localStorage indisponível (ex.: SSR/teste) */
  }
  return 'vet'
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
