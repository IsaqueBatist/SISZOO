// Ícones portados de docs/prototipo/assets/shell.js e icons.js (mesmos paths SVG),
// recriados como componentes React em vez de strings injetadas via innerHTML.

export type IconName =
  | 'home'
  | 'paw'
  | 'alert'
  | 'clipboard'
  | 'chart'
  | 'grid'
  | 'users'
  | 'cog'
  | 'chevronLeft'
  | 'chevronDown'
  | 'search'
  | 'mail'
  | 'lock'
  | 'eye'
  | 'logout'
  | 'syringe'
  | 'heart'
  | 'plus'
  | 'x'
  | 'edit'

interface IconProps {
  name: IconName
  size?: number
}

const STROKE_PATHS: Partial<Record<IconName, string>> = {
  home: '<path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/>',
  alert: '<path d="M12 3 2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17.5" r="0.5" fill="currentColor"/>',
  clipboard: '<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 4h6v3H9z"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/>',
  chart: '<line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="11" width="3" height="8"/><rect x="11" y="6" width="3" height="13"/><rect x="16" y="14" width="3" height="5"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 19c1-3 3-5 6-5s5 2 6 5"/><path d="M15 19c.5-2 2-3 3.5-3"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2.1-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2l-.4-2.6h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2.1 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2.1 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2.1-1.6c.1-.4.1-.8.1-1.2z"/>',
  chevronLeft: '<polyline points="14 6 8 12 14 18"/>',
  chevronDown: '<polyline points="6 9 12 15 18 9"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="20" y2="20"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  logout: '<path d="M14 4h4v16h-4"/><polyline points="9 16 4 12 9 8"/><line x1="4" y1="12" x2="14" y2="12"/>',
  syringe: '<path d="M14 3l7 7"/><path d="M16 5l-9 9 3 3 9-9"/><path d="M10 17l-4 4"/><path d="M6 13l4 4"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  edit: '<path d="M4 20h4l10-10-4-4L4 16v4z"/><line x1="14" y1="6" x2="18" y2="10"/>',
}

const FILL_PATHS: Partial<Record<IconName, string>> = {
  paw: '<circle cx="6" cy="9" r="2"/><circle cx="10" cy="5" r="2"/><circle cx="14" cy="5" r="2"/><circle cx="18" cy="9" r="2"/><path d="M12 11c-3 0-5 2.5-5 5 0 2 1.5 3 3 3 1 0 1.5-.5 2-.5s1 .5 2 .5c1.5 0 3-1 3-3 0-2.5-2-5-5-5z"/>',
  heart: '<path d="M12 21s-7-4.5-9-9c-1.5-3.5 1-7 4.5-7 2 0 3.5 1 4.5 2.5C13 6 14.5 5 16.5 5 20 5 22.5 8.5 21 12c-2 4.5-9 9-9 9z"/>',
}

export function Icon({ name, size = 18 }: IconProps) {
  if (name in FILL_PATHS) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: FILL_PATHS[name] ?? '' }}
      />
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: STROKE_PATHS[name] ?? '' }}
    />
  )
}
