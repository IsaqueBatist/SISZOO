import { Link, useParams } from 'react-router-dom'
import { AnimalForm } from './AnimalForm'
import { useAnimalQuery } from './useAnimais'

export function EditarAnimal() {
  const { id } = useParams<{ id: string }>()
  const { data: animal, isLoading, isError } = useAnimalQuery(id)

  if (isLoading) {
    return (
      <div className="wizard-shell">
        <p>Carregando animal…</p>
      </div>
    )
  }

  if (isError || !animal) {
    return (
      <div className="wizard-shell">
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar este animal.</div>
        </div>
        <Link to="/animais" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          ← Voltar para Animais
        </Link>
      </div>
    )
  }

  return <AnimalForm animal={animal} />
}
