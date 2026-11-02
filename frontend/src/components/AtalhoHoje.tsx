import { hojeEmItu } from '@/lib/datas'

interface AtalhoHojeProps {
  onEscolher: (hoje: string) => void
}

export function AtalhoHoje({ onEscolher }: AtalhoHojeProps) {
  return (
    <button type="button" className="atalho-data" aria-label="Preencher com a data de hoje" onClick={() => onEscolher(hojeEmItu())}>
      Hoje
    </button>
  )
}
