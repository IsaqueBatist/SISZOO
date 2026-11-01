import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ModalRegistrarVacina } from './ModalRegistrarVacina'
import { badgeReforcoVacina } from '../utils/regrasVacina'
import { useVacinacoesQuery } from '../hooks/useHistoricoAnimal'
import type { Vacinacao } from '../types/historico.types'
import { formatarDataBR } from '@/lib/datas'

interface AbaVacinasProps {
  animalId: string
  onRegistroCriado: () => void
}

const LINHAS_SKELETON = [0, 1, 2, 3]

export function AbaVacinas({ animalId, onRegistroCriado }: AbaVacinasProps) {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet'
  const [pagina, setPagina] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)
  const [retificando, setRetificando] = useState<Vacinacao | undefined>(undefined)
  const [reforcandoDe, setReforcandoDe] = useState<Vacinacao | undefined>(undefined)

  const { data, isLoading, isError } = useVacinacoesQuery(animalId, pagina)
  const totalPaginas = Math.max(data?.totalPaginas ?? 1, 1)


  // Qual aplicação de cada vacina é a que vale hoje (a mais recente, ativa) —
  // é só nela que faz sentido oferecer o reforço. Mesma ideia da RN-A02, que
  // ignora aplicações anteriores ao calcular o alerta.
  const idDaAplicacaoVigentePorVacina = new Map<string, string>()
  for (const item of data?.itens ?? []) {
    if (item.statusRegistro !== 'ATIVO') continue
    const vigente = idDaAplicacaoVigentePorVacina.get(item.vacinaCodigo)
    const dataVigente = data?.itens.find((outro) => outro.id === vigente)?.dataAplicacao
    if (!vigente || !dataVigente || item.dataAplicacao > dataVigente) {
      idDaAplicacaoVigentePorVacina.set(item.vacinaCodigo, item.id)
    }
  }
  function fecharModal() {
    setModalAberto(false)
    setRetificando(undefined)
    setReforcandoDe(undefined)
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
                  // O reforço só é oferecido quando ele está de fato na hora
                  // (dentro dos 7 dias ou já vencido) e só na aplicação que
                  // conta — a mais recente daquela vacina (RN-A02). O botão do
                  // topo continua disponível para aplicar fora dessa janela.
                  const podeRegistrarReforco =
                    podeEscrever &&
                    vacinacao.statusRegistro === 'ATIVO' &&
                    (badge?.status === 'vencida' || badge?.status === 'a_vencer') &&
                    vacinacao.id === idDaAplicacaoVigentePorVacina.get(vacinacao.vacinaCodigo)
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
                      <td className="mono">{formatarDataBR(vacinacao.dataAplicacao)}</td>
                      <td className="mono">{formatarDataBR(vacinacao.dataValidade)}</td>
                      <td>{vacinacao.aplicadoPorNome ?? '—'}</td>
                      <td>{badge && <span className={`badge ${badge.classeBadge}`}>{badge.label}</span>}</td>
                      {podeEscrever && (
                        <td>
                          {podeRegistrarReforco && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setReforcandoDe(vacinacao)}
                            >
                              Registrar reforço
                            </button>
                          )}
                          {vacinacao.statusRegistro === 'ATIVO' && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              // Deixa explícito o que "Corrigir" faz: é fácil
                              // confundir com o registro do reforço, e a
                              // correção marca a aplicação original como
                              // retificada, como se não tivesse valido.
                              title="Corrigir um erro deste registro. Para uma nova aplicação, use Registrar reforço."
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

      {(modalAberto || retificando || reforcandoDe) && (
        <ModalRegistrarVacina
          animalId={animalId}
          reforco={Boolean(reforcandoDe)}
          vacinaPreSelecionada={reforcandoDe?.vacinaCodigo}
          retifica={retificando}
          onFechar={fecharModal}
          onSucesso={handleSucesso}
        />
      )}
    </div>
  )
}
