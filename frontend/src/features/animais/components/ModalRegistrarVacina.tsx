import { useEffect, useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AtalhoHoje } from '@/components/AtalhoHoje'
import { AvisoEnvioPausado } from '@/components/AvisoEnvioPausado'
import { toast } from '@/components/toast/toast'
import { AlertaErroEnvio } from '@/components/AlertaErroEnvio'
import { Modal } from '@/components/Modal'
import { BannerRascunho } from '@/components/BannerRascunho'
import { Icon } from '@/components/layout/Icon'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { adicionarMesesIso, formatarDataBR } from '@/lib/datas'
import { aplicarErrosDeCampo, mapaDeCampos, mensagemDeRegraDaApi } from '@/lib/erroApi'
import { useRascunho } from '@/lib/useRascunho'
import { armazenamentoRascunhoClinico, chaveRascunhoClinico } from '../storage/rascunhoClinicoStorage'
import { useCatalogosAnimaisQuery } from '../hooks/useAnimais'
import { CadastroRapidoVacina } from './CadastroRapidoVacina'
import { SelectCatalogoClinico } from './SelectCatalogoClinico'
import { vacinacaoFormSchema, type VacinacaoFormValues } from '../schemas/historicoFormSchemas'
import { LABELS_UNIDADE_DOSE } from '../utils/historicoLabels'
import { hojeEmItu } from '../utils/regrasVacina'
import { useCriarVacinacaoMutation } from '../hooks/useHistoricoAnimal'
import type { Vacinacao } from '../types/historico.types'

const MAPA_ERROS_SERVIDOR = mapaDeCampos<VacinacaoFormValues>(
  Object.keys(vacinacaoFormSchema.shape) as (keyof VacinacaoFormValues)[],
)

const ARMAZENAMENTO_RASCUNHO = armazenamentoRascunhoClinico<VacinacaoFormValues>()

interface ModalRegistrarVacinaProps {
  animalId: string
  reforco?: boolean
  vacinaPreSelecionada?: string
  retifica?: Vacinacao
  onFechar: () => void
  onSucesso: () => void
}

