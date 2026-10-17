import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import type { Ocorrencia } from '../types/ocorrencias.types'
import { useAvancarStatusProcessoMutation } from '../hooks/useOcorrencias'
import { formatarProtocoloProcesso } from '../utils/protocolo'
import { labelDeStatusProcesso, proximoStatusProcesso } from '../utils/statusBadge'

interface CardProcessoVinculadoProps {
  ocorrencia: Ocorrencia
  // D33: abrir processo altera a ocorrência — só Admin/Agente.
  podeAbrir: boolean
  // PROCESSOS_SANITARIOS:escrita (V3): Admin, Agente e Veterinário.
  podeAvancar: boolean
}

// D40: o status do processo vinculado é avançado por aqui, pela API real.
// T29: o processo é aberto pelo wizard real (/processos/novo?ocorrencia=<id>),
// com a etapa 1 pré-preenchida e travada nesta ocorrência (DER §3.5) — o
// backend exige o processo completo (doença, laboratório, responsável e
// amostras), que só o wizard coleta. Abrir exige escrita em ocorrências (D33)
// e só é oferecido a ocorrência aberta e sem processo (0..1, D20).
export function CardProcessoVinculado({ ocorrencia, podeAbrir, podeAvancar }: CardProcessoVinculadoProps) {
  const [erro, setErro] = useState<string | null>(null)
  const avancar = useAvancarStatusProcessoMutation(ocorrencia.id)
  const processo = ocorrencia.processoVinculado

  async function handleAvancar(processoId: string, status: NonNullable<ReturnType<typeof proximoStatusProcesso>>) {
    setErro(null)
    try {
      await avancar.mutateAsync({ processoId, status })
    } catch (falha) {
      setErro(mensagemDeRegraDaApi(falha) ?? 'Não foi possível avançar o status do processo. Tente novamente.')
    }
  }

  const alertaErro = erro && (
    <div className="alert danger" role="alert" style={{ marginTop: 8 }}>
      <span className="bullet" />
      <div className="alert-content">{erro}</div>
    </div>
  )

  if (processo) {
    const proximo = proximoStatusProcesso(processo.statusProcesso)
    return (
      <div className="vinc-card" style={{ display: 'block' }}>
        <h4>Processo Sanitário Vinculado</h4>
        <div className="proto-big">{formatarProtocoloProcesso(processo.protocolo)}</div>
        <Link to={`/processos/${processo.id}`} className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}>
          Ver processo
        </Link>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
          {labelDeStatusProcesso(processo.statusProcesso)}
        </div>
        {podeAvancar && proximo && (
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={avancar.isPending}
              onClick={() => void handleAvancar(processo.id, proximo)}
            >
              Avançar status do processo (provisório)
            </button>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Próximo: {labelDeStatusProcesso(proximo)}. Avança um passo por vez, sem registrar resultado.
            </p>
          </div>
        )}
        {alertaErro}
      </div>
    )
  }

  if (!podeAbrir || ocorrencia.statusOcorrencia === 'ENCERRADA') {
    return <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Nenhum processo sanitário vinculado.</p>
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Processo Sanitário</h3>
      </div>
      <div className="card-body">
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
          Nenhum processo sanitário vinculado. O processo é registrado com doença, laboratório, responsável e animais
          amostrados, já vinculado a esta ocorrência.
        </p>
        <Link to={`/processos/novo?ocorrencia=${ocorrencia.id}`} className="btn btn-primary btn-sm w-full">
          Abrir processo sanitário
        </Link>
      </div>
    </div>
  )
}
