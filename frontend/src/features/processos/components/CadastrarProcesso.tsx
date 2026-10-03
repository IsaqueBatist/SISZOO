import { useSearchParams } from 'react-router-dom'
import { useOcorrenciaQuery } from '@/features/ocorrencias/hooks/useOcorrencias'
import { ProcessoForm } from './ProcessoForm'

// Entrada via /processos/novo?ocorrencia=<id> (botão "Abrir Processo
// Sanitário" da ocorrência, RN2). Valida ANTES de montar o wizard: a
// cardinalidade 0..1 do DER (docs/DER.md:485,698) significa que uma
// ocorrência que já tem processoVinculado não pode ser pré-travada aqui —
// mostrar erro em vez de fingir um vínculo válido.
export function CadastrarProcesso() {
  const [searchParams] = useSearchParams()
  const ocorrenciaId = searchParams.get('ocorrencia')

  const { data: ocorrencia, isLoading, isError } = useOcorrenciaQuery(ocorrenciaId ?? undefined)

  if (ocorrenciaId && isLoading) {
    return <p>Carregando…</p>
  }

  if (ocorrenciaId && (isError || !ocorrencia)) {
    return (
      <div className="alert danger" role="alert">
        <span className="bullet" />
        <div className="alert-content">Não foi possível carregar a ocorrência informada para vínculo.</div>
      </div>
    )
  }

  if (ocorrenciaId && ocorrencia?.processoVinculado) {
    return (
      <div className="alert danger" role="alert">
        <span className="bullet" />
        <div className="alert-content">
          Esta ocorrência já tem o processo {ocorrencia.processoVinculado.protocolo} vinculado. Cada ocorrência pode ter no máximo um
          processo sanitário.
        </div>
      </div>
    )
  }

  return <ProcessoForm ocorrenciaIdDaUrl={ocorrenciaId} />
}
