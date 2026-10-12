import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import { encerramentoFormSchema, providenciasPermitidas, type EncerramentoFormValues } from '../schemas/encerramentoFormSchema'
import type { Ocorrencia, ProvidenciaTomada } from '../types/ocorrencias.types'
import { useEncerrarOcorrenciaMutation } from '../hooks/useOcorrencias'
import { formatarData } from '../utils/datas'

interface CardEncerramentoProps {
  ocorrencia: Ocorrencia
  podeEncerrar: boolean
}

export function CardEncerramento({ ocorrencia, podeEncerrar }: CardEncerramentoProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const mutation = useEncerrarOcorrenciaMutation(ocorrencia.id)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EncerramentoFormValues>({
    resolver: zodResolver(encerramentoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { providenciaTomada: '', descricaoEncerramento: '' },
  })

  const providenciaSelecionada = watch('providenciaTomada')

  async function onSubmit(dados: EncerramentoFormValues) {
    try {
      await mutation.mutateAsync({
        providenciaTomada: dados.providenciaTomada as ProvidenciaTomada,
        descricaoEncerramento: dados.descricaoEncerramento || undefined,
      })
    } catch (erro) {
      setSubmitError(mensagemDeRegraDaApi(erro) ?? 'Não foi possível encerrar a ocorrência. Tente novamente.')
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  if (ocorrencia.statusOcorrencia === 'ENCERRADA') {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Encerramento</h3>
        </div>
        <div className="card-body">
          <div className="kv-list">
            <div className="kv-row">
              <span className="k">Providência</span>
              <span className="v">{ocorrencia.providenciaTomadaNome ?? '—'}</span>
            </div>
            {ocorrencia.descricaoEncerramento && (
              <div className="kv-row">
                <span className="k">Descrição</span>
                <span className="v">{ocorrencia.descricaoEncerramento}</span>
              </div>
            )}
            <div className="kv-row">
              <span className="k">Encerrada em</span>
              <span className="v mono">{ocorrencia.encerradaEm ? formatarData(ocorrencia.encerradaEm) : '—'}</span>
            </div>
            {ocorrencia.encerradaPorNome && (
              <div className="kv-row">
                <span className="k">Encerrada por</span>
                <span className="v">{ocorrencia.encerradaPorNome}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // D12: processo vinculado ainda não concluído bloqueia o encerramento (o
  // backend também recusa com 422).
  const processoPendente =
    ocorrencia.processoVinculado !== null && ocorrencia.processoVinculado.statusProcesso !== 'CONCLUIDO'

  if (!podeEncerrar || processoPendente) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Encerramento</h3>
        </div>
        <div className="card-body">
          {processoPendente && (
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Esta ocorrência está vinculada a um processo sanitário ainda não concluído. O encerramento só é
              possível depois que o processo for concluído.
            </p>
          )}
          <button type="button" className="btn btn-danger w-full" disabled>
            Encerrar ocorrência
          </button>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 6 }}>
            {processoPendente ? 'Disponível após a conclusão do processo' : 'Seu perfil não pode encerrar ocorrências'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Encerramento</h3>
      </div>
      <div className="card-body">
        <form onSubmit={aoEnviar} noValidate>
          {submitError && (
            <div className="alert danger" role="alert" style={{ marginBottom: 12 }}>
              <span className="bullet" />
              <div className="alert-content">{submitError}</div>
            </div>
          )}
          <div className="field" style={{ marginBottom: 12 }}>
            <label htmlFor="enc-providencia">Providência tomada</label>
            <select
              id="enc-providencia"
              className={`select${errors.providenciaTomada ? ' error' : ''}`}
              {...register('providenciaTomada')}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {providenciasPermitidas(ocorrencia.statusOcorrencia).map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.label}
                </option>
              ))}
            </select>
            {errors.providenciaTomada && <span className="err">{errors.providenciaTomada.message}</span>}
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label htmlFor="enc-descricao">Descrição do encerramento</label>
            <textarea
              id="enc-descricao"
              className={`textarea${errors.descricaoEncerramento ? ' error' : ''}`}
              placeholder={
                providenciaSelecionada === 'outro'
                  ? 'Descreva a providência efetivamente realizada.'
                  : 'Detalhe a conclusão e as ações tomadas (opcional).'
              }
              {...register('descricaoEncerramento')}
            />
            {errors.descricaoEncerramento && <span className="err">{errors.descricaoEncerramento.message}</span>}
          </div>
          <button type="submit" className="btn btn-danger w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Encerrando…' : 'Encerrar ocorrência'}
          </button>
        </form>
      </div>
    </div>
  )
}