export function ModalRegistrarVacina({
  animalId,
  reforco = false,
  vacinaPreSelecionada,
  retifica,
  onFechar,
  onSucesso,
}: ModalRegistrarVacinaProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [cadastrandoVacina, setCadastrandoVacina] = useState(false)
  const [codigoRecemCadastrado, setCodigoRecemCadastrado] = useState<string | null>(null)

  const mutation = useCriarVacinacaoMutation(animalId)
  const catalogos = useCatalogosAnimaisQuery()

  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    setError,
    watch,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<VacinacaoFormValues>({
    resolver: zodResolver(vacinacaoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      vacina: vacinaPreSelecionada ?? retifica?.vacinaCodigo ?? '',
      dataAplicacao: reforco ? hojeEmItu() : (retifica?.dataAplicacao ?? ''),
      numeroDose: retifica?.numeroDose ?? undefined,
      doseQuantidade: retifica?.doseQuantidade,
      doseUnidade: retifica?.doseUnidade ?? undefined,
      lote: retifica?.lote ?? '',
      observacoes: retifica?.observacoes ?? '',
    },
  })

  const rascunho = useRascunho<VacinacaoFormValues>({
    armazenamento: ARMAZENAMENTO_RASCUNHO,
    chave: chaveRascunhoClinico(user?.id ?? '', 'vacina', animalId, retifica?.id),
    watch,
    reset,
    getValues,
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
      await rascunho.removerAposSucesso()
      toast.sucesso(retifica ? 'Vacinação corrigida.' : reforco ? 'Reforço registrado.' : 'Vacina registrada.')
      onSucesso()
    } catch (erro) {
      if (aplicarErrosDeCampo(erro, setError, MAPA_ERROS_SERVIDOR).length > 0) return
      setSubmitError(
        mensagemDeRegraDaApi(erro) ??
          `Não foi possível ${retifica ? 'corrigir' : 'registrar'} a vacinação. Tente novamente.`,
      )
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  const codigoEscolhido = watch('vacina')
  const dataEscolhida = watch('dataAplicacao')
  const vacinaEscolhida = catalogos.data?.vacinas.find((item) => item.codigo === codigoEscolhido)
  const previsaoReforco =
    vacinaEscolhida?.intervaloMeses && dataEscolhida
      ? adicionarMesesIso(dataEscolhida, vacinaEscolhida.intervaloMeses)
      : null

  useEffect(() => {
    if (!codigoRecemCadastrado) return
    if (!catalogos.data?.vacinas.some((item) => item.codigo === codigoRecemCadastrado)) return
    setValue('vacina', codigoRecemCadastrado, { shouldValidate: true })
    setCodigoRecemCadastrado(null)
  }, [codigoRecemCadastrado, catalogos.data, setValue])

  function aoCadastrarVacina(codigo: string) {
    setCodigoRecemCadastrado(codigo)
    setCadastrandoVacina(false)
    toast.sucesso('Vacina cadastrada e selecionada.')
  }

  return (
    <Modal
      titulo={retifica ? 'Corrigir vacinação' : reforco ? 'Registrar reforço' : 'Registrar vacina'}
      onFechar={onFechar}
    >
      <form onSubmit={aoEnviar} noValidate>
        <div className="modal-body">
          <div className="form-grid cols-1">
            {rascunho.rascunhoDisponivel && (
              <BannerRascunho onRestaurar={rascunho.restaurar} onDescartar={() => void rascunho.descartar()} salvoEm={rascunho.rascunhoSalvoEm} />
            )}
            <AlertaErroEnvio mensagem={submitError} />
            {reforco && (
              <div className="alert info" role="status">
                <div className="alert-content">
                  Nova aplicação desta vacina.
                  <div className="alert-desc">
                    A aplicação anterior continua no histórico; esta passa a ser a vigente, e o alerta de
                    reforço é recalculado a partir dela.
                  </div>
                </div>
              </div>
            )}
            {retifica && (
              <div className="alert info" role="alert">
                <div className="alert-content">
                  O registro original não será alterado — esta correção cria um novo registro vinculado a ele.
                  <div className="alert-desc">
                    Use isto só para consertar um dado errado: a aplicação original passa a constar como
                    retificada. Para lançar uma <strong>nova aplicação</strong>, feche e use "Registrar reforço".
                  </div>
                </div>
              </div>
            )}

            <div className="form-grid">
              <div className="field">
                <label htmlFor="vac-vacina">
                  Vacina <span className="req">*</span>
                </label>
                <div className="flex gap-2">
                  <div style={{ flex: 1 }}>
                    <SelectCatalogoClinico
                      id="vac-vacina"
                      itens={catalogos.data?.vacinas}
                      carregando={catalogos.isLoading}
                      comErro={catalogos.isError}
                      onTentarNovamente={() => void catalogos.refetch()}
                      registro={register('vacina')}
                      temErro={Boolean(errors.vacina)}
                    />
                  </div>
                  {!cadastrandoVacina && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm btn-icon-only"
                      title="Cadastrar nova vacina"
                      aria-label="Cadastrar nova vacina"
                      onClick={() => setCadastrandoVacina(true)}
                    >
                      <Icon name="plus" size={16} />
                    </button>
                  )}
                </div>
                {errors.vacina && <span className="err">{errors.vacina.message}</span>}
                {previsaoReforco && (
                  <span className="hint">
                    Próximo reforço: {formatarDataBR(previsaoReforco)} (intervalo de{' '}
                    {vacinaEscolhida?.intervaloMeses} meses)
                  </span>
                )}
                {vacinaEscolhida && !vacinaEscolhida.intervaloMeses && (
                  <span className="hint">Esta vacina não tem intervalo de reforço: não gera alerta.</span>
                )}
              </div>

              {cadastrandoVacina && (
                <div className="field full">
                  <CadastroRapidoVacina
                    onCadastrada={aoCadastrarVacina}
                    onCancelar={() => setCadastrandoVacina(false)}
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="vac-data">
                  Data de aplicação <span className="req">*</span>
                </label>
                <input
                  id="vac-data"
                  className={`input${errors.dataAplicacao ? ' error' : ''}`} aria-invalid={errors.dataAplicacao ? true : undefined} aria-describedby={errors.dataAplicacao ? 'vac-data-erro' : undefined}
                  type="date"
                  max={hojeEmItu()}
                  {...register('dataAplicacao')}
                />
                <AtalhoHoje onEscolher={(hoje) => setValue('dataAplicacao', hoje, { shouldDirty: true })} />
                {errors.dataAplicacao && <span className="err" id="vac-data-erro">{errors.dataAplicacao.message}</span>}
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
                  className={`input${errors.doseQuantidade ? ' error' : ''}`} aria-invalid={errors.doseQuantidade ? true : undefined} aria-describedby={errors.doseQuantidade ? 'vac-dose-quantidade-erro' : undefined}
                  type="number"
                  min={0}
                  step="0.001"
                  {...register('doseQuantidade', { valueAsNumber: true })}
                />
                {errors.doseQuantidade && <span className="err" id="vac-dose-quantidade-erro">{errors.doseQuantidade.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="vac-dose-unidade">
                  Unidade <span className="req">*</span>
                </label>
                <select
                  id="vac-dose-unidade"
                  className={`select${errors.doseUnidade ? ' error' : ''}`} aria-invalid={errors.doseUnidade ? true : undefined} aria-describedby={errors.doseUnidade ? 'vac-dose-unidade-erro' : undefined}
                  {...register('doseUnidade', { setValueAs: (v) => (v === '' ? undefined : v) })}
                >
                  <option value="">—</option>
                  {(Object.keys(LABELS_UNIDADE_DOSE) as (keyof typeof LABELS_UNIDADE_DOSE)[]).map((unidade) => (
                    <option key={unidade} value={unidade}>
                      {LABELS_UNIDADE_DOSE[unidade]}
                    </option>
                  ))}
                </select>
                {errors.doseUnidade && <span className="err" id="vac-dose-unidade-erro">{errors.doseUnidade.message}</span>}
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
          <AvisoEnvioPausado pausado={mutation.isPaused} />
          <button type="button" className="btn btn-ghost" onClick={onFechar}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={mutation.isPending || !catalogos.data?.vacinas.length}
          >
            {mutation.isPaused ? 'Aguardando conexão…' : mutation.isPending ? 'Salvando…' : retifica ? 'Salvar correção' : 'Registrar vacina'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
