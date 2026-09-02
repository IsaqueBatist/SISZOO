import { useState } from 'react'
import { ModalRegistrarVacina } from './ModalRegistrarVacina'
import { badgeReforcoVacina } from './regrasVacina'
import { useVacinacoesQuery } from './useHistoricoAnimal'
import type { Vacinacao } from './historico.types'

interface AbaVacinasProps {
  animalId: string
  podeEscrever: boolean
  onRegistroCriado: () => void
}

const LINHAS_SKELETON = [0, 1, 2, 3]

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function AbaVacinas({ animalId, podeEscrever, onRegistroCriado }: AbaVacinasProps) {
  const [pagina, setPagina] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)
  const [retificando, setRetificando] = useState<Vacinacao | undefined>(undefined)

  const { data, isLoading, isError } = useVacinacoesQuery(animalId, pagina)
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
            Registrar vacina
          </button>
        </div>
      )}

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar as vacinas.</div>
        </div>
      )}

      {isLoading && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data vet-table">
            <thead>
              <tr>
                <th>Vacina</th>
                <th>Aplicação</th>
                <th>Próx. Reforço</th>
                <th>Veterinário</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {LINHAS_SKELETON.map((linha) => (
                <tr key={linha}>
                  <td colSpan={5}>
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
          <h3>Nenhuma vacina registrada</h3>
          <p>Use "Registrar vacina" para adicionar o primeiro registro.</p>
        </div>
      )}

      {!isLoading && !isError && data && data.itens.length > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="data vet-table">
              <thead>
                <tr>
                  <th>Vacina</th>
                  <th>Aplicação</th>
                  <th>Próx. Reforço</th>
                  <th>Veterinário</th>
                  <th>Status</th>
                  {podeEscrever && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {data.itens.map((vacinacao) => {
                  const badge = badgeReforcoVacina(vacinacao.dataValidade)
                  return (
                    <tr key={vacinacao.id} className={badge?.classeLinha || undefined}>
                      <td>
                        {vacinacao.vacinaNome}
                        {vacinacao.statusRegistro === 'RETIFICADO' && (
                          <span className="badge badge-neutral" style={{ marginLeft: 6 }}>
                            Retificado
                          </span>
                        )}
                      </td>
                      <td className="mono">{formatarData(vacinacao.dataAplicacao)}</td>
                      <td className="mono">{formatarData(vacinacao.dataValidade)}</td>
                      <td>{vacinacao.aplicadoPorNome ?? '—'}</td>
                      <td>{badge && <span className={`badge ${badge.classeBadge}`}>{badge.label}</span>}</td>
                      {podeEscrever && (
                        <td>
                          {vacinacao.statusRegistro === 'ATIVO' && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setRetificando(vacinacao)}
                            >
                              Corrigir
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              Mostrando <strong>{data.itens.length}</strong> de <strong>{data.totalItens}</strong> vacinas
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
        <ModalRegistrarVacina
          animalId={animalId}
          retifica={retificando}
          onFechar={fecharModal}
          onSucesso={handleSucesso}
        />
      )}
    </div>
  )
}
