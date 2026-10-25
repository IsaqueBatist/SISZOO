import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ModalRegistrarExame } from './ModalRegistrarExame'
import { useExamesQuery } from '../hooks/useHistoricoAnimal'
import type { Exame } from '../types/historico.types'
import { formatarDataBR } from '@/lib/datas'

// F2-007 / RF-A04 (Fase 3 do TG): aba de exames real (antes placeholder), no
// mesmo padrão de AbaProcedimentos — listagem paginada, registro e correção
// (registro clínico imutável: correção cria novo registro vinculado).
interface AbaExamesProps {
  animalId: string
  onRegistroCriado: () => void
}

const LINHAS_SKELETON = [0, 1, 2, 3]

export function AbaExames({ animalId, onRegistroCriado }: AbaExamesProps) {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet'
  const [pagina, setPagina] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)
  const [retificando, setRetificando] = useState<Exame | undefined>(undefined)

  const { data, isLoading, isError } = useExamesQuery(animalId, pagina)
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
            Registrar exame
          </button>
        </div>
      )}

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar os exames.</div>
        </div>
      )}

      {isLoading && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data vet-table">
            <thead>
              <tr>
                <th>Solicitado em</th>
                <th>Exame</th>
                <th>Laboratório</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {LINHAS_SKELETON.map((linha) => (
                <tr key={linha}>
                  <td colSpan={4}>
                    <span className="skel" style={{ display: 'inline-block', width: '80%', height: 14 }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !isError && data && data.itens.length === 0 && (
        <div className="empty">
          <h3>Nenhum exame registrado</h3>
          <p>Use "Registrar exame" para adicionar o primeiro registro (solicitação e, depois, o resultado).</p>
        </div>
      )}

      {!isLoading && !isError && data && data.itens.length > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="data vet-table">
              <thead>
                <tr>
                  <th>Solicitado em</th>
                  <th>Exame</th>
                  <th>Laboratório</th>
                  <th>Resultado</th>
                  {podeEscrever && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {data.itens.map((exame) => (
                  <tr key={exame.id}>
                    <td className="mono">{formatarDataBR(exame.dataSolicitacao)}</td>
                    <td>
                      {exame.tipoExameNome}
                      {exame.statusRegistro === 'RETIFICADO' && (
                        <span className="badge badge-neutral" style={{ marginLeft: 6 }}>
                          Retificado
                        </span>
                      )}
                      {exame.solicitadoPorNome && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Solicitado por {exame.solicitadoPorNome}</div>
                      )}
                    </td>
                    <td>{exame.laboratorioNome ?? 'Interno'}</td>
                    <td>
                      {exame.dataResultado ? (
                        <>
                          <div>{exame.resultado ?? '—'}</div>
                          <div className="mono" style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                            {formatarDataBR(exame.dataResultado)}
                          </div>
                        </>
                      ) : (
                        <span className="badge badge-neutral">Aguardando resultado</span>
                      )}
                    </td>
                    {podeEscrever && (
                      <td>
                        {exame.statusRegistro === 'ATIVO' && (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRetificando(exame)}>
                            {exame.dataResultado ? 'Corrigir' : 'Lançar resultado'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              Mostrando <strong>{data.itens.length}</strong> de <strong>{data.totalItens}</strong> registros
            </span>
            <div className="pager">
              <button type="button" className="btn btn-ghost btn-sm" disabled={pagina === 0} onClick={() => setPagina((atual) => atual - 1)}>
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
        <ModalRegistrarExame animalId={animalId} retifica={retificando} onFechar={fecharModal} onSucesso={handleSucesso} />
      )}
    </div>
  )
}
