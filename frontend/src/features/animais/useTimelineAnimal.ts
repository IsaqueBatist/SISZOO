import { useCallback, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { listarPrescricoes, listarProcedimentos, listarVacinacoes } from './historicoApi'
import { chavePrescricoes, chaveProcedimentos, chaveVacinacoes, TAMANHO_PAGINA_HISTORICO } from './useHistoricoAnimal'
import { badgeReforcoVacina } from './regrasVacina'
import type { Animal } from './animais.types'
import type { Prescricao, Procedimento, Vacinacao } from './historico.types'

export type TipoEventoTimeline = 'vacina' | 'procedimento' | 'medicamento' | 'entrada'

export interface EventoTimeline {
  id: string
  tipo: TipoEventoTimeline
  data: string
  titulo: string
  por: string
  corpo?: string
  aviso?: string
  retificado: boolean
}

// Ordem cronológica correta com merge externo (k-way merge) de 3 fontes já
// paginadas e ordenadas desc pela API — ver "Contexto" do plano de T22 para
// o motivo de não fazer só "buscar N de cada e mesclar" (corta errado perto
// do fim quando uma fonte tem muito mais registros que as outras).
interface EstadoFonte<T> {
  buffer: T[]
  proximaPagina: number
  semMaisPaginas: boolean
}

function estadoFonteInicial<T>(): EstadoFonte<T> {
  return { buffer: [], proximaPagina: 0, semMaisPaginas: false }
}

function vacinacaoParaEvento(v: Vacinacao): EventoTimeline {
  const badge = badgeReforcoVacina(v.dataValidade)
  const partesCorpo = [v.lote ? `Lote ${v.lote}` : null, v.dataValidade ? `Próximo reforço: ${v.dataValidade}` : null].filter(
    Boolean,
  )
  return {
    id: v.id,
    tipo: 'vacina',
    data: v.dataAplicacao,
    titulo: `Vacina ${v.vacinaNome} aplicada`,
    por: v.aplicadoPorNome ?? '—',
    corpo: partesCorpo.length > 0 ? partesCorpo.join(' · ') : undefined,
    aviso: badge && badge.status !== 'em_dia' ? badge.label.replace('⚠ ', '') : undefined,
    retificado: v.statusRegistro === 'RETIFICADO',
  }
}

function procedimentoParaEvento(p: Procedimento): EventoTimeline {
  return {
    id: p.id,
    tipo: 'procedimento',
    data: p.data,
    titulo: p.tipoProcedimentoNome,
    por: p.executadoPorNome ?? '—',
    corpo: [p.descricao, p.resultado].filter(Boolean).join(' · ') || undefined,
    retificado: p.statusRegistro === 'RETIFICADO',
  }
}

function prescricaoParaEvento(p: Prescricao): EventoTimeline {
  return {
    id: p.id,
    tipo: 'medicamento',
    data: p.dataInicio,
    titulo: `Início: ${p.medicamentoNome}`,
    por: p.prescritoPorNome ?? '—',
    corpo: `Dose ${p.doseQuantidade}${p.doseUnidade.toLowerCase()} · ${p.frequenciaAplicada}x a cada ${p.unidadeFrequencia.toLowerCase()}${
      p.dataFimPrevista ? ` · Até ${p.dataFimPrevista}` : ''
    }`,
    retificado: p.statusRegistro === 'RETIFICADO',
  }
}

export function useTimelineAnimal(animalId: string | undefined, animal: Animal | undefined, refreshKey: number) {
  const queryClient = useQueryClient()
  const [eventos, setEventos] = useState<EventoTimeline[]>([])
  const [carregando, setCarregando] = useState(false)
  const [fimDoHistorico, setFimDoHistorico] = useState(false)
  const [erro, setErro] = useState(false)

  const vacinasRef = useRef(estadoFonteInicial<Vacinacao>())
  const procedimentosRef = useRef(estadoFonteInicial<Procedimento>())
  const prescricoesRef = useRef(estadoFonteInicial<Prescricao>())
  const refreshKeyProcessadaRef = useRef<number | null>(null)

  const garantirBuffer = useCallback(
    async <T,>(
      estado: MutableRefObject<EstadoFonte<T>>,
      chave: (animalId: string, pagina: number) => readonly unknown[],
      buscar: (animalId: string, pagina: number, tamanho: number) => Promise<{ itens: T[]; totalPaginas: number }>,
    ) => {
      if (!animalId) return
      if (estado.current.buffer.length > 0 || estado.current.semMaisPaginas) return
      const pagina = estado.current.proximaPagina
      const resposta = await queryClient.fetchQuery({
        queryKey: chave(animalId, pagina),
        queryFn: () => buscar(animalId, pagina, TAMANHO_PAGINA_HISTORICO),
      })
      estado.current.buffer = resposta.itens
      estado.current.proximaPagina = pagina + 1
      estado.current.semMaisPaginas = estado.current.proximaPagina >= resposta.totalPaginas
    },
    [animalId, queryClient],
  )

  const carregarMais = useCallback(
    async (quantidade = 20) => {
      if (!animalId) return
      setCarregando(true)
      setErro(false)
      try {
        const novosEventos: EventoTimeline[] = []
        while (novosEventos.length < quantidade) {
          await Promise.all([
            garantirBuffer(vacinasRef, chaveVacinacoes, listarVacinacoes),
            garantirBuffer(procedimentosRef, chaveProcedimentos, listarProcedimentos),
            garantirBuffer(prescricoesRef, chavePrescricoes, listarPrescricoes),
          ])

          const candidatos = [
            vacinasRef.current.buffer[0] && { chave: 'vacina' as const, data: vacinasRef.current.buffer[0].dataAplicacao },
            procedimentosRef.current.buffer[0] && { chave: 'procedimento' as const, data: procedimentosRef.current.buffer[0].data },
            prescricoesRef.current.buffer[0] && { chave: 'medicamento' as const, data: prescricoesRef.current.buffer[0].dataInicio },
          ].filter((c): c is { chave: 'vacina' | 'procedimento' | 'medicamento'; data: string } => Boolean(c))

          if (candidatos.length === 0) {
            setFimDoHistorico(true)
            break
          }

          candidatos.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
          const escolhido = candidatos[0]

          if (escolhido.chave === 'vacina') {
            const item = vacinasRef.current.buffer.shift() as Vacinacao
            novosEventos.push(vacinacaoParaEvento(item))
          } else if (escolhido.chave === 'procedimento') {
            const item = procedimentosRef.current.buffer.shift() as Procedimento
            novosEventos.push(procedimentoParaEvento(item))
          } else {
            const item = prescricoesRef.current.buffer.shift() as Prescricao
            novosEventos.push(prescricaoParaEvento(item))
          }
        }
        setEventos((atual) => [...atual, ...novosEventos])
      } catch {
        setErro(true)
      } finally {
        setCarregando(false)
      }
    },
    [animalId, garantirBuffer],
  )

  // Reinício: `refreshKey` muda a cada registro criado com sucesso em
  // qualquer aba — zera os buffers e recarrega do início para que o novo
  // registro apareça também na timeline, não só na aba específica.
  const precisaReiniciar = refreshKeyProcessadaRef.current !== refreshKey
  if (precisaReiniciar && animalId) {
    refreshKeyProcessadaRef.current = refreshKey
    vacinasRef.current = estadoFonteInicial<Vacinacao>()
    procedimentosRef.current = estadoFonteInicial<Procedimento>()
    prescricoesRef.current = estadoFonteInicial<Prescricao>()
    setEventos([])
    setFimDoHistorico(false)
  }

  const eventoEntrada = useMemo<EventoTimeline | null>(() => {
    if (!animal) return null
    return {
      id: `entrada-${animal.id}`,
      tipo: 'entrada',
      data: animal.dataEntrada,
      titulo: 'Entrada no CCZ',
      por: animal.criadoPorNome,
      corpo: `Motivo: ${animal.motivoEntradaNome}`,
      retificado: false,
    }
  }, [animal])

  const eventosComEntrada = fimDoHistorico && eventoEntrada ? [...eventos, eventoEntrada] : eventos

  return { eventos: eventosComEntrada, carregando, fimDoHistorico, erro, carregarMais, precisaReiniciar }
}
