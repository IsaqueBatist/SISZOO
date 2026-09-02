import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Icon } from '../../components/layout/Icon'
import { VACINAS } from './catalogoClinico'
import { vacinacaoFormSchema, type VacinacaoFormValues } from './historicoFormSchemas'
import { LABELS_UNIDADE_DOSE } from './historicoLabels'
import { useCriarVacinacaoMutation } from './useHistoricoAnimal'
import type { Vacinacao } from './historico.types'

interface ModalRegistrarVacinaProps {
  animalId: string
  // Presente quando a ação é "Corrigir" um registro existente: o POST novo
  // aponta `retificaId` para ele, em vez de criar uma vacinação
  // independente (registros clínicos são imutáveis — ver docs/CLAUDE.md).
  retifica?: Vacinacao
  onFechar: () => void
  onSucesso: () => void
}

export function ModalRegistrarVacina({ animalId, retifica, onFechar, onSucesso }: ModalRegistrarVacinaProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useCriarVacinacaoMutation(animalId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VacinacaoFormValues>({
    resolver: zodResolver(vacinacaoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      vacina: retifica?.vacinaCodigo ?? '',
      dataAplicacao: retifica?.dataAplicacao ?? '',
      numeroDose: retifica?.numeroDose ?? undefined,
      doseQuantidade: retifica?.doseQuantidade,
      doseUnidade: retifica?.doseUnidade,
      lote: retifica?.lote ?? '',
      observacoes: retifica?.observacoes ?? '',
    },
  })

  async function onSubmit(dados: VacinacaoFormValues) {
    try {
      await mutation.mutateAsync({
        animalId,
        vacina: dados.vacina,
        dataAplicacao: dados.dataAplicacao,
        numeroDose: dados.numeroDose,
        doseQuantidade: dados.doseQuantidade,
        doseUnidade: dados.doseUnidade,
        lote: dados.lote,
        observacoes: dados.observacoes,
        retificaId: retifica?.id,
      })
      onSucesso()
    } catch {
      setSubmitError(`Não foi possível ${retifica ? 'corrigir' : 'registrar'} a vacinação. Tente novamente.`)
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
          <h3>{retifica ? 'Corrigir vacinação' : 'Registrar vacina'}</h3>
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
                  <label htmlFor="vac-vacina">
                    Vacina <span className="req">*</span>
                  </label>
                  <select id="vac-vacina" className={`select${errors.vacina ? ' error' : ''}`} {...register('vacina')}>
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {VACINAS.map((item) => (
                      <option key={item.codigo} value={item.codigo}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                  {errors.vacina && <span className="err">{errors.vacina.message}</span>}
                </div>

                <div className="field">
                  <label htmlFor="vac-data">
                    Data de aplicação <span className="req">*</span>
                  </label>
                  <input
                    id="vac-data"
                    className={`input${errors.dataAplicacao ? ' error' : ''}`}
                    type="date"
                    {...register('dataAplicacao')}
                  />
                  {errors.dataAplicacao && <span className="err">{errors.dataAplicacao.message}</span>}
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="vac-numero-dose">Número da dose</label>
                  <input
                    id="vac-numero-dose"
                    className="input"
                    type="number"
                    min={1}
                    step={1}
                    {...register('numeroDose', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="vac-dose-quantidade">
                    Quantidade da dose <span className="req">*</span>
                  </label>
                  <input
                    id="vac-dose-quantidade"
                    className={`input${errors.doseQuantidade ? ' error' : ''}`}
                    type="number"
                    min={0}
                    step="0.001"
                    {...register('doseQuantidade', { valueAsNumber: true })}
                  />
                  {errors.doseQuantidade && <span className="err">{errors.doseQuantidade.message}</span>}
                </div>
                <div className="field">
                  <label htmlFor="vac-dose-unidade">Unidade</label>
                  <select
                    id="vac-dose-unidade"
                    className="select"
                    {...register('doseUnidade', { setValueAs: (v) => (v === '' ? undefined : v) })}
                  >
                    <option value="">—</option>
                    {(Object.keys(LABELS_UNIDADE_DOSE) as (keyof typeof LABELS_UNIDADE_DOSE)[]).map((unidade) => (
                      <option key={unidade} value={unidade}>
                        {LABELS_UNIDADE_DOSE[unidade]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="vac-lote">Lote</label>
                <input
                  id="vac-lote"
                  className="input"
                  type="text"
                  {...register('lote', { setValueAs: (v: string) => (v.trim() ? v : undefined) })}
                />
              </div>

              <div className="field">
                <label htmlFor="vac-observacoes">Observações</label>
                <textarea
                  id="vac-observacoes"
                  className="textarea"
                  rows={3}
                  {...register('observacoes', { setValueAs: (v: string) => (v.trim() ? v : undefined) })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando…' : retifica ? 'Salvar correção' : 'Registrar vacina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
