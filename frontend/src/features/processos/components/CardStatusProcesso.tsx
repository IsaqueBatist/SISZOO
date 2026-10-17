import { useState } from 'react'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import type { Processo } from '../types/processos.types'
import { useAvancarStatusProcessoMutation } from '../hooks/useProcessos'
import { labelDe, proximoStatusProcesso, STATUS_PROCESSO_OPCOES } from '../utils/processosCatalogos'

interface CardStatusProcessoProps {
  processo: Processo
  // PROCESSOS_SANITARIOS:escrita (V3): Admin, Veterinário e Agente.
  podeEscrever: boolean
}

// D18: PATCH /api/processos/{id}/status provisório — avança um passo por vez,
// sem registrar resultado nem notificar. O registro do resultado (com
// desfecho e notificação, regra 19) é da task de resultado e ainda não tem
// endpoint; por isso não há formulário de resultado aqui.
export function CardStatusProcesso({ processo, podeEscrever }: CardStatusProcessoProps) {
  const [erro, setErro] = useState<string | null>(null)
  const avancar = useAvancarStatusProcessoMutation(processo.id)
  const proximo = proximoStatusProcesso(processo.statusProcesso)

  async function handleAvancar() {
    if (!proximo) return
    setErro(null)
    try {
      await avancar.mutateAsync(proximo)
    } catch (falha) {
      setErro(mensagemDeRegraDaApi(falha) ?? 'Não foi possível avançar o status do processo. Tente novamente.')
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Status do processo</h3>
      </div>
      <div className="card-body">
        <p style={{ fontSize: 13 }}>
          Status atual: <strong>{labelDe(STATUS_PROCESSO_OPCOES, processo.statusProcesso)}</strong>
        </p>
        {!proximo && (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>Processo concluído.</p>
        )}
        {podeEscrever && proximo && (
          <div style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-outline btn-sm" disabled={avancar.isPending} onClick={() => void handleAvancar()}>
              {avancar.isPending ? 'Avançando…' : 'Avançar status do processo (provisório)'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Próximo: {labelDe(STATUS_PROCESSO_OPCOES, proximo)}. Avança um passo por vez, sem registrar resultado, até a
              entrega do registro de resultado laboratorial.
            </p>
          </div>
        )}
        {erro && (
          <div className="alert danger" role="alert" style={{ marginTop: 8 }}>
            <span className="bullet" />
            <div className="alert-content">{erro}</div>
          </div>
        )}
      </div>
    </div>
  )
}
