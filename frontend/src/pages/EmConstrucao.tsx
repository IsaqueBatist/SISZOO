import { useLocation } from 'react-router-dom'
import { Icon } from '../components/layout/Icon'

export function EmConstrucao() {
  const location = useLocation()

  return (
    <div className="empty">
      <span className="ico">
        <Icon name="clipboard" size={28} />
      </span>
      <h3>Em construção</h3>
      <p>
        A tela <span className="mono">{location.pathname}</span> ainda não foi implementada.
        Ela chega numa próxima tarefa do Kanban.
      </p>
    </div>
  )
}
