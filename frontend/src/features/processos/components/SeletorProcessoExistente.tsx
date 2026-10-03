import { useState } from 'react'
import { labelDeDoenca } from '../utils/processosCatalogos'
import './SeletorVinculo.css'
import { badgeDeStatusProcesso } from '../utils/statusBadge'
import { useProcessosQuery } from '../hooks/useProcessos'

const TAMANHO_PAGINA = 100

interface SeletorProcessoExistenteProps {
  onSelecionar: (processoId: string) => void
  onCancelar: () => void
  enviando: boolean
  erro: string | null
}

// Lado inverso de SeletorOcorrencia.tsx — em vez de escolher uma ocorrência
// dentro do wizard de processo (etapa 1, travada depois), aqui o usuário
// escolhe um processo já existente pra vincular à ocorrência atual (emenda
// ao DER.md de 2026-10-03: vínculo pode ser definido depois da criação,
// uma única vez, quando nenhum dos dois lados já tem vínculo). Mais simples
// que o seletor de ocorrência: sem estado "travado"/"pular", porque aqui
// não existe wizard — é uma ação direta no detalhe da ocorrência.
export function SeletorProcessoExistente({ onSelecionar, onCancelar, enviando, erro }: SeletorProcessoExistenteProps) {
  const [busca, setBusca] = useState('')
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)

  const { data, isLoading } = useProcessosQuery({ q: busca || undefined, pagina: 0, tamanho: TAMANHO_PAGINA })
  // Um processo só pode ter 0 ou 1 ocorrência vinculada (DER.md:485,698) —
  // exclui da lista os que já têm ocorrenciaVinculado, mesmo padrão de
  // SeletorOcorrencia.tsx::disponiveis.
  const disponiveis = (data?.itens ?? []).filter((item) => !item.ocorrenciaVinculado)

  return (
    <div className="vinculo-seletor" style={{ marginTop: 12 }}>
      <input
        className="input"
        type="search"
        placeholder="Buscar por protocolo ou responsável..."
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        aria-label="Buscar processo sanitário"
      />
      <div className="occur-list" role="radiogroup" aria-label="Processos sanitários disponíveis para vínculo" style={{ marginTop: 8 }}>
        {!isLoading && disponiveis.length === 0 && <p className="empty-search">Nenhum processo sem vínculo encontrado.</p>}
        {disponiveis.map((processo) => {
          const statusBadge = badgeDeStatusProcesso(processo.statusProcesso)
          const selecionado = selecionadoId === processo.id
          return (
            <div
              key={processo.id}
              role="radio"
              aria-checked={selecionado}
              tabIndex={0}
              className={`occur-row${selecionado ? ' selected' : ''}`}
              onClick={() => setSelecionadoId(processo.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelecionadoId(processo.id)
                }
              }}
            >
              <span className="proto mono">{processo.protocolo}</span>
              <span className="summary">
                <span className="head">{labelDeDoenca(processo.doenca)}</span>
                <span className="sec">{processo.responsavel.nome}</span>
              </span>
              <span className={`badge ${statusBadge.classe}`}>{statusBadge.label}</span>
              <span className="pick" />
            </div>
          )
        })}
      </div>
      {erro && <span className="err">{erro}</span>}
      <div className="flex gap-2" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelar}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!selecionadoId || enviando}
          onClick={() => selecionadoId && onSelecionar(selecionadoId)}
        >
          {enviando ? 'Vinculando…' : 'Vincular processo selecionado'}
        </button>
      </div>
    </div>
  )
}
