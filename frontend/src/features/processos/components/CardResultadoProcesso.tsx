import { useEffect, useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AlertaErroEnvio } from '@/components/AlertaErroEnvio'
import { AtalhoHoje } from '@/components/AtalhoHoje'
import { Modal } from '@/components/Modal'
import { formatarData, formatarDataHora } from '@/features/ocorrencias/utils/datas'
import { toast } from '@/components/toast/toast'
import { hojeEmItu } from '@/lib/datas'
import { mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'
import {
  registrarResultadoFormSchema,
  type RegistrarResultadoFormValues,
} from '../schemas/processoResultadoFormSchema'
import type { Processo, ResultadoProcessoItem } from '../types/processos.types'
import { badgeDeResultado } from '../utils/statusBadge'
import {
  useCatalogosProcessoQuery,
  useReconsultarProcesso,
  useReenviarNotificacaoMutation,
  useRegistrarResultadoMutation,
} from '../hooks/useProcessos'

// Depois de lançar um resultado notificável nesta tela, o e-mail sai em segundo plano
// (depois do commit, T37/T35): por alguns segundos dataNotificacaoMunicipe
// ainda vem nula. Em vez de acusar "NÃO notificado" na hora, a tela consulta
// o processo de novo por um tempo (o envio tem timeouts SMTP de 5 s).
export interface AcompanhamentoEnvio {
  intervaloMs: number
  duracaoMs: number
}

const ACOMPANHAMENTO_PADRAO: AcompanhamentoEnvio = { intervaloMs: 2000, duracaoMs: 20000 }

interface CardResultadoProcessoProps {
  processo: Processo
  podeEscrever: boolean
  acompanhamentoEnvio?: AcompanhamentoEnvio
}

// RN10 do TG (F2-014, 22/10/2026): Positivo e Inconclusivo notificam o
// munícipe por e-mail — mesmo critério de ResultadosNotificaveis no backend.
// Dispara inclusive por correção, quando o vigente passa a um deles.
const RESULTADOS_QUE_NOTIFICAM = ['positivo', 'inconclusivo']
// T35-15: só o positivo é definitivo (não se corrige) e pede confirmação.
const RESULTADO_DEFINITIVO = 'positivo'

// DH-25: não existe envio à Vigilância; o backend só registra a intenção. A tela
// precisa dizer isso: quem lança o resultado é quem pode fazer o contato.
const AVISO_VIGILANCIA =
  'A Vigilância Epidemiológica de Itu não é avisada pelo SISZOO. Faça esse contato pelo procedimento do CCZ.'

// "2026-05-20T14:32:07.12" -> "20/05/2026 14:32" (LocalDateTime de Itu, sem
// fuso). Hora por slice, sem import novo: a linha de import de datas e a que
// a fix/ficha-completa-seed-fuso troca (hojeEmItu), e mexer nela conflitava.
function formatarDataHoraNotificacao(valor: string): string {
  return `${formatarData(valor)} ${valor.slice(11, 16)}`
}

// T35-16 (#37): situação do e-mail ao munícipe num resultado notificável (positivo ou inconclusivo). T35
// (pendência de reenvio): sem data e sem envio em curso, quem pode escrever
// no processo vê um botão para tentar de novo — bloqueado pelo backend
// (422) se a notificação já tiver sido confirmada nesse meio tempo.
function AvisoNotificacao({
  processo,
  enviando,
  podeEscrever,
  reenviando,
  erroReenvio,
  onReenviar,
}: {
  processo: Processo
  enviando: boolean
  podeEscrever: boolean
  reenviando: boolean
  erroReenvio: string | null
  onReenviar: () => void
}) {
  if (processo.dataNotificacaoMunicipe) {
    return (
      <div className="alert success" role="status" style={{ marginTop: 'var(--space-3)' }}>
        <span className="bullet" />
        <div className="alert-content">
          Munícipe notificado em {formatarDataHoraNotificacao(processo.dataNotificacaoMunicipe)}
        </div>
      </div>
    )
  }
  if (enviando) {
    return (
      <div className="alert info" role="status" style={{ marginTop: 'var(--space-3)' }}>
        <span className="bullet" />
        <div className="alert-content">Enviando a notificação por e-mail ao munícipe…</div>
      </div>
    )
  }
  return (
    <div className="alert danger" role="alert" style={{ marginTop: 'var(--space-3)' }}>
      <span className="bullet" />
      <div className="alert-content">
        <strong>Munícipe NÃO notificado por e-mail — contatar por outro meio</strong>
        {erroReenvio && <div style={{ marginTop: 'var(--space-2)' }}>{erroReenvio}</div>}
        {podeEscrever && (
          <div style={{ marginTop: 'var(--space-2)' }}>
            <button type="button" className="btn btn-ghost btn-sm" disabled={reenviando} onClick={onReenviar}>
              {reenviando ? 'Reenviando…' : 'Reenviar notificação'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Historico({ resultados }: { resultados: ResultadoProcessoItem[] }) {
  if (resultados.length === 0) return null

  return (
    <div className="col gap-1" style={{ marginTop: 'var(--space-3)' }}>
      <p className="hint" style={{ margin: 0 }}>
        Histórico
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--color-text-secondary)' }}>
        {resultados.map((item) => (
          <li key={item.id}>
            {item.retificaId ? 'Correção para ' : 'Lançado '}
            <strong>{item.resultado.nome}</strong> em {formatarData(item.dataResultado)} — registrado por{' '}
            {item.registradoPorNome} em {formatarDataHora(item.registradoEm)}
            {item.observacoes ? ` (${item.observacoes})` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface FormResultadoProps {
  processo: Processo
  // Presente na correção: o POST aponta `retificaId` para ele, que fica
  // preservado no histórico (RN-C02).
  retifica?: ResultadoProcessoItem
  onRegistrado: (resultado: string) => void
  onCancelar?: () => void
}

// Lançamento e correção do resultado: mesmos campos e mesma confirmação do
// positivo. O resultado é sempre escolhido por quem lança: nada vem marcado, e a
// data é a do laudo, não a do registro (esta o servidor grava sozinho).
function FormResultado({ processo, retifica, onRegistrado, onCancelar }: FormResultadoProps) {
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, setPendente] = useState<RegistrarResultadoFormValues | null>(null)
  // T35-15: positivo é definitivo — confirmação explícita antes de enviar.
  const [cienteDefinitivo, setCienteDefinitivo] = useState(false)
  const mutation = useRegistrarResultadoMutation(processo.id)
  const reconsultar = useReconsultarProcesso(processo.id)
  const { data: catalogos } = useCatalogosProcessoQuery()
  const emailResponsavel = processo.responsavel?.email

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegistrarResultadoFormValues>({
    resolver: zodResolver(registrarResultadoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { resultado: '', dataResultado: '', observacoes: '', desfechoAnimal: processo.desfechoAnimal?.codigo ?? '' },
  })
  const resultadoEscolhido = watch('resultado')

  async function enviar(dados: RegistrarResultadoFormValues) {
    setErro(null)
    try {
      await mutation.mutateAsync({
        resultado: dados.resultado,
        dataResultado: dados.dataResultado,
        observacoes: dados.observacoes || undefined,
        desfechoAnimal: dados.desfechoAnimal || undefined,
        retificaId: retifica?.id,
      })
      setPendente(null)
      toast.sucesso(retifica ? 'Resultado corrigido.' : 'Resultado registrado.')
      onRegistrado(dados.resultado)
    } catch (falha) {
      setPendente(null)
      if (statusHttpDoErro(falha) === 422 && !retifica) {
        // A escrita anterior pode ter chegado no servidor e a resposta se
        // perdido na rede (internet instável do CCZ): refaz o GET antes de
        // mostrar erro — se o resultado já existir, a tela vira somente
        // leitura no próximo render (sem precisar de mensagem de erro).
        try {
          const atualizado = await reconsultar()
          if (atualizado.resultado) return
        } catch {
          // Mantém o fluxo de erro abaixo se nem o refetch funcionar.
        }
      }
      setErro(mensagemDeRegraDaApi(falha) ?? 'Não foi possível registrar o resultado. Tente novamente.')
    }
  }

  function onSubmit(dados: RegistrarResultadoFormValues) {
    if (retifica && !dados.observacoes?.trim()) {
      setError('observacoes', { message: 'Informe o motivo da correção.' })
      return
    }
    if (dados.resultado === RESULTADO_DEFINITIVO) {
      setCienteDefinitivo(false)
      setPendente(dados)
      return
    }
    void enviar(dados)
  }

  function aoEnviarFormulario(event: FormEvent<HTMLFormElement>) {
    setErro(null)
    void handleSubmit(onSubmit)(event)
  }

  const resultadosOpcoes = (catalogos?.resultadosLaboratoriais ?? []).filter((item) => item.codigo !== 'aguardando')
  const desfechosOpcoes = catalogos?.desfechos ?? []

  return (
    <>
      <AlertaErroEnvio mensagem={erro} estilo={{ marginBottom: 12 }} />
      <form onSubmit={aoEnviarFormulario} noValidate>
        <div className="field" style={{ marginBottom: 12 }}>
          <label htmlFor="proc-resultado">Resultado laboratorial</label>
          <select id="proc-resultado" className={`select${errors.resultado ? ' error' : ''}`} aria-invalid={errors.resultado ? true : undefined} aria-describedby={errors.resultado ? 'proc-resultado-erro' : undefined} defaultValue="" {...register('resultado')}>
            <option value="" disabled>
              Selecione...
            </option>
            {resultadosOpcoes.map((opcao) => (
              <option key={opcao.codigo} value={opcao.codigo}>
                {opcao.nome}
              </option>
            ))}
          </select>
          {errors.resultado && <span className="err" id="proc-resultado-erro">{errors.resultado.message}</span>}
          {RESULTADOS_QUE_NOTIFICAM.includes(resultadoEscolhido) && (
            <span className="hint" role="status">
              {emailResponsavel
                ? `Ao registrar, o SISZOO enviará um e-mail para ${emailResponsavel}.`
                : 'O responsável não tem e-mail cadastrado: avise por outro meio.'}
            </span>
          )}
        </div>
        <div className="field" style={{ marginBottom: 12 }}>
          <label htmlFor="proc-data-resultado">Data do resultado</label>
          <input
            id="proc-data-resultado"
            className={`input${errors.dataResultado ? ' error' : ''}`} aria-invalid={errors.dataResultado ? true : undefined} aria-describedby={errors.dataResultado ? 'proc-data-resultado-erro' : undefined}
            type="date"
            max={hojeEmItu()}
            {...register('dataResultado')}
          />
          <AtalhoHoje onEscolher={(hoje) => setValue('dataResultado', hoje, { shouldDirty: true })} />
          {errors.dataResultado && <span className="err" id="proc-data-resultado-erro">{errors.dataResultado.message}</span>}
        </div>
        <div className="field" style={{ marginBottom: 12 }}>
          <label htmlFor="proc-desfecho">Desfecho do animal</label>
          <select id="proc-desfecho" className="select" {...register('desfechoAnimal')}>
            <option value="">—</option>
            {desfechosOpcoes.map((opcao) => (
              <option key={opcao.codigo} value={opcao.codigo}>
                {opcao.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 12 }}>
          <label htmlFor="proc-observacoes">
            {retifica ? (
              <>
                Motivo da correção <span className="req">*</span>
              </>
            ) : (
              'Observações'
            )}
          </label>
          <textarea id="proc-observacoes" className={`textarea${errors.observacoes ? ' error' : ''}`} aria-invalid={errors.observacoes ? true : undefined} aria-describedby={errors.observacoes ? 'proc-observacoes-erro' : undefined} rows={3} {...register('observacoes')} />
          {errors.observacoes && <span className="err" id="proc-observacoes-erro">{errors.observacoes.message}</span>}
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={mutation.isPending}>
            {mutation.isPending ? 'Registrando…' : retifica ? 'Salvar correção' : 'Registrar resultado'}
          </button>
          {onCancelar && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelar} disabled={mutation.isPending}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {pendente && (
        <Modal titulo="Confirmar lançamento do resultado" onFechar={() => setPendente(null)}>
          <div className="modal-body">
            <div className="alert danger" role="alert">
              <span className="bullet" />
              <div className="alert-content">
                <strong>O resultado positivo é definitivo:</strong> depois de confirmado, não poderá ser corrigido —
                nem para outro resultado, nem para positivo de novo.
              </div>
            </div>
            <div className="alert warning" style={{ marginTop: 'var(--space-3)' }}>
              <span className="bullet" />
              <div className="alert-content">
                Ao confirmar, o sistema tentará avisar o responsável pelo animal por e-mail. {AVISO_VIGILANCIA}
              </div>
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 'var(--space-3)' }}>
              <input type="checkbox" checked={cienteDefinitivo} onChange={(event) => setCienteDefinitivo(event.target.checked)} />
              <span>Entendo que o resultado positivo não poderá ser corrigido</span>
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setPendente(null)} disabled={mutation.isPending}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={mutation.isPending || !cienteDefinitivo}
              onClick={() => void enviar(pendente)}
            >
              {mutation.isPending ? 'Registrando…' : 'Confirmar'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

// Card do resultado laboratorial do processo. Três estados: aguardando envio
// das amostras (ABERTO), formulário de lançamento (AGUARDANDO_RESULTADO sem
// resultado ainda) e somente leitura + histórico (depois de lançado), com a
// correção do que não é definitivo (DH-28, regra em resultadoACorrigir no backend).
export function CardResultadoProcesso({
  processo,
  podeEscrever,
  acompanhamentoEnvio = ACOMPANHAMENTO_PADRAO,
}: CardResultadoProcessoProps) {
  const [acompanhandoEnvio, setAcompanhandoEnvio] = useState(false)
  const [erroReenvio, setErroReenvio] = useState<string | null>(null)
  const [corrigindo, setCorrigindo] = useState(false)
  const reenvioMutation = useReenviarNotificacaoMutation(processo.id)
  const reconsultar = useReconsultarProcesso(processo.id)

  const notifica = RESULTADOS_QUE_NOTIFICAM.includes(processo.resultado?.codigo ?? '')
  const temEmail = Boolean(processo.responsavel?.email)
  const aguardandoEnvio = acompanhandoEnvio && notifica && temEmail && !processo.dataNotificacaoMunicipe

  // Consulta o processo até a data do envio aparecer ou o prazo acabar; aí o
  // aviso passa a "notificado" ou a "NÃO notificado".
  const { intervaloMs, duracaoMs } = acompanhamentoEnvio
  useEffect(() => {
    if (!aguardandoEnvio) return
    const inicio = Date.now()
    const timer = setInterval(() => {
      if (Date.now() - inicio >= duracaoMs) {
        clearInterval(timer)
        setAcompanhandoEnvio(false)
        return
      }
      reconsultar().catch(() => undefined)
    }, intervaloMs)
    return () => clearInterval(timer)
  }, [aguardandoEnvio, intervaloMs, duracaoMs, reconsultar])

  function aoRegistrar(resultado: string) {
    setCorrigindo(false)
    if (RESULTADOS_QUE_NOTIFICAM.includes(resultado)) setAcompanhandoEnvio(true)
  }

  async function reenviarNotificacao() {
    setErroReenvio(null)
    try {
      await reenvioMutation.mutateAsync()
      setAcompanhandoEnvio(true)
    } catch (falha) {
      setErroReenvio(mensagemDeRegraDaApi(falha) ?? 'Não foi possível reenviar a notificação. Tente novamente.')
    }
  }

  if (processo.resultado) {
    const badge = badgeDeResultado(processo.resultado)
    // Só o vigente se corrige: o que já foi corrigido por outro fica no histórico.
    const vigente = processo.resultados.find((item) => !processo.resultados.some((outro) => outro.retificaId === item.id))
    const podeCorrigir =
      podeEscrever && processo.statusProcesso === 'COM_RESULTADO' && processo.resultado.codigo !== RESULTADO_DEFINITIVO && vigente

    return (
      <div className="card">
        <div className="card-header">
          <h3>Resultado Laboratorial</h3>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="field">
              <label>Resultado</label>
              <div>
                <span className={`badge ${badge.classe}`}>{badge.label}</span>
              </div>
            </div>
            <div className="field">
              <label>Data do resultado</label>
              <div className="mono">{processo.dataResultado ? formatarData(processo.dataResultado) : '—'}</div>
            </div>
            <div className="field full">
              <label>Desfecho do animal</label>
              <div>{processo.desfechoAnimal ? processo.desfechoAnimal.nome : '—'}</div>
            </div>
          </div>
          {notifica && (
            <AvisoNotificacao
              processo={processo}
              enviando={aguardandoEnvio}
              podeEscrever={podeEscrever}
              reenviando={reenvioMutation.isPending}
              erroReenvio={erroReenvio}
              onReenviar={() => void reenviarNotificacao()}
            />
          )}
          {notifica && (
            <div className="alert warning" style={{ marginTop: 'var(--space-3)' }}>
              <span className="bullet" />
              <div className="alert-content">{AVISO_VIGILANCIA}</div>
            </div>
          )}
          <Historico resultados={processo.resultados} />
          {podeCorrigir && !corrigindo && (
            <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 'var(--space-3)' }} onClick={() => setCorrigindo(true)}>
              Corrigir resultado
            </button>
          )}
          {podeCorrigir && corrigindo && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <h4 style={{ marginBottom: 'var(--space-2)' }}>Corrigir resultado</h4>
              <p className="hint" style={{ marginBottom: 'var(--space-3)' }}>
                O resultado atual continua no histórico. A correção cria um novo registro.
              </p>
              <FormResultado processo={processo} retifica={vigente} onRegistrado={aoRegistrar} onCancelar={() => setCorrigindo(false)} />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (processo.statusProcesso !== 'AGUARDANDO_RESULTADO') {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Resultado Laboratorial</h3>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Aguardando o envio das amostras ao laboratório.
          </p>
        </div>
      </div>
    )
  }

  if (!podeEscrever) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Resultado Laboratorial</h3>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Aguardando resultado do laboratório.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Registrar resultado</h3>
      </div>
      <div className="card-body">
        <FormResultado processo={processo} onRegistrado={aoRegistrar} />
      </div>
    </div>
  )
}
