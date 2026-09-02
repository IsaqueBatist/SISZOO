import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Icon } from '../../components/layout/Icon'
import { useAtualizarBaiaMutation, useCatalogosAnimaisQuery, useCriarBaiaMutation } from '../animais/useAnimais'
import type { Baia } from '../animais/animais.types'
import { baiaFormSchema, type BaiaFormValues } from './baiaFormSchema'

interface BaiaFormModalProps {
  baia?: Baia
  onFechar: () => void
}

export function BaiaFormModal({ baia, onFechar }: BaiaFormModalProps) {
  const editando = Boolean(baia)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: catalogos } = useCatalogosAnimaisQuery()
  const criarMutation = useCriarBaiaMutation()
  const atualizarMutation = useAtualizarBaiaMutation()
  const mutation = editando ? atualizarMutation : criarMutation

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BaiaFormValues>({
    resolver: zodResolver(baiaFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      nome: baia?.nome ?? '',
      tipoBaia: baia?.tipoBaiaCodigo ?? '',
      // valueAsNumber (não z.coerce.number() no schema): campo vazio vira
      // NaN, que z.number() rejeita como inválido ("Informe a capacidade.").
      // z.coerce.number() converteria '' em 0, um valor numérico válido —
      // mudaria a regra de negócio (capacidade zero silenciosamente aceita).
      capacidade: baia ? baia.capacidade : undefined,
      finalidade: baia?.finalidade ?? '',
      observacoes: baia?.observacoes ?? '',
    },
  })

  async function onSubmit(dados: BaiaFormValues) {
    const payload = {
      nome: dados.nome,
      tipoBaia: dados.tipoBaia,
      capacidade: dados.capacidade,
      finalidade: dados.finalidade,
      observacoes: dados.observacoes,
    }

    try {
      if (editando && baia) {
        await atualizarMutation.mutateAsync({ id: baia.id, payload })
      } else {
        await criarMutation.mutateAsync(payload)
      }
      onFechar()
    } catch {
      setSubmitError(`Não foi possível ${editando ? 'salvar' : 'criar'} a baia. Tente novamente.`)
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
          <h3>{editando ? 'Editar Baia' : 'Adicionar Baia'}</h3>
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

              <div className="field">
                <label htmlFor="baia-nome">
                  Nome <span className="req">*</span>
                </label>
                <input
                  id="baia-nome"
                  className={`input${errors.nome ? ' error' : ''}`}
                  type="text"
                  placeholder="Baia 8"
                  {...register('nome')}
                />
                {errors.nome && <span className="err">{errors.nome.message}</span>}
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="baia-tipo">
                    Tipo <span className="req">*</span>
                  </label>
                  <select id="baia-tipo" className={`select${errors.tipoBaia ? ' error' : ''}`} {...register('tipoBaia')}>
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {catalogos?.tiposBaia.map((tipo) => (
                      <option key={tipo.codigo} value={tipo.codigo}>
                        {tipo.nome}
                      </option>
                    ))}
                  </select>
                  {errors.tipoBaia && <span className="err">{errors.tipoBaia.message}</span>}
                </div>

                <div className="field">
                  <label htmlFor="baia-capacidade">
                    Capacidade <span className="req">*</span>
                  </label>
                  <input
                    id="baia-capacidade"
                    className={`input${errors.capacidade ? ' error' : ''}`}
                    type="number"
                    min={1}
                    step={1}
                    {...register('capacidade', { valueAsNumber: true })}
                  />
                  {errors.capacidade && <span className="err">{errors.capacidade.message}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="baia-finalidade">Finalidade</label>
                <input
                  id="baia-finalidade"
                  className={`input${errors.finalidade ? ' error' : ''}`}
                  type="text"
                  placeholder="Cães porte médio"
                  {...register('finalidade')}
                />
                {errors.finalidade && <span className="err">{errors.finalidade.message}</span>}
              </div>

              <div className="field">
                <label htmlFor="baia-observacoes">Observações</label>
                <textarea id="baia-observacoes" className="textarea" rows={3} {...register('observacoes')} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando…' : editando ? 'Salvar' : 'Criar Baia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
