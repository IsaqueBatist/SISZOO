import { useEffect, useRef, useState } from 'react'
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

export function Relatorios() {
  const tipos = useTiposRelatorioQuery()
  const [geracaoAtiva, setGeracaoAtiva] = useState<GeracaoAtiva | null>(null)
  const previa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (geracaoAtiva) previa.current?.scrollIntoView?.({ block: 'start' })
  }, [geracaoAtiva])

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
        <div ref={previa} className="previa-relatorio">
          <PainelPreviewRelatorio nomeExibicao={geracaoAtiva.nomeExibicao} filtro={geracaoAtiva.filtro} />
        </div>
      )}

      <HistoricoRelatorios onGerarNovamente={gerar} />
    </>
  )
}
