import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Icon } from '@/components/layout/Icon'
import { toast } from '@/components/toast/toast'
import { aplicarErrosDeCampo, mapaDeCampos, mensagemDeRegraDaApi } from '@/lib/erroApi'
import { useAtualizarVacinaMutation, useCriarVacinaMutation } from '../hooks/useVacinas'
import { vacinaFormSchema, type VacinaFormValues } from '../schemas/vacinaFormSchema'
import type { Vacina } from '../types/vacinas.types'

const MAPA_ERROS_VACINA = mapaDeCampos<VacinaFormValues>(['nome', 'intervaloMeses'])

interface VacinaFormModalProps {
  vacina?: Vacina
  onFechar: () => void
}

export function VacinaFormModal({ vacina, onFechar }: VacinaFormModalProps) {
  const editando = vacina !== undefined
  const [submitError, setSubmitError] = useState<string | null>(null)
  const criar = useCriarVacinaMutation()
  const atualizar = useAtualizarVacinaMutation()

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<VacinaFormValues>({
    resolver: zodResolver(vacinaFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      nome: vacina?.nome ?? '',
      intervaloMeses: vacina?.intervaloMeses ?? undefined,
    },
  })

  const salvando = criar.isPending || atualizar.isPending

  const intervaloDigitado = watch('intervaloMeses')
  const intervaloMudou = editando && (intervaloDigitado ?? null) !== (vacina.intervaloMeses ?? null)

  async function salvar(dados: VacinaFormValues) {
    try {
      if (editando) {
        await atualizar.mutateAsync({
          id: vacina.id,
          payload: { nome: dados.nome, intervaloMeses: dados.intervaloMeses, ativo: vacina.ativo },
        })
        toast.sucesso(`${dados.nome} atualizada.`)
      } else {
        const criada = await criar.mutateAsync({ nome: dados.nome, intervaloMeses: dados.intervaloMeses })
        toast.sucesso(`${criada.nome} cadastrada.`)
      }
      onFechar()
    } catch (erro) {
      if (aplicarErrosDeCampo(erro, setError, MAPA_ERROS_VACINA).length > 0) return
      setSubmitError(
        mensagemDeRegraDaApi(erro) ??
          `Não foi possível ${editando ? 'salvar' : 'cadastrar'} a vacina. Tente novamente.`,
      )
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(salvar)(event)
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{editando ? 'Editar vacina' : 'Cadastrar vacina'}</h3>
          <button type="button" className="btn btn-ghost btn-sm btn-icon-only" onClick={onFechar} aria-label="Fechar">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={aoEnviar} noValidate>
          <div className="modal-body">
            <div className="form-grid cols-1">
              {submitError && (
                <div className="alert danger" role="alert">
                  <div className="alert-content">{submitError}</div>
                </div>
              )}

              <div className="field">
                <label htmlFor="vacina-nome">
                  Nome <span className="req">*</span>
                </label>
                <input
                  id="vacina-nome"
                  className={`input${errors.nome ? ' error' : ''}`}
                  type="text"
                  placeholder="Ex: Antirrábica"
                  autoFocus
                  {...register('nome')}
                />
                {errors.nome && <span className="err">{errors.nome.message}</span>}
              </div>

              {editando && (
                <div className="field">
                  <label htmlFor="vacina-codigo">Código</label>
                  <input id="vacina-codigo" className="input mono" type="text" value={vacina.codigo} disabled readOnly />
                  <span className="hint">
                    Derivado do nome quando a vacina foi criada e usado nos registros já gravados. Renomear a
                    vacina não o altera.
                  </span>
                </div>
              )}

              <div className="field">
                <label htmlFor="vacina-intervalo">Intervalo de reforço (meses)</label>
                <input
                  id="vacina-intervalo"
                  className={`input${errors.intervaloMeses ? ' error' : ''}`}
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Ex: 12"
                  {...register('intervaloMeses', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                />
                {errors.intervaloMeses && <span className="err">{errors.intervaloMeses.message}</span>}
                <span className="hint">
                  É esse intervalo que gera o alerta de reforço: a validade de cada aplicação é a data aplicada
                  mais esses meses. Deixe em branco se a vacina não tem reforço.
                </span>
              </div>

              {intervaloMudou && (
                <div className="alert warning" role="status">
                  <div className="alert-content">
                    Isto muda a validade das aplicações já lançadas desta vacina.
                    <div className="alert-desc">
                      A data de reforço não fica guardada: ela é calculada a partir deste intervalo toda vez que
                      é mostrada. Nenhum registro é alterado, mas a ficha dos animais e o alerta passam a
                      apontar outra data. Os indicadores do painel podem levar até 5 minutos para acompanhar.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar vacina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
