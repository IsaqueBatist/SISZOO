import { useEffect } from 'react'
import { useTimelineAnimal } from './useTimelineAnimal'
import { Timeline } from './Timeline'
import type { Animal } from './animais.types'

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
    // Dispara ao montar e sempre que o hook reinicia (eventos volta a [])
    // após um novo registro criado em qualquer aba — ver useTimelineAnimal.
    // carregarMais só muda de identidade quando animalId muda (useCallback),
    // então incluí-la aqui não gera execuções extras do efeito.
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
