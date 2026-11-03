import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useCriarVacinaMutation } from '@/features/vacinas/hooks/useVacinas'
import { vacinaFormSchema, type VacinaFormValues } from '@/features/vacinas/schemas/vacinaFormSchema'
import { aplicarErrosDeCampo, mapaDeCampos, mensagemDeRegraDaApi } from '@/lib/erroApi'

const MAPA_ERROS_VACINA = mapaDeCampos<VacinaFormValues>(['nome', 'intervaloMeses'])

interface CadastroRapidoVacinaProps {
  onCadastrada: (codigo: string) => void
  onCancelar: () => void
}

export function CadastroRapidoVacina({ onCadastrada, onCancelar }: CadastroRapidoVacinaProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const criar = useCriarVacinaMutation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VacinaFormValues>({
    resolver: zodResolver(vacinaFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { nome: '', intervaloMeses: undefined },
  })

  async function salvar(dados: VacinaFormValues) {
    try {
      const criada = await criar.mutateAsync({ nome: dados.nome, intervaloMeses: dados.intervaloMeses })
      onCadastrada(criada.codigo)
    } catch (erro) {
      if (aplicarErrosDeCampo(erro, setError, MAPA_ERROS_VACINA).length > 0) return
      setSubmitError(mensagemDeRegraDaApi(erro) ?? 'Não foi possível cadastrar a vacina. Tente novamente.')
    }
  }

  function aoEnviar(event: FormEvent<HTMLButtonElement>) {
    event.preventDefault()
    setSubmitError(null)
    void handleSubmit(salvar)()
  }

  return (
    <div className="card" style={{ padding: 'var(--space-3)' }}>
      <strong style={{ fontSize: 13 }}>Nova vacina</strong>

      {submitError && (
        <div className="alert danger" role="alert" style={{ marginTop: 'var(--space-2)' }}>
          <div className="alert-content">{submitError}</div>
        </div>
      )}

      <div className="form-grid" style={{ marginTop: 'var(--space-2)' }}>
        <div className="field">
          <label htmlFor="vac-nova-nome">
            Nome <span className="req">*</span>
          </label>
          <input
            id="vac-nova-nome"
            className={`input${errors.nome ? ' error' : ''}`}
            autoFocus
            {...register('nome')}
          />
          {errors.nome && <span className="err">{errors.nome.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="vac-nova-intervalo">Intervalo de reforço (meses)</label>
          <input
            id="vac-nova-intervalo"
            className={`input${errors.intervaloMeses ? ' error' : ''}`}
            type="number"
            min={1}
            {...register('intervaloMeses', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
          />
          {errors.intervaloMeses ? (
            <span className="err">{errors.intervaloMeses.message}</span>
          ) : (
            <span className="hint">Em branco: a vacina não gera alerta de reforço.</span>
          )}
        </div>
      </div>

      <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelar}>
          Cancelar cadastro
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={aoEnviar} disabled={criar.isPending}>
          {criar.isPending ? 'Cadastrando…' : 'Cadastrar vacina'}
        </button>
      </div>
    </div>
  )
}
