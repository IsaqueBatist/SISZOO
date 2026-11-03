import { Link, Navigate, useParams } from 'react-router-dom'
import { OcorrenciaForm } from './OcorrenciaForm'
import { useOcorrenciaQuery } from '../hooks/useOcorrencias'

export function EditarOcorrencia() {
  const { id } = useParams<{ id: string }>()
  const { data: ocorrencia, isLoading, isError } = useOcorrenciaQuery(id)

  if (isLoading) {
    return (
      <div className="form-shell">
        <p>Carregando ocorrência…</p>
      </div>
    )
  }

  if (isError || !ocorrencia) {
    return (
      <div className="form-shell">
        <div className="alert danger" role="alert">
          <div className="alert-content">Não foi possível carregar esta ocorrência.</div>
        </div>
        <Link to="/ocorrencias" className="link-voltar">
          ← Voltar para Ocorrências
        </Link>
      </div>
    )
  }

  if (ocorrencia.statusOcorrencia === 'ENCERRADA') {
    return <Navigate to={`/ocorrencias/${ocorrencia.id}`} replace />
  }

  return <OcorrenciaForm ocorrencia={ocorrencia} />
}
