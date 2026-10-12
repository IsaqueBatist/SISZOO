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
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar esta ocorrência.</div>
        </div>
        <Link to="/ocorrencias" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          ← Voltar para Ocorrências
        </Link>
      </div>
    )
  }

  // D10: edição só até o encerramento — acesso direto à URL de uma
  // encerrada volta para o detalhe (o backend também recusaria o PUT).
  if (ocorrencia.statusOcorrencia === 'ENCERRADA') {
    return <Navigate to={`/ocorrencias/${ocorrencia.id}`} replace />
  }

  return <OcorrenciaForm ocorrencia={ocorrencia} />
}
