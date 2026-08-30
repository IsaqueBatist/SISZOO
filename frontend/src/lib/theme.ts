import type { DensidadeUsuario, PreferenciaUsuario, TemaUsuario } from '../features/configuracoes/configuracoes.types'

// Variáveis CSS já definidas em styles/tokens.css — aqui só trocamos os
// valores em runtime (mesma técnica de docs/prototipo/assets/tweaks.js).
// O backend modela "tema" como LIGHT/DARK (não como as 4 cores institucionais
// do protótipo configuracoes.html), então aplicamos um par claro/escuro real
// de superfícies em vez do seletor de tonalidade de verde do protótipo.
//
// IMPORTANTE: cada tema precisa definir o conjunto COMPLETO de variáveis
// (superfícies, texto, primária E as cores semânticas success/danger/warning/
// alert/info + seus "-bg"/"-border"). setProperty só sobrescreve o que está
// na lista — se um tema novo omitir alguma, ela fica com o valor do tema
// anterior "grudado" via inline style. Foi assim que o alerta de sucesso
// ficou ilegível no DARK: só as superfícies/texto foram trocados, e
// --color-success-bg continuou claro enquanto o texto ficou claro também.
// Ao adicionar os temas institucionais (verde/oliva/azul/petroleo) quando o
// backend suportar, copie um bloco inteiro como base e ajuste as cores —
// nunca defina um tema parcial.
const TEMAS: Record<TemaUsuario, Record<string, string>> = {
  LIGHT: {
    '--color-bg': '#F4F6F8',
    '--color-surface': '#FFFFFF',
    '--color-surface-alt': '#F9FAFB',
    '--color-border': '#E0E4EA',
    '--color-border-strong': '#C5CDD8',
    '--color-text-primary': '#1A2332',
    '--color-text-secondary': '#5A6A7E',
    '--color-text-muted': '#9AAABB',
    '--color-text-inverse': '#FFFFFF',
    '--color-primary': '#1B5E20',
    '--color-primary-hover': '#2E7D32',
    '--color-primary-light': '#E8F5E9',
    '--color-primary-mid': '#4CAF50',
    '--sidebar-bg': '#1B5E20',
    '--color-danger': '#C62828',
    '--color-danger-bg': '#FFEBEE',
    '--color-danger-border': '#EF9A9A',
    '--color-warning': '#E65100',
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
    '--color-text-muted': '#7C8DA0',
    '--color-text-inverse': '#1A2332',
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

// COMPACTO/NORMAL/CONFORTAVEL reaproveitam os mesmos três níveis de espaçamento
// do tweaks.js (compact/comfortable/spacious) — NORMAL == valores padrão já
// definidos em tokens.css.
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
  const variaveisTema = TEMAS[preferencias.tema] ?? TEMAS.LIGHT
  const variaveisDensidade = DENSIDADES[preferencias.densidade] ?? DENSIDADES.NORMAL

  for (const [variavel, valor] of Object.entries(variaveisTema)) {
    root.setProperty(variavel, valor)
  }
  for (const [variavel, valor] of Object.entries(variaveisDensidade)) {
    root.setProperty(variavel, valor)
  }
}
