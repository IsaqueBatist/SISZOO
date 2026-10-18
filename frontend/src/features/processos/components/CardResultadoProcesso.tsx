import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { formatarData, formatarDataHora, hojeIso } from '@/features/ocorrencias/utils/datas'
import { mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'
import { buscarProcessoPorId } from '../api/processosApi'
import {
  registrarResultadoFormSchema,
  type RegistrarResultadoFormValues,
} from '../schemas/processoResultadoFormSchema'
import type { Processo, ResultadoProcessoItem } from '../types/processos.types'
import { badgeDeResultado } from '../utils/statusBadge'
import { useCatalogosProcessoQuery, useRegistrarResultadoMutation } from '../hooks/useProcessos'

interface CardResultadoProcessoProps {
  processo: Processo
  podeEscrever: boolean
}

// Regra 19 (DER, revisão 2026-10-17): só positivo notifica o município —
// inconclusivo deixou de notificar. Dispara inclusive por correção (se o
// vigente passar a positivo), mas a T37 não oferece correção nesta tela.
const RESULTADO_QUE_NOTIFICA = 'positivo'

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

// T34 + T37 — card "Resultado Laboratorial" do detalhe do processo. Três
// estados: aguardando envio das amostras (ABERTO), formulário de lançamento
// (AGUARDANDO_RESULTADO sem resultado ainda) e somente leitura + histórico
// (depois de lançado). Correção de um resultado já lançado (retificaId) é
// suportada pelo backend, mas esta tela não oferece essa ação — só o
// lançamento inicial.
export function CardResultadoProcesso({ processo, podeEscrever }: CardResultadoProcessoProps) {
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, setPendente] = useState<RegistrarResultadoFormValues | null>(null)
  const mutation = useRegistrarResultadoMutation(processo.id)
  const queryClient = useQueryClient()
  const { data: catalogos } = useCatalogosProcessoQuery()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrarResultadoFormValues>({
    resolver: zodResolver(registrarResultadoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { resultado: '', dataResultado: hojeIso(), observacoes: '', desfechoAnimal: '' },
  })

  async function enviar(dados: RegistrarResultadoFormValues) {
    setErro(null)
    try {
      await mutation.mutateAsync({
        resultado: dados.resultado,
        dataResultado: dados.dataResultado,
        observacoes: dados.observacoes || undefined,
        desfechoAnimal: dados.desfechoAnimal || undefined,
      })
      setPendente(null)
    } catch (falha) {
      setPendente(null)
      if (statusHttpDoErro(falha) === 422) {
        // A escrita anterior pode ter chegado no servidor e a resposta se
        // perdido na rede (internet instável do CCZ): refaz o GET antes de
        // mostrar erro — se o resultado já existir, a tela vira somente
        // leitura no próximo render (sem precisar de mensagem de erro).
        try {
          const atualizado = await buscarProcessoPorId(processo.id)
          queryClient.setQueryData(['processos', 'detalhe', processo.id], atualizado)
          if (atualizado.resultado) return
        } catch {
          // Mantém o fluxo de erro abaixo se nem o refetch funcionar.
        }
      }
      setErro(mensagemDeRegraDaApi(falha) ?? 'Não foi possível registrar o resultado. Tente novamente.')
    }
  }

  function onSubmit(dados: RegistrarResultadoFormValues) {
    if (dados.resultado === RESULTADO_QUE_NOTIFICA) {
      setPendente(dados)
      return
    }
    void enviar(dados)
  }

  function aoEnviarFormulario(event: FormEvent<HTMLFormElement>) {
    setErro(null)
    void handleSubmit(onSubmit)(event)
  }

  if (processo.resultado) {
    const badge = badgeDeResultado(processo.resultado)
    const notificou = processo.resultado.codigo === RESULTADO_QUE_NOTIFICA
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
          {notificou && (
            <div className="alert warning" role="alert" style={{ marginTop: 'var(--space-3)' }}>
              <span className="bullet" />
              <div className="alert-content">Notificação solicitada ao responsável.</div>
            </div>
          )}
          <Historico resultados={processo.resultados} />
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

  const resultadosOpcoes = (catalogos?.resultadosLaboratoriais ?? []).filter((item) => item.codigo !== 'aguardando')
  const desfechosOpcoes = catalogos?.desfechos ?? []

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3>Registrar resultado</h3>
        </div>
        <div className="card-body">
          {erro && (
            <div className="alert danger" role="alert" style={{ marginBottom: 12 }}>
              <span className="bullet" />
              <div className="alert-content">{erro}</div>
            </div>
          )}
          <form onSubmit={aoEnviarFormulario} noValidate>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="proc-resultado">Resultado laboratorial</label>
              <select
                id="proc-resultado"
                className={`select${errors.resultado ? ' error' : ''}`}
                defaultValue=""
                {...register('resultado')}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {resultadosOpcoes.map((opcao) => (
                  <option key={opcao.codigo} value={opcao.codigo}>
                    {opcao.nome}
                  </option>
                ))}
              </select>
              {errors.resultado && <span className="err">{errors.resultado.message}</span>}
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="proc-data-resultado">Data do resultado</label>
              <input
                id="proc-data-resultado"
                className={`input${errors.dataResultado ? ' error' : ''}`}
                type="date"
                max={hojeIso()}
                {...register('dataResultado')}
              />
              {errors.dataResultado && <span className="err">{errors.dataResultado.message}</span>}
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="proc-desfecho">Desfecho do animal</label>
              <select id="proc-desfecho" className="select" defaultValue="" {...register('desfechoAnimal')}>
                <option value="">—</option>
                {desfechosOpcoes.map((opcao) => (
                  <option key={opcao.codigo} value={opcao.codigo}>
                    {opcao.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="proc-observacoes">Observações</label>
              <textarea id="proc-observacoes" className="textarea" rows={3} {...register('observacoes')} />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={mutation.isPending}>
              {mutation.isPending ? 'Registrando…' : 'Registrar resultado'}
            </button>
          </form>
        </div>
      </div>

      {pendente && (
        <div className="modal-overlay" onClick={() => setPendente(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar lançamento do resultado</h3>
            </div>
            <div className="modal-body">
              <div className="alert warning" role="alert">
                <span className="bullet" />
                <div className="alert-content">
                  Ao confirmar, o sistema solicitará o envio de uma notificação automática ao responsável pelo animal
                  e à Vigilância Epidemiológica de Itu. O resultado não poderá ser editado depois.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setPendente(null)} disabled={mutation.isPending}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={mutation.isPending}
                onClick={() => void enviar(pendente)}
              >
                {mutation.isPending ? 'Registrando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
