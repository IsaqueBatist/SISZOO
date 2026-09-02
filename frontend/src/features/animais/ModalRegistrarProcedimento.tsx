import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Icon } from '../../components/layout/Icon'
import { TIPOS_PROCEDIMENTO } from './catalogoClinico'
import { procedimentoFormSchema, type ProcedimentoFormValues } from './historicoFormSchemas'
import { useCriarProcedimentoMutation } from './useHistoricoAnimal'
import type { Procedimento } from './historico.types'

interface ModalRegistrarProcedimentoProps {
  animalId: string
  // Ver comentário equivalente em ModalRegistrarVacina.tsx.
  retifica?: Procedimento
  onFechar: () => void
  onSucesso: () => void
}

export function ModalRegistrarProcedimento({ animalId, retifica, onFechar, onSucesso }: ModalRegistrarProcedimentoProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useCriarProcedimentoMutation(animalId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProcedimentoFormValues>({
    resolver: zodResolver(procedimentoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      tipoProcedimento: retifica?.tipoProcedimentoCodigo ?? '',
      data: retifica?.data ?? '',
      descricao: retifica?.descricao ?? '',
      resultado: retifica?.resultado ?? '',
    },
  })

  async function onSubmit(dados: ProcedimentoFormValues) {
    try {
      await mutation.mutateAsync({
        animalId,
        tipoProcedimento: dados.tipoProcedimento,
        data: dados.data,
        descricao: dados.descricao,
        resultado: dados.resultado,
        retificaId: retifica?.id,
      })
      onSucesso()
    } catch {
      setSubmitError(`Não foi possível ${retifica ? 'corrigir' : 'registrar'} o procedimento. Tente novamente.`)
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{retifica ? 'Corrigir procedimento' : 'Registrar procedimento'}</h3>
          <button type="button" className="btn btn-ghost btn-sm btn-icon-only" onClick={onFechar} aria-label="Fechar">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={aoEnviar} noValidate>
          <div className="modal-body">
            <div className="form-grid cols-1">
              {submitError && (
                <div className="alert danger" role="alert">
                  <span className="bullet" />
                  <div className="alert-content">{submitError}</div>
                </div>
              )}
              {retifica && (
                <div className="alert info" role="alert">
                  <span className="bullet" />
                  <div className="alert-content">
                    O registro original não será alterado — esta correção cria um novo registro vinculado a ele.
                  </div>
                </div>
              )}

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="proc-tipo">
                    Tipo de procedimento <span className="req">*</span>
                  </label>
                  <select id="proc-tipo" className={`select${errors.tipoProcedimento ? ' error' : ''}`} {...register('tipoProcedimento')}>
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {TIPOS_PROCEDIMENTO.map((item) => (
                      <option key={item.codigo} value={item.codigo}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                  {errors.tipoProcedimento && <span className="err">{errors.tipoProcedimento.message}</span>}
                </div>

                <div className="field">
                  <label htmlFor="proc-data">
                    Data <span className="req">*</span>
                  </label>
                  <input id="proc-data" className={`input${errors.data ? ' error' : ''}`} type="date" {...register('data')} />
                  {errors.data && <span className="err">{errors.data.message}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="proc-descricao">Descrição</label>
                <textarea id="proc-descricao" className="textarea" rows={3} {...register('descricao')} />
              </div>

              <div className="field">
                <label htmlFor="proc-resultado">Resultado / observações pós-procedimento</label>
                <textarea id="proc-resultado" className="textarea" rows={3} {...register('resultado')} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando…' : retifica ? 'Salvar correção' : 'Registrar procedimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
