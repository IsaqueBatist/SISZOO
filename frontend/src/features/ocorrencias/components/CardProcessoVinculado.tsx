import { useState } from 'react'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import type { Ocorrencia } from '../types/ocorrencias.types'
import { useAbrirProcessoMutation, useAvancarStatusProcessoMutation } from '../hooks/useOcorrencias'
import { hojeIso } from '../utils/datas'
import { formatarProtocoloProcesso } from '../utils/protocolo'
import { labelDeStatusProcesso, proximoStatusProcesso } from '../utils/statusBadge'

interface CardProcessoVinculadoProps {
  ocorrencia: Ocorrencia
  // D33: abrir processo altera a ocorrência — só Admin/Agente.
  podeAbrir: boolean
  // PROCESSOS_SANITARIOS:escrita (V3): Admin, Agente e Veterinário.
  podeAvancar: boolean
}

// D40: o processo mínimo é aberto e avançado por aqui, pela API real. Sem
// link para /processos/:id — aquela tela ainda é de demonstração.
export function CardProcessoVinculado({ ocorrencia, podeAbrir, podeAvancar }: CardProcessoVinculadoProps) {
  const [urgente, setUrgente] = useState(ocorrencia.urgente)
  const [erro, setErro] = useState<string | null>(null)
  const abrir = useAbrirProcessoMutation(ocorrencia.id)
  const avancar = useAvancarStatusProcessoMutation(ocorrencia.id)
  const processo = ocorrencia.processoVinculado

  async function handleAbrir() {
    setErro(null)
    try {
      await abrir.mutateAsync({ dataAbertura: hojeIso(), urgente })
    } catch (falha) {
      setErro(mensagemDeRegraDaApi(falha) ?? 'Não foi possível abrir o processo. Tente novamente.')
    }
  }

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
              Próximo: {labelDeStatusProcesso(proximo)}. Até a integração do módulo de processos.
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
          Nenhum processo sanitário vinculado. O processo é aberto com a data de hoje.
        </p>
        <label className="flex gap-2" style={{ alignItems: 'center', fontSize: 13, marginBottom: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={urgente} onChange={(event) => setUrgente(event.target.checked)} />
          Processo urgente
        </label>
        <button type="button" className="btn btn-primary btn-sm w-full" disabled={abrir.isPending} onClick={() => void handleAbrir()}>
          {abrir.isPending ? 'Abrindo…' : 'Abrir processo sanitário'}
        </button>
        {alertaErro}
      </div>
    </div>
  )
}
