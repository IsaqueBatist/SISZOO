import { useState } from 'react'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Skeleton } from '@/components/layout/Skeleton'
import { useTiposRelatorioQuery } from '../hooks/useRelatorios'
import type { FiltroRelatorio } from '../types/relatorios.types'
import { CardRelatorio } from './CardRelatorio'
import { HistoricoRelatorios } from './HistoricoRelatorios'
import { PainelPreviewRelatorio } from './PainelPreviewRelatorio'
import './Relatorios.css'

interface GeracaoAtiva {
  filtro: FiltroRelatorio
  nomeExibicao: string
}

// Tela de Relatórios (T41, docs/prototipo/relatorios.html): 6 cards (um por
// tipo do catálogo, DER §3.6) + seção "Relatórios recentes". O preview do
// relatório gerado aparece abaixo da grade de cards, não dentro do card — o
// card só guarda o filtro escolhido; `geracaoAtiva` nunca é limpo por um erro
// de preview/exportação, então uma falha de rede não perde o que o usuário
// já escolheu (internet instável, CLAUDE.md).
export function Relatorios() {
  const tipos = useTiposRelatorioQuery()
  const [geracaoAtiva, setGeracaoAtiva] = useState<GeracaoAtiva | null>(null)

  function gerar(filtro: FiltroRelatorio, nomeExibicao: string) {
    setGeracaoAtiva({ filtro, nomeExibicao })
  }

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>Relatórios</h1>
          <p className="subtitle">Geração e exportação de relatórios consolidados · Resultados disponíveis em PDF e CSV</p>
        </div>
      </div>

      {tipos.isLoading && (
        <div className="reports-grid">
          {[0, 1, 2, 3, 4, 5].map((indice) => (
            <Skeleton key={indice} width="100%" height={220} />
          ))}
        </div>
      )}

      {tipos.isError && (
        <ErroComRetry mensagem="Não foi possível carregar os tipos de relatório." onTentarNovamente={tipos.refetch} />
      )}

      {tipos.data && (
        <div className="reports-grid">
          {tipos.data.map((info) => (
            <CardRelatorio key={info.codigo} info={info} onGerar={(filtro) => gerar(filtro, info.nome)} />
          ))}
        </div>
      )}

      {geracaoAtiva && (
        <PainelPreviewRelatorio nomeExibicao={geracaoAtiva.nomeExibicao} filtro={geracaoAtiva.filtro} />
      )}

      <HistoricoRelatorios onGerarNovamente={gerar} />
    </>
  )
}
