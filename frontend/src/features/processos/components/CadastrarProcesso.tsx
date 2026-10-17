import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOcorrenciaQuery } from '@/features/ocorrencias/hooks/useOcorrencias'
import { formatarProtocoloOcorrencia, formatarProtocoloProcesso } from '@/features/ocorrencias/utils/protocolo'
import { ProcessoForm } from './ProcessoForm'

function Recusa({ mensagem, voltarPara }: { mensagem: string; voltarPara: string }) {
  return (
    <>
      <div className="alert danger" role="alert">
        <span className="bullet" />
        <div className="alert-content">{mensagem}</div>
      </div>
      <Link to={voltarPara} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
        ← Voltar
      </Link>
    </>
  )
}

// Entrada via /processos/novo?ocorrencia=<id> — botão "Abrir processo
// sanitário" do detalhe da ocorrência (DER §3.5: a etapa 1 vem pré-preenchida).
// Antes de montar o wizard, confere a ocorrência real: vincular exige escrita
// em ocorrências (D33), e o backend recusa ocorrência encerrada (D20) ou que já
// tem processo (0..1) — mostrar o motivo aqui, em vez de deixar o usuário
// preencher as quatro etapas para receber o erro no fim.
export function CadastrarProcesso() {
  const [searchParams] = useSearchParams()
  const ocorrenciaId = searchParams.get('ocorrencia')
  const { roleKey } = useAuth()
  const podeVincular = roleKey === 'admin' || roleKey === 'agente'

  const { data: ocorrencia, isLoading, isError } = useOcorrenciaQuery(ocorrenciaId && podeVincular ? ocorrenciaId : undefined)

  if (!ocorrenciaId) {
    return <ProcessoForm ocorrenciaDaUrl={null} podeVincular={podeVincular} />
  }

  if (!podeVincular) {
    return (
      <Recusa
        mensagem="Abrir processo vinculado a uma ocorrência exige permissão de escrita em ocorrências e denúncias."
        voltarPara="/processos"
      />
    )
  }

  if (isLoading) {
    return <p>Carregando ocorrência…</p>
  }

  if (isError || !ocorrencia) {
    return <Recusa mensagem="Não foi possível carregar a ocorrência informada para vínculo." voltarPara="/ocorrencias" />
  }

  const voltarParaOcorrencia = `/ocorrencias/${ocorrencia.id}`

  if (ocorrencia.processoVinculado) {
    return (
      <Recusa
        mensagem={`A ocorrência ${formatarProtocoloOcorrencia(ocorrencia.protocolo)} já tem o processo ${formatarProtocoloProcesso(ocorrencia.processoVinculado.protocolo)} vinculado. Cada ocorrência pode ter no máximo um processo sanitário.`}
        voltarPara={voltarParaOcorrencia}
      />
    )
  }

  if (ocorrencia.statusOcorrencia === 'ENCERRADA') {
    return (
      <Recusa
        mensagem={`A ocorrência ${formatarProtocoloOcorrencia(ocorrencia.protocolo)} está encerrada e não aceita processo vinculado.`}
        voltarPara={voltarParaOcorrencia}
      />
    )
  }

  return (
    <ProcessoForm
      ocorrenciaDaUrl={{
        id: ocorrencia.id,
        protocolo: ocorrencia.protocolo,
        tipoOcorrenciaNome: ocorrencia.tipoOcorrenciaNome,
        bairro: ocorrencia.bairro,
      }}
      podeVincular={podeVincular}
    />
  )
}
