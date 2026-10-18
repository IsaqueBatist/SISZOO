import { useState } from 'react'
import { useOcorrenciasQuery } from '@/features/ocorrencias/hooks/useOcorrencias'
import { badgeDeStatus } from '@/features/ocorrencias/utils/statusBadge'
import { formatarProtocoloOcorrencia } from '@/features/ocorrencias/utils/protocolo'
import type { OcorrenciaResumo } from '@/features/ocorrencias/types/ocorrencias.types'
import type { VinculoDecisao } from '../types/processos.types'
import './SeletorVinculo.css'

const TAMANHO_PAGINA = 20

// Resumo exibido da ocorrência escolhida (etapa 1, revisão e vínculo posterior).
export interface OcorrenciaParaVinculo {
  id: string
  protocolo: string
  tipoOcorrenciaNome: string
  bairro: string
}

// Ocorrência só pode receber processo se ainda não tem um (0..1) e não está
// encerrada (D20) — o backend recusa os dois casos com 409/422.
function disponivelParaVinculo(ocorrencia: OcorrenciaResumo): boolean {
  return ocorrencia.processoProtocolo === null && ocorrencia.statusOcorrencia !== 'ENCERRADA'
}

// T26-9/T26-12: na listagem, o nome do denunciante de ocorrência sigilosa
// vem nulo para todos; mostra "Sigiloso"/"Anônima" no lugar.
function denuncianteExibido(ocorrencia: OcorrenciaResumo): string | null {
  if (ocorrencia.anonima) return 'Anônima'
  if (ocorrencia.sigilosa) return 'Sigiloso'
  return ocorrencia.denuncianteNome
}

interface SeletorOcorrenciaProps {
  vinculoDecisao: VinculoDecisao
  ocorrenciaId: string | null
  travado: boolean
  ocorrenciaVinculada: OcorrenciaParaVinculo | null
  erro?: string
  onSelecionar: (ocorrencia: OcorrenciaParaVinculo) => void
  onPular: () => void
  // Fora do wizard (vínculo posterior no detalhe do processo) não existe
  // "pular etapa": é "cancelar".
  textoAjuda?: string
  textoBotaoPular?: string
}

// RN2: uma vez decidida (ocorrência selecionada OU "Pular esta etapa"), a
// etapa 1 vira somente leitura pelo resto do wizard. Não existe, de
// propósito, nenhum botão "trocar" aqui. Travado, não busca a lista de
// ocorrências (ela fica em ListaOcorrencias, montada só quando há escolha).
export function SeletorOcorrencia(props: SeletorOcorrenciaProps) {
  const { travado, ocorrenciaVinculada, vinculoDecisao } = props
  if (travado) {
    return (
      <div className="vinculo-display" data-testid="vinculo-travado">
        {ocorrenciaVinculada ? (
          <div>
            <strong className="mono">{formatarProtocoloOcorrencia(ocorrenciaVinculada.protocolo)}</strong> — {ocorrenciaVinculada.tipoOcorrenciaNome},{' '}
            {ocorrenciaVinculada.bairro}
          </div>
        ) : vinculoDecisao === 'vinculado' ? (
          <span className="empty">Carregando a ocorrência vinculada…</span>
        ) : (
          <span className="empty">Nenhuma ocorrência vinculada a este processo.</span>
        )}
        <span className="hint">Definido na etapa 1 — não é possível alterar depois de avançar.</span>
      </div>
    )
  }
  return <ListaOcorrencias {...props} />
}

function ListaOcorrencias({
  vinculoDecisao,
  ocorrenciaId,
  erro,
  onSelecionar,
  onPular,
  textoAjuda,
  textoBotaoPular = 'Pular esta etapa',
}: SeletorOcorrenciaProps) {
  const [busca, setBusca] = useState('')
  const { data, isLoading, isError } = useOcorrenciasQuery({
    q: busca.trim() || undefined,
    pagina: 0,
    tamanho: TAMANHO_PAGINA,
  })
  const disponiveis = (data?.itens ?? []).filter(disponivelParaVinculo)

  return (
    <div>
      <p className="hint" style={{ marginBottom: 16 }}>
        {textoAjuda ?? (
          <>
            Se este processo está sendo aberto a partir de uma denúncia ou ocorrência registrada, selecione-a abaixo.
            Caso contrário, clique em <strong>{textoBotaoPular}</strong>.
          </>
        )}
      </p>
      <div className="occur-search">
        <input
          className="input"
          type="search"
          placeholder="Buscar por protocolo, bairro ou denunciante..."
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          aria-label="Buscar ocorrência"
        />
      </div>
      <div className="occur-list" role="radiogroup" aria-label="Ocorrências disponíveis para vínculo">
        {isLoading && <p className="empty-search">Carregando ocorrências…</p>}
        {isError && (
          <p className="empty-search" role="alert">
            Não foi possível carregar as ocorrências. Tente novamente.
          </p>
        )}
        {!isLoading && !isError && disponiveis.length === 0 && (
          <p className="empty-search">Nenhuma ocorrência disponível para vínculo.</p>
        )}
        {disponiveis.map((ocorrencia) => {
          const statusBadge = badgeDeStatus(ocorrencia.statusOcorrencia)
          const selecionada = vinculoDecisao === 'vinculado' && ocorrenciaId === ocorrencia.id
          const denunciante = denuncianteExibido(ocorrencia)

          function selecionar() {
            onSelecionar({
              id: ocorrencia.id,
              protocolo: ocorrencia.protocolo,
              tipoOcorrenciaNome: ocorrencia.tipoOcorrenciaNome,
              bairro: ocorrencia.bairro,
            })
          }

          return (
            <div
              key={ocorrencia.id}
              role="radio"
              aria-checked={selecionada}
              tabIndex={0}
              className={`occur-row${selecionada ? ' selected' : ''}`}
              onClick={selecionar}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  selecionar()
                }
              }}
            >
              <span className="proto mono">{formatarProtocoloOcorrencia(ocorrencia.protocolo)}</span>
              <span className="summary">
                <span className="head">{ocorrencia.tipoOcorrenciaNome}</span>
                <span className="sec">
                  {ocorrencia.bairro}
                  {denunciante ? ` · ${denunciante}` : ''}
                </span>
              </span>
              <span className={`badge ${statusBadge.classe}`}>{statusBadge.label}</span>
              <span className="pick" />
            </div>
          )
        })}
      </div>
      {erro && <span className="err">{erro}</span>}
      <div className="flex gap-2" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-outline" onClick={onPular}>
          {textoBotaoPular}
        </button>
      </div>
    </div>
  )
}
