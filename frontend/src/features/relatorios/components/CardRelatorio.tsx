import { useState } from 'react'
import { Icon, type IconName } from '@/components/layout/Icon'
import { validarFiltro } from '../utils/filtroRelatorio'
import type { FiltroRelatorio, JanelaOcupacao, TipoRelatorioInfo } from '../types/relatorios.types'

interface InfoVisualCard {
  icone: IconName
  cor: string
  corFundo: string
  descricao: string
}

// Icone/cor/descricao vem do prototipo (docs/prototipo/relatorios.html) —
// texto literal, nao inventado. Filtro padrao de cada tipo (ano atual,
// ultimos 6 meses, periodo dos ultimos 30 dias) é só o valor inicial do
// controle; o usuário pode mudar antes de clicar em "Gerar Relatório".
const INFO_VISUAL: Record<string, InfoVisualCard> = {
  anual_processos: {
    icone: 'fileText',
    cor: 'var(--color-info)',
    corFundo: 'var(--color-info-bg)',
    descricao:
      'Distribuição de investigações sanitárias por doença, espécie e bairro. Inclui taxas de positividade e tempo médio de resolução.',
  },
  vacinacao: {
    icone: 'syringe',
    cor: 'var(--color-success)',
    corFundo: 'var(--color-success-bg)',
    descricao: 'Animais vacinados, vacinas vencidas e próximas a vencer. Por espécie, baia e veterinário responsável.',
  },
  adocoes: {
    icone: 'heart',
    cor: '#6A1B9A',
    corFundo: '#F3E5F5',
    descricao: 'Adoções realizadas, tempo médio de permanência, perfil dos adotantes e taxas de devolução.',
  },
  procedimentos: {
    icone: 'scissors',
    cor: 'var(--color-warning)',
    corFundo: 'var(--color-warning-bg)',
    descricao: 'Castrações, cirurgias e atendimentos clínicos consolidados. Inclui produtividade por veterinário.',
  },
  ocupacao_baias: {
    icone: 'inbox',
    cor: '#2E7D32',
    corFundo: '#E8F5E9',
    descricao: 'Ocupação atual por baia, baias no limite ou superlotadas e capacidade total.',
  },
  ocorrencias_bairro: {
    icone: 'map',
    cor: 'var(--color-danger)',
    corFundo: 'var(--color-danger-bg)',
    descricao: 'Mapa de calor de ocorrências por bairro, tipos de denúncia mais frequentes e tempo médio de atendimento.',
  },
}

function periodoPadrao() {
  const fim = new Date()
  const inicio = new Date()
  inicio.setMonth(inicio.getMonth() - 1)
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) }
}

interface CardRelatorioProps {
  info: TipoRelatorioInfo
  onGerar: (filtro: FiltroRelatorio) => void
}

export function CardRelatorio({ info, onGerar }: CardRelatorioProps) {
  const anoAtual = new Date().getFullYear()
  const periodo = periodoPadrao()

  const [ano, setAno] = useState(anoAtual)
  const [periodoInicio, setPeriodoInicio] = useState(periodo.inicio)
  const [periodoFim, setPeriodoFim] = useState(periodo.fim)
  const [janela, setJanela] = useState<JanelaOcupacao>('ultimos_6_meses')
  const [erro, setErro] = useState<string | null>(null)

  const visual = INFO_VISUAL[info.codigo]

  function montarFiltro(): FiltroRelatorio {
    if (info.filtro === 'ano') return { tipo: info.codigo, ano }
    if (info.filtro === 'janela') {
      return janela === 'custom'
        ? { tipo: info.codigo, janela, periodoInicio, periodoFim }
        : { tipo: info.codigo, janela }
    }
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
      <div className="r-ico" style={{ background: visual.corFundo, color: visual.cor }}>
        <Icon name={visual.icone} size={28} />
      </div>
      <h3>{info.nome}</h3>
      <p className="desc">{visual.descricao}</p>

      {info.filtro === 'ano' && (
        <div className="period-row">
          <label htmlFor={`ano-${info.codigo}`}>Ano</label>
          <select
            id={`ano-${info.codigo}`}
            className="select"
            style={{ height: 34, flex: 1 }}
            value={ano}
            onChange={(event) => setAno(Number(event.target.value))}
          >
            <option value={anoAtual}>{anoAtual} (em curso)</option>
            <option value={anoAtual - 1}>{anoAtual - 1}</option>
            <option value={anoAtual - 2}>{anoAtual - 2}</option>
          </select>
        </div>
      )}

      {info.filtro === 'janela' && (
        <div className="period-row">
          <label htmlFor={`janela-${info.codigo}`}>Período</label>
          <select
            id={`janela-${info.codigo}`}
            className="select"
            style={{ height: 34, flex: 1 }}
            value={janela}
            onChange={(event) => setJanela(event.target.value as JanelaOcupacao)}
          >
            <option value="ultimos_6_meses">Últimos 6 meses</option>
            <option value="ultimos_12_meses">Últimos 12 meses</option>
            <option value="custom">Custom...</option>
          </select>
        </div>
      )}

      {(info.filtro === 'periodo' || (info.filtro === 'janela' && janela === 'custom')) && (
        <div className="period-row">
          <label htmlFor={`periodo-inicio-${info.codigo}`}>Período</label>
          <input
            id={`periodo-inicio-${info.codigo}`}
            className="input mono"
            type="date"
            style={{ height: 34, flex: 1 }}
            value={periodoInicio}
            onChange={(event) => setPeriodoInicio(event.target.value)}
            aria-label="Data inicial"
          />
          <input
            className="input mono"
            type="date"
            style={{ height: 34, flex: 1 }}
            value={periodoFim}
            onChange={(event) => setPeriodoFim(event.target.value)}
            aria-label="Data final"
          />
        </div>
      )}

      {erro && (
        <p className="desc" style={{ color: 'var(--color-danger)' }}>
          {erro}
        </p>
      )}

      <button type="button" className="btn btn-primary" onClick={gerar}>
        <Icon name="download" size={14} />
        Gerar Relatório
      </button>
    </div>
  )
}
