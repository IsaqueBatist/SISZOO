import { useEffect } from 'react'
import { useTimelineAnimal } from '../hooks/useTimelineAnimal'
import { Timeline } from './Timeline'
import type { Animal } from '../types/animais.types'

interface AbaHistoricoProps {
  animalId: string
  animal: Animal | undefined
  refreshKey: number
}

export function AbaHistorico({ animalId, animal, refreshKey }: AbaHistoricoProps) {
  const { eventos, carregando, fimDoHistorico, erro, carregarMais } = useTimelineAnimal(animalId, animal, refreshKey)

  useEffect(() => {
    if (eventos.length === 0 && !carregando && !fimDoHistorico && !erro) {
      carregarMais(20)
    }
  }, [eventos.length, carregando, fimDoHistorico, erro, carregarMais])

  return (
    <Timeline
      eventos={eventos}
      carregando={carregando}
      fimDoHistorico={fimDoHistorico}
      erro={erro}
      onCarregarMais={() => carregarMais(20)}
    />
  )
}
