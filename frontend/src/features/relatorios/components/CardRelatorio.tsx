import { useState } from 'react'
import { Icon } from '@/components/layout/Icon'
import { formatarDataBR, hojeEmItu } from '@/lib/datas'
import { validarFiltro } from '../utils/filtroRelatorio'
import type { FiltroRelatorio, TipoRelatorioInfo } from '../types/relatorios.types'

const DESCRICAO_RELATORIO: Record<string, string> = {
  anual_processos:
    'Distribuição de investigações sanitárias por doença, espécie e bairro. Inclui taxas de positividade e tempo médio de resolução.',
  vacinacao: 'Animais vacinados, vacinas vencidas e próximas a vencer. Por espécie, baia e veterinário responsável.',
  adocoes: 'Animais adotados e perfil por espécie e porte, pela situação atual do cadastro.',
  procedimentos: 'Castrações, cirurgias e atendimentos clínicos consolidados. Inclui produtividade por veterinário.',
  ocupacao_baias: 'Ocupação atual por baia, baias no limite ou superlotadas e capacidade total.',
  ocorrencias_bairro: 'Mapa de calor de ocorrências por bairro, tipos de denúncia mais frequentes e tempo médio de atendimento.',
}

function periodoPadrao() {
  const fim = hojeEmItu()
  const [ano, mes, dia] = fim.split('-').map(Number)
  const inicio = new Date(Date.UTC(ano, mes - 2, dia)).toISOString().slice(0, 10)
  return { inicio, fim }
}

interface CardRelatorioProps {
  info: TipoRelatorioInfo
  onGerar: (filtro: FiltroRelatorio) => void
}

export function CardRelatorio({ info, onGerar }: CardRelatorioProps) {
  const anoAtual = Number(hojeEmItu().slice(0, 4))
  const periodo = periodoPadrao()

  const [ano, setAno] = useState(anoAtual)
  const [periodoInicio, setPeriodoInicio] = useState(periodo.inicio)
  const [periodoFim, setPeriodoFim] = useState(periodo.fim)
  const [erro, setErro] = useState<string | null>(null)


  function montarFiltro(): FiltroRelatorio {
    if (info.filtro === 'ano') return { tipo: info.codigo, ano }
    if (info.filtro === 'posicao') return { tipo: info.codigo }
    return { tipo: info.codigo, periodoInicio, periodoFim }
  }

  function gerar() {
    const filtro = montarFiltro()
    const mensagem = validarFiltro(filtro)
    if (mensagem) {
      setErro(mensagem)
      return
    }
    setErro(null)
    onGerar(filtro)
  }

  return (
    <div className="report-card">
      <h3>{info.nome}</h3>
      <p className="desc">{DESCRICAO_RELATORIO[info.codigo]}</p>

      {info.filtro === 'ano' && (
        <div className="period-row">
          <label htmlFor={`ano-${info.codigo}`}>Ano</label>
          <select
            id={`ano-${info.codigo}`}
            className="select"
            value={ano}
            onChange={(event) => setAno(Number(event.target.value))}
          >
            <option value={anoAtual}>{anoAtual} (em curso)</option>
            <option value={anoAtual - 1}>{anoAtual - 1}</option>
            <option value={anoAtual - 2}>{anoAtual - 2}</option>
          </select>
        </div>
      )}

      {info.filtro === 'posicao' && <div className="period-row posicao">Posição em {formatarDataBR(hojeEmItu())}</div>}

      {info.filtro === 'periodo' && (
        <div className="period-row">
          <label htmlFor={`periodo-inicio-${info.codigo}`}>Período</label>
          <input
            id={`periodo-inicio-${info.codigo}`}
            className="input"
            type="date"
            value={periodoInicio}
            onChange={(event) => setPeriodoInicio(event.target.value)}
            aria-label="Data inicial"
          />
          <input
            className="input"
            type="date"
            value={periodoFim}
            onChange={(event) => setPeriodoFim(event.target.value)}
            aria-label="Data final"
          />
        </div>
      )}

      {erro && (
        <p className="err" role="alert">
          {erro}
        </p>
      )}

      <div className="report-acoes">
        <button type="button" className="btn btn-secondary" onClick={gerar}>
          <Icon name="download" size={14} />
          Gerar relatório
        </button>
      </div>
    </div>
  )
}
