import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { BannerRascunho } from '@/components/BannerRascunho'
import { Icon } from '@/components/layout/Icon'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { hojeEmItu } from '@/lib/datas'
import { aplicarErrosDeCampo, mapaDeCampos, mensagemDeRegraDaApi } from '@/lib/erroApi'
import { useRascunho } from '@/lib/useRascunho'
import { armazenamentoRascunhoClinico, chaveRascunhoClinico } from '../storage/rascunhoClinicoStorage'
import { exameFormSchema, type ExameFormValues } from '../schemas/historicoFormSchemas'
import { useCatalogosAnimaisQuery } from '../hooks/useAnimais'
import { useCriarExameMutation } from '../hooks/useHistoricoAnimal'
import type { Exame } from '../types/historico.types'

// F2-007 / RF-A04 (Fase 3 do TG): registro de exame, no mesmo padrão de
// ModalRegistrarProcedimento (registro imutável; correção = novo registro).
const semEspacos = (v: unknown) => (typeof v === 'string' ? v.trim() || undefined : v)

const MAPA_ERROS_SERVIDOR = mapaDeCampos<ExameFormValues>(Object.keys(exameFormSchema.shape) as (keyof ExameFormValues)[])

const ARMAZENAMENTO_RASCUNHO = armazenamentoRascunhoClinico<ExameFormValues>()

interface ModalRegistrarExameProps {
  animalId: string
  retifica?: Exame
  onFechar: () => void
  onSucesso: () => void
}

export function ModalRegistrarExame({ animalId, retifica, onFechar, onSucesso }: ModalRegistrarExameProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const mutation = useCriarExameMutation(animalId)
  const { data: catalogos } = useCatalogosAnimaisQuery()
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    setError,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ExameFormValues>({
    resolver: zodResolver(exameFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      tipoExame: retifica?.tipoExameCodigo ?? '',
      laboratorio: retifica?.laboratorioCodigo ?? '',
      dataSolicitacao: retifica?.dataSolicitacao ?? hojeEmItu(),
      dataResultado: retifica?.dataResultado ?? '',
      resultado: retifica?.resultado ?? '',
      observacoes: retifica?.observacoes ?? '',
    },
  })

  const rascunho = useRascunho<ExameFormValues>({
    armazenamento: ARMAZENAMENTO_RASCUNHO,
    chave: chaveRascunhoClinico(user?.id ?? '', 'exame', animalId, retifica?.id),
    watch,
    reset,
    getValues,
  })

  async function onSubmit(dados: ExameFormValues) {
    try {
      await mutation.mutateAsync({
        animalId,
        tipoExame: dados.tipoExame,
        laboratorio: dados.laboratorio || undefined,
        dataSolicitacao: dados.dataSolicitacao,
        dataResultado: dados.dataResultado || undefined,
        resultado: dados.resultado,
        observacoes: dados.observacoes,
        retificaId: retifica?.id,
      })
      await rascunho.removerAposSucesso()
      onSucesso()
    } catch (erro) {
      if (aplicarErrosDeCampo(erro, setError, MAPA_ERROS_SERVIDOR).length > 0) return
      setSubmitError(mensagemDeRegraDaApi(erro) ?? `Não foi possível ${retifica ? 'corrigir' : 'registrar'} o exame. Tente novamente.`)
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
          <h3>{retifica ? 'Corrigir exame' : 'Registrar exame'}</h3>
          <button type="button" className="btn btn-ghost btn-sm btn-icon-only" onClick={onFechar} aria-label="Fechar">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={aoEnviar} noValidate>
          <div className="modal-body">
            <div className="form-grid cols-1">
              {rascunho.rascunhoDisponivel && (
                <BannerRascunho onRestaurar={rascunho.restaurar} onDescartar={() => void rascunho.descartar()} salvoEm={rascunho.rascunhoSalvoEm} />
              )}
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
                  <label htmlFor="exame-tipo">
                    Tipo de exame <span className="req">*</span>
                  </label>
                  <select id="exame-tipo" className={`select${errors.tipoExame ? ' error' : ''}`} {...register('tipoExame')}>
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {(catalogos?.tiposExame ?? []).map((item) => (
                      <option key={item.codigo} value={item.codigo}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                  {errors.tipoExame && <span className="err">{errors.tipoExame.message}</span>}
                </div>

                <div className="field">
                  <label htmlFor="exame-laboratorio">Laboratório</label>
                  <select id="exame-laboratorio" className="select" {...register('laboratorio')}>
                    <option value="">Interno / não informado</option>
                    {(catalogos?.laboratorios ?? []).map((item) => (
                      <option key={item.codigo} value={item.codigo}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="exame-data-solicitacao">
                    Data da solicitação <span className="req">*</span>
                  </label>
                  <input
                    id="exame-data-solicitacao"
                    className={`input${errors.dataSolicitacao ? ' error' : ''}`}
                    type="date"
                    max={hojeEmItu()}
                    {...register('dataSolicitacao')}
                  />
                  {errors.dataSolicitacao && <span className="err">{errors.dataSolicitacao.message}</span>}
                </div>

                <div className="field">
                  <label htmlFor="exame-data-resultado">Data do resultado</label>
                  <input
                    id="exame-data-resultado"
                    className={`input${errors.dataResultado ? ' error' : ''}`}
                    type="date"
                    max={hojeEmItu()}
                    {...register('dataResultado')}
                  />
                  {errors.dataResultado && <span className="err">{errors.dataResultado.message}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="exame-resultado">Resultado / laudo</label>
                <textarea
                  id="exame-resultado"
                  className={`textarea${errors.resultado ? ' error' : ''}`}
                  rows={3}
                  {...register('resultado', { setValueAs: semEspacos })}
                />
                {errors.resultado ? (
                  <span className="err">{errors.resultado.message}</span>
                ) : (
                  <span className="hint">Informe junto com a data do resultado; deixe em branco enquanto o exame estiver pendente.</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="exame-observacoes">Observações</label>
                <textarea id="exame-observacoes" className="textarea" rows={2} {...register('observacoes', { setValueAs: semEspacos })} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando…' : retifica ? 'Salvar correção' : 'Registrar exame'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
