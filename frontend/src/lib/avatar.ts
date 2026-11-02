export function corAvatar(seed: string): string {
  const hue = Math.abs([...seed].reduce((acumulado, char) => acumulado + char.charCodeAt(0), 0)) % 360
  return `hsl(${hue}, 35%, 34%)`
}
