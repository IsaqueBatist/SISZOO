import { useEffect, useState } from 'react'
import { useAnimaisQuery } from '@/features/animais/hooks/useAnimais'
import type { Animal } from '@/features/animais/types/animais.types'

const TAMANHO_BUSCA_ANIMAL = 8

interface BuscaAnimalCanilProps {
  numero: number
  erro?: string
  onSelecionar: (animal: Animal) => void
}

// Busca do animal do canil numa amostra. Só é montada enquanto a amostra é do
// canil e ainda não tem animal: a consulta não roda fora disso, e o texto
// digitado some ao escolher ou ao trocar de modo.
export function BuscaAnimalCanil({ numero, erro, onSelecionar }: BuscaAnimalCanilProps) {
  const [busca, setBusca] = useState('')
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)

  // T45: busca com o mesmo debounce de 300 ms da tela de Animais (antes, uma
  // requisição por tecla).
  const [buscaDebounced, setBuscaDebounced] = useState('')
  useEffect(() => {
    const timeout = setTimeout(() => setBuscaDebounced(busca.trim()), 300)
    return () => clearTimeout(timeout)
  }, [busca])
  const { data: resultado } = useAnimaisQuery({ q: buscaDebounced || undefined, pagina: 0, tamanho: TAMANHO_BUSCA_ANIMAL }, true)
  const sugestoes = resultado?.itens ?? []

  return (
    <div className="animal-search-wrap">
      <input
        className={`input${erro ? ' error' : ''}`}
        type="search"
        placeholder="Buscar por nome ou microchip..."
        value={busca}
        onChange={(event) => {
          setBusca(event.target.value)
          setMostrarSugestoes(true)
        }}
        onFocus={() => setMostrarSugestoes(true)}
        aria-label={`Buscar animal do canil para o animal amostrado ${numero}`}
      />
      {mostrarSugestoes && sugestoes.length > 0 && (
        <div className="animal-suggestions show">
          {sugestoes.map((animal) => (
            <div key={animal.id} className="sug" onClick={() => onSelecionar(animal)}>
              <span className="name">{animal.nome}</span>
              <span className="chip">{animal.microchip ?? 'sem microchip'}</span>
              <span className="meta">
                {animal.especieNome} · {animal.sexo}
              </span>
            </div>
          ))}
        </div>
      )}
      {erro && <span className="err">{erro}</span>}
    </div>
  )
}
