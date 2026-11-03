import { descricaoAcao } from '@/features/auditoria/utils/descricaoAcao'
import { diferencasDoEvento, justificativaDoEvento } from '@/features/auditoria/utils/diferencasPayload'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { formatarDataHoraBR } from '@/lib/datas'
import { useAlteracoesProcessoQuery } from '../hooks/useProcessos'

export function CardHistoricoAlteracoes({ processoId }: { processoId: string }) {
  const { data: eventos, isLoading, isError, refetch } = useAlteracoesProcessoQuery(processoId)

  return (
    <div className="card">
      <div className="card-header">
        <h3>Histórico de alterações</h3>
      </div>
      <div className="card-body col gap-3">
        {isLoading && <p className="hint">Carregando histórico…</p>}
        {isError && <ErroComRetry mensagem="Não foi possível carregar o histórico." onTentarNovamente={() => void refetch()} />}
        {eventos?.length === 0 && <p className="hint">Nenhuma alteração registrada.</p>}
        {eventos
          ?.slice()
          .reverse()
          .map((evento) => {
            const justificativa = justificativaDoEvento(evento.payloadDepois)
            const diferencas = evento.acao === 'CRIACAO' ? [] : diferencasDoEvento(evento.payloadAntes, evento.payloadDepois)
            return (
              <div key={evento.id} className="col gap-1">
                <div style={{ fontSize: 13 }}>
                  <strong>{evento.usuarioEmail ?? 'Sistema'}</strong> {descricaoAcao(evento.acao).verbo} o processo
                </div>
                <div className="texto-auxiliar">
                  {formatarDataHoraBR(evento.ocorreuEm)}
                </div>
                {justificativa && (
                  <div style={{ fontSize: 13 }}>
                    <strong>Motivo:</strong> {justificativa}
                  </div>
                )}
                {diferencas.length > 0 && (
                  <ul style={{ fontSize: 12, margin: 0, paddingLeft: 16 }}>
                    {diferencas.map((diferenca) => (
                      <li key={diferenca.campo}>
                        {diferenca.campo}: {diferenca.antes} → {diferenca.depois}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
