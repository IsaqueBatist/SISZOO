import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/layout/Icon'
import { prescricaoFormSchema } from './historicoFormSchemas'
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

interface FieldErrors {
  medicamentoId?: string
  dataInicio?: string
  frequenciaAplicada?: string
  unidadeFrequencia?: string
  doseQuantidade?: string
  doseUnidade?: string
  viaAdministracao?: string
}

export function ModalRegistrarMedicamento({ animalId, retifica, onFechar, onSucesso }: ModalRegistrarMedicamentoProps) {
  const [medicamentoId, setMedicamentoId] = useState(retifica?.medicamentoId ?? '')
  const [dataInicio, setDataInicio] = useState(retifica?.dataInicio ?? '')
  const [dataFimPrevista, setDataFimPrevista] = useState(retifica?.dataFimPrevista ?? '')
  const [dataFimReal, setDataFimReal] = useState(retifica?.dataFimReal ?? '')
  const [frequenciaAplicada, setFrequenciaAplicada] = useState(
    retifica ? String(retifica.frequenciaAplicada) : '',
  )
  const [unidadeFrequencia, setUnidadeFrequencia] = useState(retifica?.unidadeFrequencia ?? '')
  const [doseQuantidade, setDoseQuantidade] = useState(retifica ? String(retifica.doseQuantidade) : '')
  const [doseUnidade, setDoseUnidade] = useState(retifica?.doseUnidade ?? '')
  const [viaAdministracao, setViaAdministracao] = useState(retifica?.viaAdministracao ?? '')
  const [status, setStatus] = useState(retifica?.status ?? 'ATIVA')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: medicamentos } = useMedicamentosAtivosQuery()
  const mutation = useCriarPrescricaoMutation(animalId)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const resultado = prescricaoFormSchema.safeParse({
      medicamentoId,
      dataInicio,
      dataFimPrevista: dataFimPrevista || undefined,
      dataFimReal: dataFimReal || undefined,
      frequenciaAplicada: frequenciaAplicada.trim() ? Number(frequenciaAplicada) : undefined,
      unidadeFrequencia: unidadeFrequencia || undefined,
      doseQuantidade: doseQuantidade.trim() ? Number(doseQuantidade) : undefined,
      doseUnidade: doseUnidade || undefined,
      viaAdministracao: viaAdministracao || undefined,
      status,
    })

    if (!resultado.success) {
      const erros: FieldErrors = {}
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0]
        if (
          campo === 'medicamentoId' ||
          campo === 'dataInicio' ||
          campo === 'frequenciaAplicada' ||
          campo === 'unidadeFrequencia' ||
          campo === 'doseQuantidade' ||
          campo === 'doseUnidade' ||
          campo === 'viaAdministracao'
        ) {
          erros[campo] = issue.message
        }
      }
      setFieldErrors(erros)
      return
    }

    setFieldErrors({})
    try {
      await mutation.mutateAsync({
        animalId,
        medicamentoId: resultado.data.medicamentoId,
        dataInicio: resultado.data.dataInicio,
        dataFimPrevista: resultado.data.dataFimPrevista,
        dataFimReal: resultado.data.dataFimReal,
        frequenciaAplicada: resultado.data.frequenciaAplicada,
        unidadeFrequencia: resultado.data.unidadeFrequencia,
        doseQuantidade: resultado.data.doseQuantidade,
        doseUnidade: resultado.data.doseUnidade,
        viaAdministracao: resultado.data.viaAdministracao,
        status: resultado.data.status,
        retificaId: retifica?.id,
      })
      onSucesso()
    } catch {
      setSubmitError(`Não foi possível ${retifica ? 'corrigir' : 'registrar'} a prescrição. Tente novamente.`)
    }
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

        <form onSubmit={handleSubmit} noValidate>
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
                <select
                  id="pres-medicamento"
                  className={`select${fieldErrors.medicamentoId ? ' error' : ''}`}
                  value={medicamentoId}
                  onChange={(event) => setMedicamentoId(event.target.value)}
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
                {fieldErrors.medicamentoId && <span className="err">{fieldErrors.medicamentoId}</span>}
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="pres-inicio">
                    Início <span className="req">*</span>
                  </label>
                  <input
                    id="pres-inicio"
                    className={`input${fieldErrors.dataInicio ? ' error' : ''}`}
                    type="date"
                    value={dataInicio}
                    onChange={(event) => setDataInicio(event.target.value)}
                  />
                  {fieldErrors.dataInicio && <span className="err">{fieldErrors.dataInicio}</span>}
                </div>
                <div className="field">
                  <label htmlFor="pres-fim-previsto">Término previsto</label>
                  <input
                    id="pres-fim-previsto"
                    className="input"
                    type="date"
                    value={dataFimPrevista}
                    onChange={(event) => setDataFimPrevista(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="pres-fim-real">Término real</label>
                  <input
                    id="pres-fim-real"
                    className="input"
                    type="date"
                    value={dataFimReal}
                    onChange={(event) => setDataFimReal(event.target.value)}
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
                    className={`input${fieldErrors.frequenciaAplicada ? ' error' : ''}`}
                    type="number"
                    min={1}
                    step={1}
                    value={frequenciaAplicada}
                    onChange={(event) => setFrequenciaAplicada(event.target.value)}
                  />
                  {fieldErrors.frequenciaAplicada && <span className="err">{fieldErrors.frequenciaAplicada}</span>}
                </div>
                <div className="field">
                  <label htmlFor="pres-unidade-frequencia">
                    A cada <span className="req">*</span>
                  </label>
                  <select
                    id="pres-unidade-frequencia"
                    className={`select${fieldErrors.unidadeFrequencia ? ' error' : ''}`}
                    value={unidadeFrequencia}
                    onChange={(event) => setUnidadeFrequencia(event.target.value as typeof unidadeFrequencia)}
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
                  {fieldErrors.unidadeFrequencia && <span className="err">{fieldErrors.unidadeFrequencia}</span>}
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="pres-dose-quantidade">
                    Dose <span className="req">*</span>
                  </label>
                  <input
                    id="pres-dose-quantidade"
                    className={`input${fieldErrors.doseQuantidade ? ' error' : ''}`}
                    type="number"
                    min={0}
                    step="0.001"
                    value={doseQuantidade}
                    onChange={(event) => setDoseQuantidade(event.target.value)}
                  />
                  {fieldErrors.doseQuantidade && <span className="err">{fieldErrors.doseQuantidade}</span>}
                </div>
                <div className="field">
                  <label htmlFor="pres-dose-unidade">
                    Unidade <span className="req">*</span>
                  </label>
                  <select
                    id="pres-dose-unidade"
                    className={`select${fieldErrors.doseUnidade ? ' error' : ''}`}
                    value={doseUnidade}
                    onChange={(event) => setDoseUnidade(event.target.value as typeof doseUnidade)}
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
                  {fieldErrors.doseUnidade && <span className="err">{fieldErrors.doseUnidade}</span>}
                </div>
                <div className="field">
                  <label htmlFor="pres-via">
                    Via <span className="req">*</span>
                  </label>
                  <select
                    id="pres-via"
                    className={`select${fieldErrors.viaAdministracao ? ' error' : ''}`}
                    value={viaAdministracao}
                    onChange={(event) => setViaAdministracao(event.target.value as typeof viaAdministracao)}
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
                  {fieldErrors.viaAdministracao && <span className="err">{fieldErrors.viaAdministracao}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="pres-status">
                  Status <span className="req">*</span>
                </label>
                <select
                  id="pres-status"
                  className="select"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as typeof status)}
                >
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
