import { useAlertasEsterilizacaoQuery, useAlertasVacinaisQuery } from '@/features/alertas/hooks/useAlertas'
import { formatarTempoDesdeEntrada, HORAS_A_DISPOSICAO_DO_RESPONSAVEL } from '@/features/alertas/utils/tempoDesdeEntrada'
import { useAnimaisQuery, useBaiasQuery } from '@/features/animais/hooks/useAnimais'
import type { PendenciaAnimal } from '@/features/animais/types/animais.types'
import { PENDENCIAS_ANIMAL } from '@/features/animais/utils/pendenciasAnimal'
import { useOcorrenciasQuery } from '@/features/ocorrencias/hooks/useOcorrencias'
import type { StatusOcorrencia } from '@/features/ocorrencias/types/ocorrencias.types'
import { formatarProtocoloOcorrencia, formatarProtocoloProcesso } from '@/features/ocorrencias/utils/protocolo'
import { useProcessosQuery } from '@/features/processos/hooks/useProcessos'
import type { StatusProcesso } from '@/features/processos/types/processos.types'
import { podeAcessar, type RoleKey } from '@/lib/nav'
import { useProcessosUrgentesQuery } from './useAlertaProcessosUrgentes'

export type TomPendencia = 'danger' | 'warning' | 'info'
export type GrupoPendencia = 'atencao' | 'acompanhamento'

export interface RegistroDaPendencia {
  id: string
  rotulo: string
  detalhe?: string
  para?: string
  classe?: string
}

export interface Pendencia {
  chave: string
  grupo: GrupoPendencia
  tom: TomPendencia
  total: number
  titulo: string
  descricao: string
  para?: string
  rotuloLink: string
  registros: RegistroDaPendencia[]
}

export interface FalhaDaPendencia {
  chave: string
  mensagem: string
  tentarNovamente: () => void
}

interface EstadoDaFonte {
  pendencia: Pendencia | null
  carregando: boolean
  falha: FalhaDaPendencia | null
}

export const REGISTROS_POR_PENDENCIA = 3

function plural(total: number, singular: string, varios: string): string {
  return `${total} ${total === 1 ? singular : varios}`
}

function estado(
  chave: string,
  consulta: { isLoading: boolean; isError: boolean; refetch: () => unknown },
  mensagemDeErro: string,
  montar: () => Pendencia | null,
): EstadoDaFonte {
  if (consulta.isLoading) return { pendencia: null, carregando: true, falha: null }
  if (consulta.isError) {
    return {
      pendencia: null,
      carregando: false,
      falha: { chave, mensagem: mensagemDeErro, tentarNovamente: () => void consulta.refetch() },
    }
  }
  const pendencia = montar()
  return { pendencia: pendencia && pendencia.total > 0 ? pendencia : null, carregando: false, falha: null }
}

function useProcessosUrgentes(): EstadoDaFonte {
  const consulta = useProcessosUrgentesQuery()
  return estado('processos_urgentes', consulta, 'Não foi possível carregar os processos urgentes.', () => {
    const { itens, totalUrgentes } = consulta.data ?? { itens: [], totalUrgentes: 0 }
    return {
      chave: 'processos_urgentes',
      grupo: 'atencao',
      tom: 'danger',
      total: totalUrgentes,
      titulo: `${plural(totalUrgentes, 'processo urgente', 'processos urgentes')}`,
      descricao: 'Contato humano-animal confirmado em ao menos uma amostra.',
      para: '/processos?urgente=1',
      rotuloLink: 'Ver processos urgentes',
      registros: itens.slice(0, REGISTROS_POR_PENDENCIA).map((processo) => ({
        id: processo.id,
        rotulo: `${processo.protocolo} (${processo.doenca.nome})`,
        para: `/processos/${processo.id}`,
      })),
    }
  })
}

const SEM_PENDENCIA: EstadoDaFonte = { pendencia: null, carregando: false, falha: null }

function useVacinas(habilitada: boolean): EstadoDaFonte {
  const consulta = useAlertasVacinaisQuery(habilitada)
  if (!habilitada) return SEM_PENDENCIA
  return estado('vacinas', consulta, 'Não foi possível carregar os alertas de vacina.', () => {
    const itens = (consulta.data ?? [])
      .flatMap((animal) =>
        animal.vacinas.map((vacina) => ({
          id: vacina.vacinacaoId,
          animalId: animal.animalId,
          animalNome: animal.animalNome,
          vacinaNome: vacina.vacinaNome,
          diasRestantes: vacina.diasRestantes,
          vencida: vacina.severidade === 'VENCIDA',
        })),
      )
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
    const vencidas = itens.filter((item) => item.vencida).length
    const aVencer = itens.length - vencidas
    const partes = [
      vencidas > 0 ? plural(vencidas, 'vencida', 'vencidas') : null,
      aVencer > 0 ? `${aVencer} vencendo em até 7 dias` : null,
    ].filter((parte) => parte !== null)
    return {
      chave: 'vacinas',
      grupo: 'atencao',
      tom: vencidas > 0 ? 'danger' : 'warning',
      total: itens.length,
      titulo: `${plural(itens.length, 'vacina', 'vacinas')} com reforço pendente`,
      descricao: `${partes.join(', ')}.`,
      para: '/alertas/vacinas',
      rotuloLink: 'Ver situação vacinal',
      registros: itens.slice(0, REGISTROS_POR_PENDENCIA).map((item) => ({
        id: item.id,
        rotulo: item.animalNome,
        para: `/animais/${item.animalId}`,
        classe: item.vencida ? 'severidade-vencida' : 'severidade-a-vencer',
        detalhe: item.vencida
          ? `${item.vacinaNome}, venceu há ${Math.abs(item.diasRestantes)}d`
          : item.diasRestantes === 0
            ? `${item.vacinaNome}, vence hoje`
            : `${item.vacinaNome}, vence em ${item.diasRestantes}d`,
      })),
    }
  })
}

