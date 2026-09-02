import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/layout/Icon'
import { VACINAS } from './catalogoClinico'
import { vacinacaoFormSchema } from './historicoFormSchemas'
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

interface FieldErrors {
  vacina?: string
  dataAplicacao?: string
  numeroDose?: string
  doseQuantidade?: string
}

export function ModalRegistrarVacina({ animalId, retifica, onFechar, onSucesso }: ModalRegistrarVacinaProps) {
  const [vacina, setVacina] = useState(retifica?.vacinaCodigo ?? '')
  const [dataAplicacao, setDataAplicacao] = useState(retifica?.dataAplicacao ?? '')
  const [numeroDose, setNumeroDose] = useState(retifica?.numeroDose != null ? String(retifica.numeroDose) : '')
  const [doseQuantidade, setDoseQuantidade] = useState(retifica ? String(retifica.doseQuantidade) : '')
  const [doseUnidade, setDoseUnidade] = useState(retifica?.doseUnidade ?? '')
  const [lote, setLote] = useState(retifica?.lote ?? '')
  const [observacoes, setObservacoes] = useState(retifica?.observacoes ?? '')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useCriarVacinacaoMutation(animalId)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const resultado = vacinacaoFormSchema.safeParse({
      vacina,
      dataAplicacao,
      numeroDose: numeroDose.trim() ? Number(numeroDose) : undefined,
      doseQuantidade: doseQuantidade.trim() ? Number(doseQuantidade) : undefined,
      doseUnidade: doseUnidade || undefined,
      lote: lote.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    })

    if (!resultado.success) {
      const erros: FieldErrors = {}
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0]
        if (campo === 'vacina' || campo === 'dataAplicacao' || campo === 'numeroDose' || campo === 'doseQuantidade') {
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
        vacina: resultado.data.vacina,
        dataAplicacao: resultado.data.dataAplicacao,
        numeroDose: resultado.data.numeroDose,
        doseQuantidade: resultado.data.doseQuantidade,
        doseUnidade: resultado.data.doseUnidade,
        lote: resultado.data.lote,
        observacoes: resultado.data.observacoes,
        retificaId: retifica?.id,
      })
      onSucesso()
    } catch {
      setSubmitError(`Não foi possível ${retifica ? 'corrigir' : 'registrar'} a vacinação. Tente novamente.`)
    }
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
                    O registro original não será alterado — esta correção cria um novo registro vinculado a ele.
                  </div>
                </div>
              )}

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="vac-vacina">
                    Vacina <span className="req">*</span>
                  </label>
                  <select
                    id="vac-vacina"
                    className={`select${fieldErrors.vacina ? ' error' : ''}`}
                    value={vacina}
                    onChange={(event) => setVacina(event.target.value)}
                  >
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {VACINAS.map((item) => (
                      <option key={item.codigo} value={item.codigo}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.vacina && <span className="err">{fieldErrors.vacina}</span>}
                </div>

                <div className="field">
                  <label htmlFor="vac-data">
                    Data de aplicação <span className="req">*</span>
                  </label>
                  <input
                    id="vac-data"
                    className={`input${fieldErrors.dataAplicacao ? ' error' : ''}`}
                    type="date"
                    value={dataAplicacao}
                    onChange={(event) => setDataAplicacao(event.target.value)}
                  />
                  {fieldErrors.dataAplicacao && <span className="err">{fieldErrors.dataAplicacao}</span>}
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
                    value={numeroDose}
                    onChange={(event) => setNumeroDose(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="vac-dose-quantidade">
                    Quantidade da dose <span className="req">*</span>
                  </label>
                  <input
                    id="vac-dose-quantidade"
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
                  <label htmlFor="vac-dose-unidade">Unidade</label>
                  <select
                    id="vac-dose-unidade"
                    className="select"
                    value={doseUnidade}
                    onChange={(event) => setDoseUnidade(event.target.value as typeof doseUnidade)}
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
                <input id="vac-lote" className="input" type="text" value={lote} onChange={(event) => setLote(event.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="vac-observacoes">Observações</label>
                <textarea
                  id="vac-observacoes"
                  className="textarea"
                  rows={3}
                  value={observacoes}
                  onChange={(event) => setObservacoes(event.target.value)}
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
