import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/layout/Icon'
import type { Animal } from '@/features/animais/types/animais.types'

interface ResidentesBaiaProps {
  animais: Animal[]
}

const MAX_AVATARES = 5

function AvatarResidente({ animal }: { animal: Animal }) {
  const [falhouCarregar, setFalhouCarregar] = useState(false)
  const mostrarFoto = animal.fotoUrl && !falhouCarregar

  return (
    <Link to={`/animais/${animal.id}`} className="resi-avatar" title={animal.nome}>
      {mostrarFoto ? (
        <img src={animal.fotoUrl as string} alt="" loading="lazy" onError={() => setFalhouCarregar(true)} />
      ) : (
        <Icon name="paw" size={12} />
      )}
    </Link>
  )
}

// Fallback de ícone de pata quando não há fotoUrl ou a imagem falha ao
// carregar (internet instável do CCZ) — nunca deixa o avatar quebrado.
export function ResidentesBaia({ animais }: ResidentesBaiaProps) {
  if (animais.length === 0) {
    return <span className="resi-empty">Vazia</span>
  }

  const exibidos = animais.slice(0, MAX_AVATARES)
  const excedente = animais.length - exibidos.length

  return (
    <div className="resi-list">
      {exibidos.map((animal) => (
        <AvatarResidente key={animal.id} animal={animal} />
      ))}
      {excedente > 0 && <span className="resi-more">+{excedente}</span>}
    </div>
  )
}
