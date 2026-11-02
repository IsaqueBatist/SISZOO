import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import { useAnimaisQuery } from '@/features/animais/hooks/useAnimais'
import type { Animal } from '@/features/animais/types/animais.types'

const TAMANHO_BUSCA_ANIMAL = 8

interface BuscaAnimalCanilProps {
  numero: number
  erro?: string
  onSelecionar: (animal: Animal) => void
}

export function BuscaAnimalCanil({ numero, erro, onSelecionar }: BuscaAnimalCanilProps) {
  const [busca, setBusca] = useState('')
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [ativa, setAtiva] = useState(-1)
  const idLista = useId()

  const [buscaDebounced, setBuscaDebounced] = useState('')
  useEffect(() => {
    const timeout = setTimeout(() => setBuscaDebounced(busca.trim()), 300)
    return () => clearTimeout(timeout)
  }, [busca])
  const { data: resultado } = useAnimaisQuery({ q: buscaDebounced || undefined, pagina: 0, tamanho: TAMANHO_BUSCA_ANIMAL }, true)
  const sugestoes = resultado?.itens ?? []
  const listaAberta = mostrarSugestoes && sugestoes.length > 0

  function aoPressionarTecla(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setMostrarSugestoes(false)
      setAtiva(-1)
      return
    }
    if (sugestoes.length === 0) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const passo = event.key === 'ArrowDown' ? 1 : -1
      setMostrarSugestoes(true)
      setAtiva((atual) => (atual + passo + sugestoes.length) % sugestoes.length)
    } else if (event.key === 'Enter' && listaAberta && ativa >= 0) {
      event.preventDefault()
      onSelecionar(sugestoes[ativa])
    }
  }

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
          setAtiva(-1)
        }}
        onFocus={() => setMostrarSugestoes(true)}
        onKeyDown={aoPressionarTecla}
        role="combobox"
        aria-expanded={listaAberta}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={listaAberta && ativa >= 0 ? `${idLista}-${ativa}` : undefined}
        aria-invalid={erro ? true : undefined}
        aria-label={`Buscar animal do canil para o animal amostrado ${numero}`}
      />
      {listaAberta && (
        <div className="animal-suggestions show" id={idLista} role="listbox" aria-label="Animais encontrados">
          {sugestoes.map((animal, indice) => (
            <div
              key={animal.id}
              id={`${idLista}-${indice}`}
              role="option"
              aria-selected={indice === ativa}
              className={`sug${indice === ativa ? ' ativa' : ''}`}
              onClick={() => onSelecionar(animal)}
            >
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
