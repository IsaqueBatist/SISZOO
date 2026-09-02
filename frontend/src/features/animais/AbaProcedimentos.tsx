import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ModalRegistrarProcedimento } from './ModalRegistrarProcedimento'
import { useProcedimentosQuery } from './useHistoricoAnimal'
import type { Procedimento } from './historico.types'

interface AbaProcedimentosProps {
  animalId: string
  onRegistroCriado: () => void
}

const LINHAS_SKELETON = [0, 1, 2, 3]

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function AbaProcedimentos({ animalId, onRegistroCriado }: AbaProcedimentosProps) {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet'
  const [pagina, setPagina] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)
  const [retificando, setRetificando] = useState<Procedimento | undefined>(undefined)

  const { data, isLoading, isError } = useProcedimentosQuery(animalId, pagina)
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
            Registrar procedimento
          </button>
        </div>
      )}

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar os procedimentos.</div>
        </div>
      )}

      {isLoading && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data vet-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Veterinário</th>
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
          <h3>Nenhum procedimento registrado</h3>
          <p>Use "Registrar procedimento" para adicionar o primeiro registro (inclui castrações e cirurgias).</p>
        </div>
      )}

      {!isLoading && !isError && data && data.itens.length > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="data vet-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Veterinário</th>
                  <th>Resultado</th>
                  {podeEscrever && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {data.itens.map((procedimento) => (
                  <tr key={procedimento.id}>
                    <td className="mono">{formatarData(procedimento.data)}</td>
                    <td>
                      {procedimento.tipoProcedimentoNome}
                      {procedimento.statusRegistro === 'RETIFICADO' && (
                        <span className="badge badge-neutral" style={{ marginLeft: 6 }}>
                          Retificado
                        </span>
                      )}
                      {procedimento.descricao && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{procedimento.descricao}</div>
                      )}
                    </td>
                    <td>{procedimento.executadoPorNome ?? '—'}</td>
                    <td>{procedimento.resultado ?? '—'}</td>
                    {podeEscrever && (
                      <td>
                        {procedimento.statusRegistro === 'ATIVO' && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setRetificando(procedimento)}
                          >
                            Corrigir
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
        <ModalRegistrarProcedimento
          animalId={animalId}
          retifica={retificando}
          onFechar={fecharModal}
          onSucesso={handleSucesso}
        />
      )}
    </div>
  )
}
