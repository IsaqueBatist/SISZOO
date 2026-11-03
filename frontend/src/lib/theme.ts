import type { DensidadeUsuario, PreferenciaUsuario, TemaUsuario } from '@/features/configuracoes/types/configuracoes.types'

const TEMAS: Record<TemaUsuario, Record<string, string>> = {
  LIGHT: {
    '--color-bg': '#F2F4F2',
    '--color-surface': '#FFFFFF',
    '--color-surface-alt': '#F7F8F7',
    '--color-border': '#DFE4E0',
    '--color-border-strong': '#C3CCC5',
    '--color-hover-linha': '#EDF5EF',
    '--color-text-primary': '#1B2430',
    '--color-text-secondary': '#4E5A68',
    '--color-text-muted': '#646F7D',
    '--color-text-inverse': '#FFFFFF',
    '--color-on-primary': '#FFFFFF',
    '--color-primary': '#1E5C3A',
    '--color-primary-hover': '#174A2E',
    '--color-primary-light': '#EAF2EC',
    '--color-primary-mid': '#3C8A5C',
    '--color-danger': '#B91C1C',
    '--color-danger-bg': '#FDECEC',
    '--color-danger-border': '#F0B4B4',
    '--color-warning': '#9A5B00',
    '--color-warning-bg': '#FFF2D9',
    '--color-warning-border': '#EFC67A',
    '--color-alert': '#B7791F',
    '--color-alert-bg': '#FFF7E3',
    '--color-alert-border': '#EED79A',
    '--color-info': '#1D5FB0',
    '--color-info-bg': '#E6F0FB',
    '--color-info-border': '#AFCBEE',
    '--color-success': '#17784A',
    '--color-success-bg': '#E3F4EA',
    '--color-success-border': '#A6D8B9',
    '--color-accent': '#6243B0',
    '--color-accent-bg': '#EFEAFA',
    '--color-accent-border': '#CDBFEE',
    '--sidebar-bg': '#173F2B',
    '--sidebar-item-hover': 'rgba(255, 255, 255, 0.08)',
    '--sidebar-item-active': 'rgba(255, 255, 255, 0.14)',
    '--sidebar-text': '#D3E6DA',
    '--sidebar-text-strong': '#FFFFFF',
    '--sidebar-icon': '#A3C9B1',
    '--sidebar-muted': '#93BBA2',
    '--sidebar-accent': '#8FD4A8',
    '--sidebar-border': 'rgba(255, 255, 255, 0.10)',
  },
  DARK: {
    '--color-bg': '#11161C',
    '--color-surface': '#181F27',
    '--color-surface-alt': '#1E262F',
    '--color-border': '#2A333D',
    '--color-border-strong': '#3A4552',
    '--color-hover-linha': '#1F2D27',
    '--color-text-primary': '#E8ECF0',
    '--color-text-secondary': '#B3BDC8',
    '--color-text-muted': '#97A3B0',
    '--color-text-inverse': '#11161C',
    '--color-on-primary': '#0E1A13',
    '--color-primary': '#6CC08E',
    '--color-primary-hover': '#86CDA2',
    '--color-primary-light': 'rgba(108, 192, 142, 0.14)',
    '--color-primary-mid': '#86CDA2',
    '--color-danger': '#F27B72',
    '--color-danger-bg': 'rgba(242, 123, 114, 0.15)',
    '--color-danger-border': 'rgba(242, 123, 114, 0.42)',
    '--color-warning': '#F0AE4C',
    '--color-warning-bg': 'rgba(240, 174, 76, 0.15)',
    '--color-warning-border': 'rgba(240, 174, 76, 0.42)',
    '--color-alert': '#E5C25E',
    '--color-alert-bg': 'rgba(229, 194, 94, 0.14)',
    '--color-alert-border': 'rgba(229, 194, 94, 0.40)',
    '--color-info': '#7DB1F2',
    '--color-info-bg': 'rgba(125, 177, 242, 0.15)',
    '--color-info-border': 'rgba(125, 177, 242, 0.42)',
    '--color-success': '#5FCB8F',
    '--color-success-bg': 'rgba(95, 203, 143, 0.15)',
    '--color-success-border': 'rgba(95, 203, 143, 0.42)',
    '--color-accent': '#B39CF0',
    '--color-accent-bg': 'rgba(179, 156, 240, 0.15)',
    '--color-accent-border': 'rgba(179, 156, 240, 0.42)',
    '--sidebar-bg': '#0D1611',
    '--sidebar-item-hover': 'rgba(108, 192, 142, 0.08)',
    '--sidebar-item-active': 'rgba(108, 192, 142, 0.16)',
    '--sidebar-text': '#BCD0C3',
    '--sidebar-text-strong': '#F1F7F9',
    '--sidebar-icon': '#89A894',
    '--sidebar-muted': '#7C9886',
    '--sidebar-accent': '#6CC08E',
    '--sidebar-border': 'rgba(255, 255, 255, 0.07)',
  },
}

const DENSIDADES: Record<DensidadeUsuario, Record<string, string>> = {
  COMPACTO: {
    '--space-4': '12px',
    '--space-5': '14px',
    '--space-6': '18px',
    '--space-8': '24px',
    '--topbar-height': '48px',
  },
  NORMAL: {
    '--space-4': '16px',
    '--space-5': '20px',
    '--space-6': '24px',
    '--space-8': '32px',
    '--topbar-height': '56px',
  },
  CONFORTAVEL: {
    '--space-4': '20px',
    '--space-5': '24px',
    '--space-6': '32px',
    '--space-8': '40px',
    '--topbar-height': '64px',
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
