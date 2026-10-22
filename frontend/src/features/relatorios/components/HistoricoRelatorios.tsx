import { useState } from 'react'
import { Icon } from '@/components/layout/Icon'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { formatarData } from '@/features/ocorrencias/utils/datas'
import { useHistoricoRelatoriosQuery } from '../hooks/useRelatorios'
import type { FiltroRelatorio, RelatorioGeradoItem } from '../types/relatorios.types'

const TAMANHO_PAGINA = 10

function formatarTamanho(bytes: number | null): string {
  if (bytes == null) return '—'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// parametrosJson e o filtro bruto original (RelatorioGeradoService#serializarParametros)
// — necessario porque periodoInicio/periodoFim do historico ja vem resolvidos
// (ex.: "ano" virou 01/01..31/12); reenviar so o periodo resolvido quebraria
// a validacao do backend para os tipos que usam "ano" ou "janela".
function filtroDeParametros(item: RelatorioGeradoItem): FiltroRelatorio | null {
  try {
    const bruto = JSON.parse(item.parametrosJson ?? 'null') as Partial<FiltroRelatorio> | null
    if (!bruto || typeof bruto.tipo !== 'string') return null
    return { ...bruto, tipo: item.tipo }
  } catch {
    return null
  }
}

interface HistoricoRelatoriosProps {
  onGerarNovamente: (filtro: FiltroRelatorio, nomeExibicao: string) => void
}

// "Relatórios recentes" (docs/prototipo/relatorios.html). Sem persistência de
// arquivo nesta versão: a ação da linha é "Gerar novamente" (reexecuta a
// exportação com os mesmos parâmetros, gerando um novo doc_id), não "Baixar".
export function HistoricoRelatorios({ onGerarNovamente }: HistoricoRelatoriosProps) {
  const [pagina, setPagina] = useState(0)
  const { data, isLoading, isError, refetch } = useHistoricoRelatoriosQuery(pagina, TAMANHO_PAGINA)

  return (
    <div className="recent-section">
      <div className="section-header">
        <h2>Relatórios recentes</h2>
      </div>

      {isError && (
        <ErroComRetry mensagem="Não foi possível carregar os relatórios recentes." onTentarNovamente={refetch} />
      )}

      {isLoading && <div style={{ height: 120 }} className="skel" />}

      {!isLoading && !isError && data && data.itens.length === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="fileText" size={28} />
          </span>
          <h3>Nenhum relatório gerado ainda</h3>
          <p>Gere um relatório acima para ele aparecer aqui.</p>
        </div>
      )}

      {!isLoading && !isError && data && data.itens.length > 0 && (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Relatório</th>
                <th>Período</th>
                <th>Gerado por</th>
                <th>Data</th>
                <th>Tamanho</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.itens.map((item) => {
                const filtro = filtroDeParametros(item)
                return (
                  <tr key={item.docId}>
                    <td>{item.tipoNomeExibicao}</td>
                    <td className="mono">
                      {formatarData(item.periodoInicio)}–{formatarData(item.periodoFim)}
                    </td>
                    <td>{item.geradoPorNome}</td>
                    <td className="mono">{formatarData(item.geradoEm)}</td>
                    <td>{formatarTamanho(item.tamanhoBytes)}</td>
                    <td>
                      <span className="badge badge-available">
                        <span className="badge-dot" />
                        Concluído
                      </span>
                    </td>
                    <td>
                      {filtro ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => onGerarNovamente(filtro, item.tipoNomeExibicao)}
                        >
                          Gerar novamente
                        </button>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="table-footer">
            <span>
              Página {pagina + 1} de {Math.max(data.totalPaginas, 1)}
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
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={pagina >= data.totalPaginas - 1}
                onClick={() => setPagina((atual) => atual + 1)}
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