function useEsterilizacao(habilitada: boolean): EstadoDaFonte {
  const consulta = useAlertasEsterilizacaoQuery(habilitada)
  if (!habilitada) return SEM_PENDENCIA
  return estado('esterilizacao', consulta, 'Não foi possível carregar o alerta de esterilização.', () => {
    const animais = consulta.data ?? []
    return {
      chave: 'esterilizacao',
      grupo: 'atencao',
      tom: 'warning',
      total: animais.length,
      titulo: `${plural(animais.length, 'animal recolhido', 'animais recolhidos')} há mais de ${HORAS_A_DISPOSICAO_DO_RESPONSAVEL} horas sem esterilização`,
      descricao: 'Prazo de permanência à disposição do responsável já encerrado.',
      para: '/alertas/esterilizacao',
      rotuloLink: 'Ver animais',
      registros: animais.slice(0, REGISTROS_POR_PENDENCIA).map((animal) => ({
        id: animal.animalId,
        rotulo: animal.animalNome,
        detalhe: formatarTempoDesdeEntrada(animal.horasDesdeEntrada),
        para: `/animais/${animal.animalId}`,
      })),
    }
  })
}

function useBaiasSuperlotadas(roleKey: RoleKey): EstadoDaFonte {
  const consulta = useBaiasQuery()
  const acessaBaias = podeAcessar(roleKey, 'baias')
  return estado('baias', consulta, 'Não foi possível carregar a ocupação das baias.', () => {
    const superlotadas = (consulta.data ?? []).filter((baia) => baia.ativa && baia.superlotada)
    return {
      chave: 'baias',
      grupo: 'atencao',
      tom: 'danger',
      total: superlotadas.length,
      titulo: plural(superlotadas.length, 'baia superlotada', 'baias superlotadas'),
      descricao: 'Ocupação igual ou acima da capacidade.',
      para: acessaBaias ? '/baias?lotacao=superlotada' : undefined,
      rotuloLink: 'Ver baias',
      registros: superlotadas.slice(0, REGISTROS_POR_PENDENCIA).map((baia) => ({
        id: baia.id,
        rotulo: baia.nome,
        detalhe: `${baia.ocupacaoAtual}/${baia.capacidade}`,
      })),
    }
  })
}

function useOcorrenciasPorStatus(
  status: StatusOcorrencia,
  habilitada: boolean,
  montar: (total: number) => Pick<Pendencia, 'chave' | 'grupo' | 'tom' | 'titulo' | 'descricao' | 'rotuloLink'>,
): EstadoDaFonte {
  const consulta = useOcorrenciasQuery({ status, pagina: 0, tamanho: REGISTROS_POR_PENDENCIA }, habilitada)
  if (!habilitada) return SEM_PENDENCIA
  const base = montar(consulta.data?.totalItens ?? 0)
  return estado(base.chave, consulta, 'Não foi possível carregar as ocorrências.', () => ({
    ...base,
    total: consulta.data?.totalItens ?? 0,
    para: `/ocorrencias?status=${status}`,
    registros: (consulta.data?.itens ?? []).map((ocorrencia) => ({
      id: ocorrencia.id,
      rotulo: formatarProtocoloOcorrencia(ocorrencia.protocolo),
      detalhe: `${ocorrencia.tipoOcorrenciaNome}, ${ocorrencia.bairro}`,
      para: `/ocorrencias/${ocorrencia.id}`,
    })),
  }))
}

function useProcessosPorStatus(
  status: StatusProcesso,
  montar: (total: number) => Pick<Pendencia, 'chave' | 'grupo' | 'tom' | 'titulo' | 'descricao' | 'rotuloLink'>,
): EstadoDaFonte {
  const consulta = useProcessosQuery({ status, pagina: 0, tamanho: REGISTROS_POR_PENDENCIA })
  const base = montar(consulta.data?.totalItens ?? 0)
  return estado(base.chave, consulta, 'Não foi possível carregar os processos.', () => ({
    ...base,
    total: consulta.data?.totalItens ?? 0,
    para: `/processos?status=${status}`,
    registros: (consulta.data?.itens ?? []).map((processo) => ({
      id: processo.id,
      rotulo: formatarProtocoloProcesso(processo.protocolo),
      detalhe: processo.doenca.nome,
      para: `/processos/${processo.id}`,
    })),
  }))
}

