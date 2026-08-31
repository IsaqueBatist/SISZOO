import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/layout/Icon'
import { useAtualizarBaiaMutation, useCatalogosAnimaisQuery, useCriarBaiaMutation } from '../animais/useAnimais'
import type { Baia } from '../animais/animais.types'
import { baiaFormSchema } from './baiaFormSchema'

interface BaiaFormModalProps {
  baia?: Baia
  onFechar: () => void
}

interface FieldErrors {
  nome?: string
  tipoBaia?: string
  capacidade?: string
  finalidade?: string
}

export function BaiaFormModal({ baia, onFechar }: BaiaFormModalProps) {
  const editando = Boolean(baia)
  const [nome, setNome] = useState(baia?.nome ?? '')
  const [tipoBaia, setTipoBaia] = useState(baia?.tipoBaiaCodigo ?? '')
  const [capacidade, setCapacidade] = useState(baia ? String(baia.capacidade) : '')
  const [finalidade, setFinalidade] = useState(baia?.finalidade ?? '')
  const [observacoes, setObservacoes] = useState(baia?.observacoes ?? '')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: catalogos } = useCatalogosAnimaisQuery()
  const criarMutation = useCriarBaiaMutation()
  const atualizarMutation = useAtualizarBaiaMutation()
  const mutation = editando ? atualizarMutation : criarMutation

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const resultado = baiaFormSchema.safeParse({
      nome,
      tipoBaia,
      capacidade: capacidade === '' ? undefined : Number(capacidade),
      finalidade: finalidade || undefined,
      observacoes: observacoes || undefined,
    })

    if (!resultado.success) {
      const erros: FieldErrors = {}
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0]
        if (campo === 'nome' || campo === 'tipoBaia' || campo === 'capacidade' || campo === 'finalidade') {
          erros[campo] = issue.message
        }
      }
      setFieldErrors(erros)
      return
    }

    setFieldErrors({})
    const payload = {
      nome: resultado.data.nome,
      tipoBaia: resultado.data.tipoBaia,
      capacidade: resultado.data.capacidade,
      finalidade: resultado.data.finalidade,
      observacoes: resultado.data.observacoes,
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

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{editando ? 'Editar Baia' : 'Adicionar Baia'}</h3>
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

              <div className="field">
                <label htmlFor="baia-nome">
                  Nome <span className="req">*</span>
                </label>
                <input
                  id="baia-nome"
                  className={`input${fieldErrors.nome ? ' error' : ''}`}
                  type="text"
                  placeholder="Baia 8"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                />
                {fieldErrors.nome && <span className="err">{fieldErrors.nome}</span>}
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="baia-tipo">
                    Tipo <span className="req">*</span>
                  </label>
                  <select
                    id="baia-tipo"
                    className={`select${fieldErrors.tipoBaia ? ' error' : ''}`}
                    value={tipoBaia}
                    onChange={(event) => setTipoBaia(event.target.value)}
                  >
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {catalogos?.tiposBaia.map((tipo) => (
                      <option key={tipo.codigo} value={tipo.codigo}>
                        {tipo.nome}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.tipoBaia && <span className="err">{fieldErrors.tipoBaia}</span>}
                </div>

                <div className="field">
                  <label htmlFor="baia-capacidade">
                    Capacidade <span className="req">*</span>
                  </label>
                  <input
                    id="baia-capacidade"
                    className={`input${fieldErrors.capacidade ? ' error' : ''}`}
                    type="number"
                    min={1}
                    step={1}
                    value={capacidade}
                    onChange={(event) => setCapacidade(event.target.value)}
                  />
                  {fieldErrors.capacidade && <span className="err">{fieldErrors.capacidade}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="baia-finalidade">Finalidade</label>
                <input
                  id="baia-finalidade"
                  className={`input${fieldErrors.finalidade ? ' error' : ''}`}
                  type="text"
                  placeholder="Cães porte médio"
                  value={finalidade}
                  onChange={(event) => setFinalidade(event.target.value)}
                />
                {fieldErrors.finalidade && <span className="err">{fieldErrors.finalidade}</span>}
              </div>

              <div className="field">
                <label htmlFor="baia-observacoes">Observações</label>
                <textarea
                  id="baia-observacoes"
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
              {mutation.isPending ? 'Salvando…' : editando ? 'Salvar' : 'Criar Baia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
