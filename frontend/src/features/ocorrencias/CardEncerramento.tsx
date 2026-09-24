import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { encerramentoFormSchema, PROVIDENCIA_OPCOES, type EncerramentoFormValues } from './encerramentoFormSchema'
import type { Ocorrencia, ProvidenciaTomada } from './ocorrencias.types'
import { useEncerrarOcorrenciaMutation } from './useOcorrencias'

interface CardEncerramentoProps {
  ocorrencia: Ocorrencia
  podeEncerrar: boolean
}

const FUSO_ITU = 'America/Sao_Paulo'

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO_ITU }).format(
    new Date(iso),
  )
}

function labelProvidencia(valor: string): string {
  return PROVIDENCIA_OPCOES.find((opcao) => opcao.valor === valor)?.label ?? valor
}

// Autor do encerramento não é um campo próprio de `Ocorrencia` (ver
// "Correções ao contrato" no plano de T28) — é lido da movimentação
// 'encerrada' mais recente, evitando duplicar o mesmo enriquecimento id→nome
// em dois lugares para o mesmo dado.
function autorDoEncerramento(ocorrencia: Ocorrencia): string | null {
  const movimentacoesEncerramento = ocorrencia.movimentacoes
    .filter((item) => item.tipoMovimentacao === 'encerrada')
    .sort((a, b) => (a.data < b.data ? 1 : -1))
  return movimentacoesEncerramento[0]?.usuarioNome ?? null
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
        descricaoEncerramento: dados.descricaoEncerramento,
      })
    } catch (erro) {
      if (isAxiosError(erro)) {
        const mensagem = (erro.response?.data as { mensagem?: string } | undefined)?.mensagem
        if (erro.response?.status === 409 && mensagem) {
          setSubmitError(mensagem)
          return
        }
      }
      setSubmitError('Não foi possível encerrar a ocorrência. Tente novamente.')
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  if (ocorrencia.statusOcorrencia === 'encerrada') {
    const autor = autorDoEncerramento(ocorrencia)
    return (
      <div className="card">
        <div className="card-header">
          <h3>Encerramento</h3>
        </div>
        <div className="card-body">
          <div className="kv-list">
            <div className="kv-row">
              <span className="k">Providência</span>
              <span className="v">{ocorrencia.providenciaTomada ? labelProvidencia(ocorrencia.providenciaTomada) : '—'}</span>
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
            {autor && (
              <div className="kv-row">
                <span className="k">Encerrada por</span>
                <span className="v">{autor}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const processoPendente = ocorrencia.processoVinculado?.resultadoPendente === true

  if (!podeEncerrar || processoPendente) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Encerramento</h3>
        </div>
        <div className="card-body">
          {processoPendente && (
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Esta ocorrência está vinculada a um processo sanitário ativo. O encerramento depende do resultado
              laboratorial.
            </p>
          )}
          <button type="button" className="btn btn-danger w-full" disabled>
            Encerrar ocorrência
          </button>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 6 }}>
            {processoPendente ? 'Disponível após resultado do processo' : 'Seu perfil não pode encerrar ocorrências'}
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
              {PROVIDENCIA_OPCOES.map((opcao) => (
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