const TOM_DA_PENDENCIA_ANIMAL: Record<PendenciaAnimal, TomPendencia> = {
  sem_avaliacao_30d: 'warning',
  ficha_incompleta: 'info',
  medicacao_ativa: 'info',
  nao_castrado: 'info',
}

const TITULO_DA_PENDENCIA_ANIMAL: Record<PendenciaAnimal, (total: number) => string> = {
  ficha_incompleta: (total) => `${plural(total, 'animal', 'animais')} com ficha incompleta`,
  sem_avaliacao_30d: (total) => `${plural(total, 'animal', 'animais')} sem avaliação clínica há mais de 30 dias`,
  medicacao_ativa: (total) => `${plural(total, 'animal', 'animais')} com medicação terminando em até 7 dias`,
  nao_castrado: (total) => `${plural(total, 'animal disponível', 'animais disponíveis')} para adoção sem castração`,
}

function useAnimaisComPendencia(pendencia: PendenciaAnimal, habilitada: boolean): EstadoDaFonte {
  const consulta = useAnimaisQuery({ pendencia, pagina: 0, tamanho: REGISTROS_POR_PENDENCIA }, habilitada)
  if (!habilitada) return SEM_PENDENCIA
  return estado(`animais_${pendencia}`, consulta, 'Não foi possível carregar os animais com pendência.', () => {
    const total = consulta.data?.totalItens ?? 0
    return {
      chave: `animais_${pendencia}`,
      grupo: 'acompanhamento',
      tom: TOM_DA_PENDENCIA_ANIMAL[pendencia],
      total,
      titulo: TITULO_DA_PENDENCIA_ANIMAL[pendencia](total),
      descricao: PENDENCIAS_ANIMAL[pendencia].regra,
      para: `/animais?pendencia=${pendencia}`,
      rotuloLink: 'Ver animais',
      registros: (consulta.data?.itens ?? []).map((animal) => ({
        id: animal.id,
        rotulo: animal.nome,
        para: `/animais/${animal.id}`,
      })),
    }
  })
}

export function usePendenciasDashboard(roleKey: RoleKey) {
  const acessaOcorrencias = podeAcessar(roleKey, 'ocorrencias')
  const acessaAnimais = podeAcessar(roleKey, 'animais')
  const fontes: EstadoDaFonte[] = [
    useProcessosUrgentes(),
    useVacinas(acessaAnimais),
    useEsterilizacao(acessaAnimais),
    useBaiasSuperlotadas(roleKey),
    useOcorrenciasPorStatus('ABERTA', acessaOcorrencias, (total) => ({
      chave: 'ocorrencias_abertas',
      grupo: 'atencao',
      tom: 'warning',
      titulo: `${plural(total, 'ocorrência aberta', 'ocorrências abertas')} aguardando atendimento`,
      descricao: 'Ninguém iniciou o atendimento ainda.',
      rotuloLink: 'Ver ocorrências abertas',
    })),
    useOcorrenciasPorStatus('EM_ATENDIMENTO', acessaOcorrencias, (total) => ({
      chave: 'ocorrencias_em_atendimento',
      grupo: 'acompanhamento',
      tom: 'info',
      titulo: `${plural(total, 'ocorrência', 'ocorrências')} em atendimento`,
      descricao: 'Atendimento iniciado e ainda não encerrado.',
      rotuloLink: 'Ver ocorrências em atendimento',
    })),
    useProcessosPorStatus('AGUARDANDO_RESULTADO', (total) => ({
      chave: 'processos_aguardando',
      grupo: 'acompanhamento',
      tom: 'warning',
      titulo: `${plural(total, 'processo', 'processos')} aguardando resultado laboratorial`,
      descricao: 'Amostras enviadas ao laboratório, sem resultado lançado.',
      rotuloLink: 'Ver processos',
    })),
    useProcessosPorStatus('COM_RESULTADO', (total) => ({
      chave: 'processos_com_resultado',
      grupo: 'acompanhamento',
      tom: 'info',
      titulo: `${plural(total, 'processo', 'processos')} com resultado aguardando conclusão`,
      descricao: 'Resultado lançado; falta concluir o processo.',
      rotuloLink: 'Ver processos',
    })),
    useAnimaisComPendencia('sem_avaliacao_30d', acessaAnimais),
    useAnimaisComPendencia('ficha_incompleta', acessaAnimais),
    useAnimaisComPendencia('medicacao_ativa', acessaAnimais),
    useAnimaisComPendencia('nao_castrado', acessaAnimais),
  ]

  const pendencias = fontes.flatMap((fonte) => (fonte.pendencia ? [fonte.pendencia] : []))
  return {
    atencao: pendencias.filter((pendencia) => pendencia.grupo === 'atencao'),
    acompanhamento: pendencias.filter((pendencia) => pendencia.grupo === 'acompanhamento'),
    falhas: fontes.flatMap((fonte) => (fonte.falha ? [fonte.falha] : [])),
    carregando: fontes.some((fonte) => fonte.carregando),
  }
}
