import type { IconName } from '../components/layout/Icon'

export type RoleKey = 'admin' | 'vet' | 'agente' | 'sem_perfil'

export interface Role {
  label: string
  short: string
  access: string[]
}

export const ROLES: Record<RoleKey, Role> = {
  admin: {
    label: 'Administrador',
    short: 'ADMIN',
    access: ['dashboard', 'animais', 'ocorrencias', 'processos', 'relatorios', 'medicamentos', 'vacinas', 'baias', 'usuarios', 'logs', 'config'],
  },
  vet: {
    label: 'Veterinário(a)',
    short: 'VET',
    access: ['dashboard', 'animais', 'processos', 'relatorios', 'medicamentos', 'vacinas', 'baias', 'config'],
  },
  agente: {
    label: 'Agente Sanitário',
    short: 'AGENTE',
    access: ['dashboard', 'ocorrencias', 'processos', 'relatorios', 'medicamentos', 'vacinas', 'config'],
  },
  sem_perfil: {
    label: 'Sem perfil reconhecido',
    short: 'SEM PERFIL',
    access: [],
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
}

export type NavEntry = NavGroup | NavItem

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'group' in entry
}

const NAV_DECLARADA: NavEntry[] = [
  { group: 'PRINCIPAL' },
  { id: 'dashboard', label: 'Início', to: '/dashboard', icon: 'home' },
  { id: 'animais', label: 'Animais', to: '/animais', icon: 'paw' },
  { id: 'ocorrencias', label: 'Ocorrências', to: '/ocorrencias', icon: 'inbox' },
  { id: 'processos', label: 'Processos Sanitários', to: '/processos', icon: 'clipboard' },
  { id: 'relatorios', label: 'Relatórios', to: '/relatorios', icon: 'chart' },
  { group: 'CADASTROS' },
  { id: 'medicamentos', label: 'Medicamentos', to: '/medicamentos', icon: 'pill' },
  { id: 'vacinas', label: 'Vacinas', to: '/vacinas', icon: 'syringe' },
  { id: 'baias', label: 'Gestão de Baias', to: '/baias', icon: 'grid' },
  { group: 'ADMINISTRAÇÃO' },
  { id: 'usuarios', label: 'Usuários', to: '/usuarios', icon: 'users' },
  { id: 'logs', label: 'Histórico de ações', to: '/logs', icon: 'history' },
  { group: 'SISTEMA' },
  { id: 'config', label: 'Configurações', to: '/configuracoes', icon: 'cog' },
]

const COMPARADOR_ROTULO = new Intl.Collator('pt-BR', { sensitivity: 'base' })

export function ordenarItensPorRotulo(entradas: NavEntry[]): NavEntry[] {
  const resultado: NavEntry[] = []
  let itensDoGrupo: NavItem[] = []
  const despejarGrupo = () => {
    resultado.push(...[...itensDoGrupo].sort((a, b) => COMPARADOR_ROTULO.compare(a.label, b.label)))
    itensDoGrupo = []
  }
  for (const entrada of entradas) {
    if (isNavGroup(entrada)) {
      despejarGrupo()
      resultado.push(entrada)
    } else {
      itensDoGrupo.push(entrada)
    }
  }
  despejarGrupo()
  return resultado
}

export const NAV_ALL: NavEntry[] = ordenarItensPorRotulo(NAV_DECLARADA)

const ROTULOS_FORA_DO_MENU: Record<string, string> = {
  '/alertas': 'Alertas de vacina',
  '/perfil': 'Meu perfil',
}

export function rotuloDaRota(pathname: string): string {
  const item = NAV_ALL.find((entry) => !isNavGroup(entry) && pathname.startsWith(entry.to))
  if (item && !isNavGroup(item)) return item.label
  const extra = Object.keys(ROTULOS_FORA_DO_MENU).find((rota) => pathname.startsWith(rota))
  return extra ? ROTULOS_FORA_DO_MENU[extra] : 'Página não encontrada'
}

export function tituloDaRota(pathname: string): string {
  const rotulo = rotuloDaRota(pathname)
  if (pathname.endsWith('/novo')) return `Novo registro · ${rotulo}`
  if (pathname.endsWith('/editar')) return `Editar · ${rotulo}`
  if (/\/[0-9a-f-]{36}$/i.test(pathname)) return `Detalhe · ${rotulo}`
  return rotulo
}

const PRECEDENCIA_CARGOS: { chave: RoleKey; correspondeA: string }[] = [
  { chave: 'admin', correspondeA: 'admin' },
  { chave: 'vet', correspondeA: 'veterin' },
  { chave: 'agente', correspondeA: 'agente' },
]

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

  return 'sem_perfil'
}

export function podeAcessar(roleKey: RoleKey, modulo: string): boolean {
  return ROLES[roleKey].access.includes(modulo)
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
