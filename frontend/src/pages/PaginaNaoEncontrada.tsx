import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../components/layout/Icon'

export function PaginaNaoEncontrada() {
  const location = useLocation()

  return (
    <div className="empty">
      <span className="ico">
        <Icon name="clipboard" size={28} />
      </span>
      <h1 style={{ fontSize: 'var(--text-lg)' }}>Página não encontrada</h1>
      <p>
        O endereço <span className="mono">{location.pathname}</span> não existe. Confira o link ou volte ao início.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        Ir para o início
      </Link>
    </div>
  )
}
