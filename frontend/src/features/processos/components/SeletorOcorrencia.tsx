import { useState } from 'react'
import { badgeDeStatus, labelDeTipo } from '@/features/ocorrencias/utils/statusBadge'
import { useOcorrenciasQuery } from '@/features/ocorrencias/hooks/useOcorrencias'
import type { OcorrenciaParaVinculo, VinculoDecisao } from '../types/processos.types'
import './SeletorVinculo.css'

const TAMANHO_PAGINA = 20

interface SeletorOcorrenciaProps {
  vinculoDecisao: VinculoDecisao
  ocorrenciaId: string | null
  travado: boolean
  ocorrenciaVinculada: OcorrenciaParaVinculo | null
  erro?: string
  onSelecionar: (ocorrencia: OcorrenciaParaVinculo) => void
  onPular: () => void
  // Reaproveitado fora do wizard (ProcessoDetalhe.tsx, vínculo pós-criação —
  // emenda ao DER.md de 2026-10-03): nesse uso não existe "pular etapa", é
  // "cancelar a busca", e não faz sentido falar em "wizard" no texto de
  // ajuda. Opcionais com o texto original como default, pra não mudar nada
  // no uso dentro do wizard.
  textoAjuda?: string
  textoBotaoPular?: string
}

// RN2: uma vez decidida (ocorrência selecionada OU "Pular esta etapa"), a
// etapa 1 vira somente leitura pelo resto do wizard — inclusive ao voltar
// para vê-la. Não existe, de propósito, nenhum botão "trocar" aqui.
export function SeletorOcorrencia({
  vinculoDecisao,
  ocorrenciaId,
  travado,
  ocorrenciaVinculada,
  erro,
  onSelecionar,
  onPular,
  textoAjuda,
  textoBotaoPular = 'Pular esta etapa',
}: SeletorOcorrenciaProps) {
  const [busca, setBusca] = useState('')

  const { data, isLoading } = useOcorrenciasQuery({ q: busca || undefined, pagina: 0, tamanho: TAMANHO_PAGINA })
  // Uma ocorrência só pode ter 0 ou 1 processo vinculado (DER.md:485,698) —
  // exclui da lista as que já têm processoVinculado. O mascaramento de
  // sigilo (RN3) já acontece dentro de listarOcorrenciasMock ANTES do filtro
  // de busca (ver ocorrenciasMockStore.ts::mascarar) — nada a refazer aqui.
  const disponiveis = (data?.itens ?? []).filter((item) => !item.processoVinculado)

  if (travado) {
    return (
      <div className="vinculo-display" data-testid="vinculo-travado">
        {ocorrenciaVinculada ? (
          <div>
            <strong className="mono">{ocorrenciaVinculada.protocolo}</strong> — {labelDeTipo(ocorrenciaVinculada.tipoOcorrencia)},{' '}
            {ocorrenciaVinculada.bairro}
          </div>
        ) : (
          <span className="empty">Nenhuma ocorrência vinculada a este processo.</span>
        )}
        <span className="hint">Definido na etapa 1 — não é possível alterar depois de avançar.</span>
      </div>
    )
  }

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
        {!isLoading && disponiveis.length === 0 && <p className="empty-search">Nenhuma ocorrência encontrada.</p>}
        {disponiveis.map((ocorrencia) => {
          const statusBadge = badgeDeStatus(ocorrencia.statusOcorrencia)
          const selecionada = vinculoDecisao === 'vinculado' && ocorrenciaId === ocorrencia.id
          const nomeDenunciante = ocorrencia.sigilosa && !ocorrencia.denunciante?.nome ? 'Denunciante sigiloso' : ocorrencia.denunciante?.nome

          function selecionar() {
            onSelecionar({
              id: ocorrencia.id,
              protocolo: ocorrencia.protocolo,
              tipoOcorrencia: ocorrencia.tipoOcorrencia,
              bairro: ocorrencia.bairro,
              statusOcorrencia: ocorrencia.statusOcorrencia,
              sigilosa: ocorrencia.sigilosa,
              denunciante: ocorrencia.denunciante ? { nome: ocorrencia.denunciante.nome } : null,
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
              <span className="proto mono">{ocorrencia.protocolo}</span>
              <span className="summary">
                <span className="head">{labelDeTipo(ocorrencia.tipoOcorrencia)}</span>
                <span className="sec">
                  {ocorrencia.bairro}
                  {nomeDenunciante ? ` · ${nomeDenunciante}` : ''}
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
