import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/layout/Icon'
import { TIPOS_PROCEDIMENTO } from './catalogoClinico'
import { procedimentoFormSchema } from './historicoFormSchemas'
import { useCriarProcedimentoMutation } from './useHistoricoAnimal'
import type { Procedimento } from './historico.types'

interface ModalRegistrarProcedimentoProps {
  animalId: string
  // Ver comentário equivalente em ModalRegistrarVacina.tsx.
  retifica?: Procedimento
  onFechar: () => void
  onSucesso: () => void
}

interface FieldErrors {
  tipoProcedimento?: string
  data?: string
}

export function ModalRegistrarProcedimento({ animalId, retifica, onFechar, onSucesso }: ModalRegistrarProcedimentoProps) {
  const [tipoProcedimento, setTipoProcedimento] = useState(retifica?.tipoProcedimentoCodigo ?? '')
  const [data, setData] = useState(retifica?.data ?? '')
  const [descricao, setDescricao] = useState(retifica?.descricao ?? '')
  const [resultado, setResultado] = useState(retifica?.resultado ?? '')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useCriarProcedimentoMutation(animalId)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const resultadoValidacao = procedimentoFormSchema.safeParse({
      tipoProcedimento,
      data,
      descricao: descricao.trim() || undefined,
      resultado: resultado.trim() || undefined,
    })

    if (!resultadoValidacao.success) {
      const erros: FieldErrors = {}
      for (const issue of resultadoValidacao.error.issues) {
        const campo = issue.path[0]
        if (campo === 'tipoProcedimento' || campo === 'data') erros[campo] = issue.message
      }
      setFieldErrors(erros)
      return
    }

    setFieldErrors({})
    try {
      await mutation.mutateAsync({
        animalId,
        tipoProcedimento: resultadoValidacao.data.tipoProcedimento,
        data: resultadoValidacao.data.data,
        descricao: resultadoValidacao.data.descricao,
        resultado: resultadoValidacao.data.resultado,
        retificaId: retifica?.id,
      })
      onSucesso()
    } catch {
      setSubmitError(`Não foi possível ${retifica ? 'corrigir' : 'registrar'} o procedimento. Tente novamente.`)
    }
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
                  <label htmlFor="proc-tipo">
                    Tipo de procedimento <span className="req">*</span>
                  </label>
                  <select
                    id="proc-tipo"
                    className={`select${fieldErrors.tipoProcedimento ? ' error' : ''}`}
                    value={tipoProcedimento}
                    onChange={(event) => setTipoProcedimento(event.target.value)}
                  >
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {TIPOS_PROCEDIMENTO.map((item) => (
                      <option key={item.codigo} value={item.codigo}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.tipoProcedimento && <span className="err">{fieldErrors.tipoProcedimento}</span>}
                </div>

                <div className="field">
                  <label htmlFor="proc-data">
                    Data <span className="req">*</span>
                  </label>
                  <input
                    id="proc-data"
                    className={`input${fieldErrors.data ? ' error' : ''}`}
                    type="date"
                    value={data}
                    onChange={(event) => setData(event.target.value)}
                  />
                  {fieldErrors.data && <span className="err">{fieldErrors.data}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="proc-descricao">Descrição</label>
                <textarea
                  id="proc-descricao"
                  className="textarea"
                  rows={3}
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="proc-resultado">Resultado / observações pós-procedimento</label>
                <textarea
                  id="proc-resultado"
                  className="textarea"
                  rows={3}
                  value={resultado}
                  onChange={(event) => setResultado(event.target.value)}
                />
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
