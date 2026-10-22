import { Icon } from '@/components/layout/Icon'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Skeleton } from '@/components/layout/Skeleton'
import { salvarBlob } from '@/lib/arquivos'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import { useExportarRelatorioMutation, usePreviewRelatorioQuery } from '../hooks/useRelatorios'
import type { FiltroRelatorio, PreviewOcupacaoBaias as DadosOcupacaoBaias, PreviewVacinacao as DadosVacinacao } from '../types/relatorios.types'
import { PreviewOcupacaoBaias } from './previews/PreviewOcupacaoBaias'
import { PreviewVacinacao } from './previews/PreviewVacinacao'

interface PainelPreviewRelatorioProps {
  nomeExibicao: string
  filtro: FiltroRelatorio
}

// Dispatcher entre o tipo escolhido e o componente de preview correspondente
// — cada tipo tem colunas/seções diferentes (DER §3.6), um preview genérico
// perderia fidelidade ao protótipo. Tipos ainda não implementados no backend
// (PR2) caem no 422 "Tipo de relatório ainda não implementado", tratado como
// qualquer outro erro de regra de negócio abaixo.
export function PainelPreviewRelatorio({ nomeExibicao, filtro }: PainelPreviewRelatorioProps) {
  const preview = usePreviewRelatorioQuery<unknown>(filtro)
  const exportar = useExportarRelatorioMutation()

  async function baixar(formato: 'csv' | 'pdf') {
    try {
      const arquivo = await exportar.mutateAsync({ filtro, formato })
      salvarBlob(arquivo.blob, arquivo.nomeArquivo)
    } catch {
      // Erro já fica em exportar.error e é mostrado abaixo — nada a fazer aqui.
    }
  }

  const baixando = exportar.isPending

  return (
    <div className="card" style={{ marginTop: 'var(--space-5)' }}>
      <div className="card-header">
        <h2>{nomeExibicao}</h2>
        <div className="actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={baixando || preview.isLoading || preview.isError}
            onClick={() => baixar('csv')}
          >
            <Icon name="download" size={14} />
            {baixando ? 'Baixando…' : 'Baixar CSV'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={baixando || preview.isLoading || preview.isError}
            onClick={() => baixar('pdf')}
          >
            <Icon name="download" size={14} />
            {baixando ? 'Baixando…' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      {preview.isLoading && <Skeleton width="100%" height={240} />}

      {preview.isError && (
        <ErroComRetry
          mensagem={mensagemDeRegraDaApi(preview.error) ?? 'Não foi possível gerar o relatório. Tente novamente.'}
          onTentarNovamente={preview.refetch}
        />
      )}

      {exportar.isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">
            {mensagemDeRegraDaApi(exportar.error) ?? 'Não foi possível baixar o arquivo. Tente novamente.'}
          </div>
        </div>
      )}

      {preview.data != null && renderizarPreview(filtro.tipo, preview.data)}
    </div>
  )
}

function renderizarPreview(tipo: FiltroRelatorio['tipo'], dados: unknown) {
  switch (tipo) {
    case 'ocupacao_baias':
      return <PreviewOcupacaoBaias dados={dados as DadosOcupacaoBaias} />
    case 'vacinacao':
      return <PreviewVacinacao dados={dados as DadosVacinacao} />
    default:
      // Os outros 4 tipos (PR2) nunca chegam aqui com dados — a query falha
      // antes com 422 "ainda não implementado", tratado em preview.isError.
      return null
  }
}
