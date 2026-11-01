import type { IconName } from '../components/layout/Icon'

// Portado de docs/prototipo/assets/shell.js. Divergências deliberadas: o
// Veterinário não acessa 'ocorrencias' (correção de regra de acesso, V11 no
// backend) e os grupos do menu foram separados por responsabilidade, porque
// Medicamentos e Configurações também são usados por quem não administra.

// 'sem_perfil': cargo que não corresponde a nenhum perfil conhecido (ou
// sessão sem cargos). Não vê nenhum módulo. Antes caía em 'agente' e o menu
// mostrava telas que o backend recusaria com 403.
export type RoleKey = 'admin' | 'vet' | 'agente' | 'sem_perfil'

export interface Role {
  label: string
  short: string
  badgeCls: string
  access: string[]
}

export const ROLES: Record<RoleKey, Role> = {
  admin: {
    label: 'Administrador',
    short: 'ADMIN',
    badgeCls: 'badge-role-admin',
    access: ['dashboard', 'animais', 'ocorrencias', 'processos', 'relatorios', 'medicamentos', 'baias', 'usuarios', 'logs', 'config'],
  },
  vet: {
    label: 'Veterinário(a)',
    short: 'VET',
    badgeCls: 'badge-role-vet',
    access: ['dashboard', 'animais', 'processos', 'relatorios', 'medicamentos', 'baias', 'config'],
  },
  // 'medicamentos' (fora do protótipo): o Agente tem GESTAO_ANIMAIS:leitura,
  // então vê o catálogo; cadastrar exige escrita (Admin e Vet).
  agente: {
    label: 'Agente Sanitário',
    short: 'AGENTE',
    badgeCls: 'badge-role-agent',
    access: ['dashboard', 'animais', 'ocorrencias', 'processos', 'relatorios', 'medicamentos', 'config'],
  },
  sem_perfil: {
    label: 'Sem perfil reconhecido',
    short: 'SEM PERFIL',
    badgeCls: 'badge-neutral',
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

// Os grupos seguem a responsabilidade de cada módulo e ficam na ordem em que
// aparecem aqui. Dentro de cada grupo, os itens ficam em ordem alfabética pelo
// nome exibido (ordenarItensPorRotulo), independentemente da ordem desta lista.
const NAV_DECLARADA: NavEntry[] = [
  { group: 'PRINCIPAL' },
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'home' },
  { id: 'animais', label: 'Animais', to: '/animais', icon: 'paw' },
  { id: 'ocorrencias', label: 'Ocorrências', to: '/ocorrencias', icon: 'alert' },
  { id: 'processos', label: 'Processos Sanitários', to: '/processos', icon: 'clipboard' },
  { id: 'relatorios', label: 'Relatórios', to: '/relatorios', icon: 'chart' },
  { group: 'CADASTROS' },
  { id: 'medicamentos', label: 'Medicamentos', to: '/medicamentos', icon: 'pill' },
  { id: 'baias', label: 'Gestão de Baias', to: '/baias', icon: 'grid' },
  { group: 'ADMINISTRAÇÃO' },
  { id: 'usuarios', label: 'Usuários', to: '/usuarios', icon: 'users' },
  { id: 'logs', label: 'Logs', to: '/logs', icon: 'eye' },
  { group: 'SISTEMA' },
  { id: 'config', label: 'Configurações', to: '/configuracoes', icon: 'cog' },
]

const COMPARADOR_ROTULO = new Intl.Collator('pt-BR', { sensitivity: 'base' })

// Ordena os itens de cada grupo de A a Z pelo rótulo visível, com acentos
// tratados como a letra base. Os grupos e a ordem entre eles não mudam.
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

// Telas fora do menu que também precisam de nome no topo e na aba do navegador.
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

// Título da aba: com várias abas abertas, cada uma precisa ser reconhecível.
export function tituloDaRota(pathname: string): string {
  const rotulo = rotuloDaRota(pathname)
  if (pathname.endsWith('/novo')) return `Novo registro · ${rotulo}`
  if (pathname.endsWith('/editar')) return `Editar · ${rotulo}`
  if (/\/[0-9a-f-]{36}$/i.test(pathname)) return `Detalhe · ${rotulo}`
  return rotulo
}

// Mapeamento provisório entre `usuario.cargos` (schema real N:N do backend)
// e as chaves de perfil do design system. Comparação por substring
// normalizada tolera variação de acento/gênero entre o cargo real e o
// rótulo interno (ex.: "Veterinário" vs. label "Veterinária"). Quando o
// usuário acumula múltiplos cargos, a precedência é fixa:
// admin > veterinário > agente, independente da ordem vinda do backend.
const PRECEDENCIA_CARGOS: { chave: RoleKey; correspondeA: string }[] = [
  { chave: 'admin', correspondeA: 'admin' },
  { chave: 'vet', correspondeA: 'veterin' },
  { chave: 'agente', correspondeA: 'agente' },
]

// Marcas diacríticas combinantes (U+0300 a U+036F), isoladas por normalize('NFD').
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
