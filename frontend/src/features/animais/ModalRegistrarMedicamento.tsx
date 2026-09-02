import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Icon } from '../../components/layout/Icon'
import { prescricaoFormSchema, type PrescricaoFormValues } from './historicoFormSchemas'
import {
  LABELS_STATUS_PRESCRICAO,
  LABELS_UNIDADE_DOSE,
  LABELS_UNIDADE_FREQUENCIA,
  LABELS_VIA_ADMINISTRACAO,
} from './historicoLabels'
import { useCriarPrescricaoMutation, useMedicamentosAtivosQuery } from './useHistoricoAnimal'
import type { Prescricao } from './historico.types'

interface ModalRegistrarMedicamentoProps {
  animalId: string
  // Ver comentário equivalente em ModalRegistrarVacina.tsx.
  retifica?: Prescricao
  onFechar: () => void
  onSucesso: () => void
}

export function ModalRegistrarMedicamento({ animalId, retifica, onFechar, onSucesso }: ModalRegistrarMedicamentoProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: medicamentos } = useMedicamentosAtivosQuery()
  const mutation = useCriarPrescricaoMutation(animalId)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PrescricaoFormValues>({
    resolver: zodResolver(prescricaoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      medicamentoId: retifica?.medicamentoId ?? '',
      dataInicio: retifica?.dataInicio ?? '',
      dataFimPrevista: retifica?.dataFimPrevista ?? '',
      dataFimReal: retifica?.dataFimReal ?? '',
      frequenciaAplicada: retifica?.frequenciaAplicada,
      // Selects obrigatórios sem retifica precisam de defaultValue '' (não
      // undefined) para o <select> nativo ficar preso na opção placeholder
      // desabilitada — com undefined, o RHF não fixa nenhum valor via ref e
      // o navegador cai no fallback de selecionar a 1ª opção habilitada,
      // fazendo a validação passar silenciosamente com um valor nunca escolhido.
      unidadeFrequencia: (retifica?.unidadeFrequencia ?? '') as PrescricaoFormValues['unidadeFrequencia'],
      doseQuantidade: retifica?.doseQuantidade,
      doseUnidade: (retifica?.doseUnidade ?? '') as PrescricaoFormValues['doseUnidade'],
      viaAdministracao: (retifica?.viaAdministracao ?? '') as PrescricaoFormValues['viaAdministracao'],
      status: retifica?.status ?? 'ATIVA',
    },
  })

  async function onSubmit(dados: PrescricaoFormValues) {
    try {
      await mutation.mutateAsync({
        animalId,
        medicamentoId: dados.medicamentoId,
        dataInicio: dados.dataInicio,
        dataFimPrevista: dados.dataFimPrevista,
        dataFimReal: dados.dataFimReal,
        frequenciaAplicada: dados.frequenciaAplicada,
        unidadeFrequencia: dados.unidadeFrequencia,
        doseQuantidade: dados.doseQuantidade,
        doseUnidade: dados.doseUnidade,
        viaAdministracao: dados.viaAdministracao,
        status: dados.status,
        retificaId: retifica?.id,
      })
      onSucesso()
    } catch {
      setSubmitError(`Não foi possível ${retifica ? 'corrigir' : 'registrar'} a prescrição. Tente novamente.`)
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
          <h3>{retifica ? 'Corrigir prescrição' : 'Registrar medicamento'}</h3>
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
                    O registro original não será alterado — esta correção cria um novo registro vinculado a ele (também usado
                    para mudar o status da prescrição).
                  </div>
                </div>
              )}

              <div className="field">
                <label htmlFor="pres-medicamento">
                  Medicamento <span className="req">*</span>
                </label>
                {/* Controller (não register puro): as opções vêm de uma query
                    assíncrona, e a pré-seleção do medicamentoId da retifica
                    só é aplicada corretamente se o <select> continuar
                    controlado — um register() não-controlado fixaria o valor
                    no momento do mount, antes das opções existirem, e nunca
                    mais re-sincronizaria quando elas chegassem. */}
                <Controller
                  name="medicamentoId"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="pres-medicamento"
                      className={`select${errors.medicamentoId ? ' error' : ''}`}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    >
                      <option value="" disabled>
                        Selecione…
                      </option>
                      {medicamentos?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.medicamentoId && <span className="err">{errors.medicamentoId.message}</span>}
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="pres-inicio">
                    Início <span className="req">*</span>
                  </label>
                  <input
                    id="pres-inicio"
                    className={`input${errors.dataInicio ? ' error' : ''}`}
                    type="date"
                    {...register('dataInicio')}
                  />
                  {errors.dataInicio && <span className="err">{errors.dataInicio.message}</span>}
                </div>
                <div className="field">
                  <label htmlFor="pres-fim-previsto">Término previsto</label>
                  <input
                    id="pres-fim-previsto"
                    className="input"
                    type="date"
                    {...register('dataFimPrevista', { setValueAs: (v: string) => v || undefined })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="pres-fim-real">Término real</label>
                  <input
                    id="pres-fim-real"
                    className="input"
                    type="date"
                    {...register('dataFimReal', { setValueAs: (v: string) => v || undefined })}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="pres-frequencia">
                    Frequência <span className="req">*</span>
                  </label>
                  <input
                    id="pres-frequencia"
                    className={`input${errors.frequenciaAplicada ? ' error' : ''}`}
                    type="number"
                    min={1}
                    step={1}
                    {...register('frequenciaAplicada', { valueAsNumber: true })}
                  />
                  {errors.frequenciaAplicada && <span className="err">{errors.frequenciaAplicada.message}</span>}
                </div>
                <div className="field">
                  <label htmlFor="pres-unidade-frequencia">
                    A cada <span className="req">*</span>
                  </label>
                  <select
                    id="pres-unidade-frequencia"
                    className={`select${errors.unidadeFrequencia ? ' error' : ''}`}
                    {...register('unidadeFrequencia')}
                  >
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {(Object.keys(LABELS_UNIDADE_FREQUENCIA) as (keyof typeof LABELS_UNIDADE_FREQUENCIA)[]).map((unidade) => (
                      <option key={unidade} value={unidade}>
                        {LABELS_UNIDADE_FREQUENCIA[unidade]}
                      </option>
                    ))}
                  </select>
                  {errors.unidadeFrequencia && <span className="err">{errors.unidadeFrequencia.message}</span>}
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="pres-dose-quantidade">
                    Dose <span className="req">*</span>
                  </label>
                  <input
                    id="pres-dose-quantidade"
                    className={`input${errors.doseQuantidade ? ' error' : ''}`}
                    type="number"
                    min={0}
                    step="0.001"
                    {...register('doseQuantidade', { valueAsNumber: true })}
                  />
                  {errors.doseQuantidade && <span className="err">{errors.doseQuantidade.message}</span>}
                </div>
                <div className="field">
                  <label htmlFor="pres-dose-unidade">
                    Unidade <span className="req">*</span>
                  </label>
                  <select
                    id="pres-dose-unidade"
                    className={`select${errors.doseUnidade ? ' error' : ''}`}
                    {...register('doseUnidade')}
                  >
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {(Object.keys(LABELS_UNIDADE_DOSE) as (keyof typeof LABELS_UNIDADE_DOSE)[]).map((unidade) => (
                      <option key={unidade} value={unidade}>
                        {LABELS_UNIDADE_DOSE[unidade]}
                      </option>
                    ))}
                  </select>
                  {errors.doseUnidade && <span className="err">{errors.doseUnidade.message}</span>}
                </div>
                <div className="field">
                  <label htmlFor="pres-via">
                    Via <span className="req">*</span>
                  </label>
                  <select
                    id="pres-via"
                    className={`select${errors.viaAdministracao ? ' error' : ''}`}
                    {...register('viaAdministracao')}
                  >
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {(Object.keys(LABELS_VIA_ADMINISTRACAO) as (keyof typeof LABELS_VIA_ADMINISTRACAO)[]).map((via) => (
                      <option key={via} value={via}>
                        {LABELS_VIA_ADMINISTRACAO[via]}
                      </option>
                    ))}
                  </select>
                  {errors.viaAdministracao && <span className="err">{errors.viaAdministracao.message}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="pres-status">
                  Status <span className="req">*</span>
                </label>
                <select id="pres-status" className="select" {...register('status')}>
                  {(Object.keys(LABELS_STATUS_PRESCRICAO) as (keyof typeof LABELS_STATUS_PRESCRICAO)[]).map((s) => (
                    <option key={s} value={s}>
                      {LABELS_STATUS_PRESCRICAO[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando…' : retifica ? 'Salvar correção' : 'Registrar medicamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
