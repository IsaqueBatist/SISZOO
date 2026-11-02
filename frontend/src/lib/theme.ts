import type { DensidadeUsuario, PreferenciaUsuario, TemaUsuario } from '@/features/configuracoes/types/configuracoes.types'

const TEMAS: Record<TemaUsuario, Record<string, string>> = {
  LIGHT: {
    '--color-bg': '#F4F6F8',
    '--color-surface': '#FFFFFF',
    '--color-surface-alt': '#F9FAFB',
    '--color-border': '#E0E4EA',
    '--color-border-strong': '#C5CDD8',
    '--color-text-primary': '#1A2332',
    '--color-text-secondary': '#5A6A7E',
    '--color-text-muted': '#5F6F82',
    '--color-text-inverse': '#FFFFFF',
    '--color-on-primary': '#FFFFFF',
    '--color-primary': '#1B5E20',
    '--color-primary-hover': '#2E7D32',
    '--color-primary-light': '#E8F5E9',
    '--color-primary-mid': '#4CAF50',
    '--sidebar-bg': '#1B5E20',
    '--color-danger': '#C62828',
    '--color-danger-bg': '#FFEBEE',
    '--color-danger-border': '#EF9A9A',
    '--color-warning': '#B84300',
    '--color-warning-bg': '#FFF3E0',
    '--color-warning-border': '#FFCC80',
    '--color-alert': '#F57F17',
    '--color-alert-bg': '#FFFDE7',
    '--color-alert-border': '#FFF176',
    '--color-info': '#1565C0',
    '--color-info-bg': '#E3F2FD',
    '--color-info-border': '#90CAF9',
    '--color-success': '#2E7D32',
    '--color-success-bg': '#E8F5E9',
    '--color-success-border': '#A5D6A7',
  },
  DARK: {
    '--color-bg': '#0F1720',
    '--color-surface': '#1A2332',
    '--color-surface-alt': '#212C3D',
    '--color-border': '#2C3A4E',
    '--color-border-strong': '#3A4A61',
    '--color-text-primary': '#F4F6F8',
    '--color-text-secondary': '#B8C4D3',
    '--color-text-muted': '#A9B7C6',
    '--color-text-inverse': '#1A2332',
    '--color-on-primary': '#0F1720',
    '--color-primary': '#4CAF50',
    '--color-primary-hover': '#66BB6A',
    '--color-primary-light': 'rgba(76, 175, 80, 0.16)',
    '--color-primary-mid': '#66BB6A',
    '--sidebar-bg': '#0B1F14',
    '--color-danger': '#EF5350',
    '--color-danger-bg': 'rgba(239, 83, 80, 0.16)',
    '--color-danger-border': 'rgba(239, 83, 80, 0.4)',
    '--color-warning': '#FFA726',
    '--color-warning-bg': 'rgba(255, 167, 38, 0.16)',
    '--color-warning-border': 'rgba(255, 167, 38, 0.4)',
    '--color-alert': '#FFCA28',
    '--color-alert-bg': 'rgba(255, 202, 40, 0.16)',
    '--color-alert-border': 'rgba(255, 202, 40, 0.4)',
    '--color-info': '#42A5F5',
    '--color-info-bg': 'rgba(66, 165, 245, 0.16)',
    '--color-info-border': 'rgba(66, 165, 245, 0.4)',
    '--color-success': '#66BB6A',
    '--color-success-bg': 'rgba(102, 187, 106, 0.16)',
    '--color-success-border': 'rgba(102, 187, 106, 0.4)',
  },
}

const DENSIDADES: Record<DensidadeUsuario, Record<string, string>> = {
  COMPACTO: {
    '--space-4': '12px',
    '--space-5': '14px',
    '--space-6': '18px',
    '--space-8': '24px',
    '--topbar-height': '52px',
  },
  NORMAL: {
    '--space-4': '16px',
    '--space-5': '20px',
    '--space-6': '24px',
    '--space-8': '32px',
    '--topbar-height': '64px',
  },
  CONFORTAVEL: {
    '--space-4': '20px',
    '--space-5': '24px',
    '--space-6': '32px',
    '--space-8': '40px',
    '--topbar-height': '72px',
  },
}

export function aplicarPreferenciasVisuais(preferencias: Pick<PreferenciaUsuario, 'tema' | 'densidade'>) {
  const root = document.documentElement.style
  document.documentElement.dataset.tema = preferencias.tema === 'DARK' ? 'escuro' : 'claro'
  const variaveisTema = TEMAS[preferencias.tema] ?? TEMAS.LIGHT
  const variaveisDensidade = DENSIDADES[preferencias.densidade] ?? DENSIDADES.NORMAL

  for (const [variavel, valor] of Object.entries(variaveisTema)) {
    root.setProperty(variavel, valor)
  }
  for (const [variavel, valor] of Object.entries(variaveisDensidade)) {
    root.setProperty(variavel, valor)
  }
}
