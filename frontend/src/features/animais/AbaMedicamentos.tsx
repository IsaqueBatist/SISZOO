import { useState } from 'react'
import { Icon } from '../../components/layout/Icon'
import { useAuth } from '../auth/AuthContext'
import { ModalRegistrarMedicamento } from './ModalRegistrarMedicamento'
import { LABELS_STATUS_PRESCRICAO, LABELS_UNIDADE_DOSE, LABELS_UNIDADE_FREQUENCIA, LABELS_VIA_ADMINISTRACAO } from './historicoLabels'
import { usePrescricoesQuery } from './useHistoricoAnimal'
import type { Prescricao } from './historico.types'

interface AbaMedicamentosProps {
  animalId: string
  onRegistroCriado: () => void
}

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function AbaMedicamentos({ animalId, onRegistroCriado }: AbaMedicamentosProps) {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet'
  const [pagina, setPagina] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)
  const [retificando, setRetificando] = useState<Prescricao | undefined>(undefined)

  const { data, isLoading, isError } = usePrescricoesQuery(animalId, pagina)
  const totalPaginas = Math.max(data?.totalPaginas ?? 1, 1)

  function fecharModal() {
    setModalAberto(false)
    setRetificando(undefined)
  }

  function handleSucesso() {
    fecharModal()
    onRegistroCriado()
  }

  return (
    <div>
      {podeEscrever && (
        <div className="flex" style={{ justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setModalAberto(true)}>
            Registrar medicamento
          </button>
        </div>
      )}

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar as prescrições.</div>
        </div>
      )}

      {isLoading && (
        <div className="med-grid">
          {[0, 1].map((linha) => (
            <div key={linha} className="med-card">
              <span className="skel" style={{ display: 'inline-block', width: '80%', height: 14 }} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && data && data.itens.length === 0 && (
        <div className="empty">
          <h3>Nenhum medicamento registrado</h3>
          <p>Use "Registrar medicamento" para adicionar a primeira prescrição.</p>
        </div>
      )}

      {!isLoading && !isError && data && data.itens.length > 0 && (
        <>
          <div className="med-grid">
            {data.itens.map((prescricao) => (
              <div key={prescricao.id} className="med-card">
                <h4>
                  <Icon name="syringe" size={14} />
                  {prescricao.medicamentoNome}
                  {prescricao.statusRegistro === 'RETIFICADO' && (
                    <span className="badge badge-neutral" style={{ marginLeft: 6 }}>
                      Retificado
                    </span>
                  )}
                  <span className="badge badge-neutral" style={{ marginLeft: 'auto' }}>
                    {LABELS_STATUS_PRESCRICAO[prescricao.status]}
                  </span>
                </h4>
                <div className="kv">
                  <span className="k">Dose:</span>
                  <span>
                    {prescricao.doseQuantidade}
                    {LABELS_UNIDADE_DOSE[prescricao.doseUnidade]} · {prescricao.frequenciaAplicada}x a cada{' '}
                    {LABELS_UNIDADE_FREQUENCIA[prescricao.unidadeFrequencia]} · {LABELS_VIA_ADMINISTRACAO[prescricao.viaAdministracao]}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">Início:</span>
                  <span className="mono">{formatarData(prescricao.dataInicio)}</span>
                </div>
                <div className="kv">
                  <span className="k">Término previsto:</span>
                  <span className="mono">{formatarData(prescricao.dataFimPrevista)}</span>
                </div>
                {prescricao.dataFimReal && (
                  <div className="kv">
                    <span className="k">Encerrado em:</span>
                    <span className="mono">{formatarData(prescricao.dataFimReal)}</span>
                  </div>
                )}
                <div className="kv">
                  <span className="k">Responsável:</span>
                  <span>{prescricao.prescritoPorNome ?? '—'}</span>
                </div>
                {podeEscrever && prescricao.statusRegistro === 'ATIVO' && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => setRetificando(prescricao)}
                  >
                    Corrigir / alterar status
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="table-footer">
            <span>
              Mostrando <strong>{data.itens.length}</strong> de <strong>{data.totalItens}</strong> prescrições
            </span>
            <div className="pager">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={pagina === 0}
                onClick={() => setPagina((atual) => atual - 1)}
              >
                Anterior
              </button>
              <span className="mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Página {pagina + 1} de {totalPaginas}
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={pagina >= totalPaginas - 1}
                onClick={() => setPagina((atual) => atual + 1)}
              >
                Próximo
              </button>
            </div>
          </div>
        </>
      )}

      {(modalAberto || retificando) && (
        <ModalRegistrarMedicamento
          animalId={animalId}
          retifica={retificando}
          onFechar={fecharModal}
          onSucesso={handleSucesso}
        />
      )}
    </div>
  )
}
