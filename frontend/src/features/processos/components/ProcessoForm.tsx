import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type FormEvent } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { BannerRascunho } from '@/components/BannerRascunho'
import { Stepper } from '@/components/Stepper'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { camposDoErro, mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'
import { AmostraAnimalCard, type AmostraErros } from './AmostraAnimalCard'
import './ProcessoForm.css'
import { CAMPOS_STEP, processoFormSchema, type ProcessoFormValues } from '../schemas/processoFormSchema'
import { amostraVazia, paraRequisicao, valoresVazios } from '../utils/processoFormMapeamento'
import {
  agendarSalvarRascunhoProcesso,
  carregarRascunhoProcesso,
  chaveRascunhoProcesso,
  removerRascunhoProcesso,
  salvarRascunhoProcesso,
  type RascunhoProcesso,
} from '../storage/rascunhoProcessoStorage'
import { CamposDadosProcesso } from './CamposDadosProcesso'
import { CamposResponsavel } from './CamposResponsavel'
import { RevisaoProcesso } from './RevisaoProcesso'
import { SeletorOcorrencia, type OcorrenciaParaVinculo } from './SeletorOcorrencia'
import { useCatalogosProcessoQuery, useCriarProcessoMutation } from '../hooks/useProcessos'

// Mensagem do servidor (409/422) com os campos recusados, quando vierem.
function mensagemDoErro(erro: unknown): string {
  if (statusHttpDoErro(erro) === 403) {
    return 'Você não tem permissão para registrar este processo (vincular a uma ocorrência exige escrita em ocorrências).'
  }
  const mensagem = mensagemDeRegraDaApi(erro)
  if (!mensagem) return 'Não foi possível registrar o processo. Tente novamente.'
  const campos = camposDoErro(erro)
  return campos.length ? `${mensagem}: ${campos.map((c) => `${c.campo} — ${c.mensagem}`).join('; ')}` : mensagem
}

interface ProcessoFormProps {
  // Etapa 1 pré-preenchida e travada (entrada pelo detalhe da ocorrência).
  ocorrenciaDaUrl: OcorrenciaParaVinculo | null
  // OCORRENCIAS_DENUNCIAS:escrita (D33): Admin e Agente. O Vet cria processo
  // sem vínculo.
  podeVincular: boolean
}

export function ProcessoForm({ ocorrenciaDaUrl, podeVincular }: ProcessoFormProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const chaveRascunho = chaveRascunhoProcesso(user?.id ?? '')
  const mutation = useCriarProcessoMutation()
  const { data: catalogos, isError: erroCatalogos } = useCatalogosProcessoQuery()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [vinculoTravado, setVinculoTravado] = useState(false)
  const [rascunhoSalvo, setRascunhoSalvo] = useState<(RascunhoProcesso<ProcessoFormValues> & { salvoEm: number | null }) | null>(
    null,
  )
  const [conflitoRascunho, setConflitoRascunho] = useState(false)
  const [prontoParaAutoSalvar, setProntoParaAutoSalvar] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const formulario = useForm<ProcessoFormValues>({
    resolver: zodResolver(processoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: valoresVazios(),
  })
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    getValues,
    setValue,
    trigger,
    formState: { errors },
  } = formulario

  const { fields, append, remove } = useFieldArray({ control, name: 'amostras' })

  const valores = watch()

  function aplicarVinculoDaUrl() {
    if (!ocorrenciaDaUrl) return
    setValue('vinculoDecisao', 'vinculado')
    setValue('ocorrenciaId', ocorrenciaDaUrl.id)
    setValue('ocorrenciaResumo', ocorrenciaDaUrl)
    setVinculoTravado(true)
  }

  useEffect(() => {
    let cancelado = false
    carregarRascunhoProcesso<ProcessoFormValues>(chaveRascunho).then((salvo) => {
      if (cancelado) return
      if (salvo) {
        const divergem =
          ocorrenciaDaUrl != null && salvo.valores.ocorrenciaId != null && salvo.valores.ocorrenciaId !== ocorrenciaDaUrl.id
        setRascunhoSalvo(salvo)
        setConflitoRascunho(divergem)
      } else {
        aplicarVinculoDaUrl()
      }
      setProntoParaAutoSalvar(true)
    })
    return () => {
      cancelado = true
    }
    // Só verifica o rascunho salvo uma vez, ao montar o formulário.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // A assinatura só é criada depois que a checagem inicial de rascunho
    // termina, senão um callback com closure obsoleto pode sobrescrever um
    // rascunho real (mesmo gate de AnimalForm/OcorrenciaForm).
    // Refeita a cada troca de etapa: o callback grava a etapa em que o
    // usuário está, não a de quando a assinatura nasceu.
    if (!prontoParaAutoSalvar) return
    const inscricao = watch((valoresAtuais) => {
      agendarSalvarRascunhoProcesso(chaveRascunho, { etapaAtual: step, valores: valoresAtuais as ProcessoFormValues })
    })
    return () => inscricao.unsubscribe()
  }, [prontoParaAutoSalvar, watch, chaveRascunho, step])

  function handleRestaurarRascunho() {
    if (!rascunhoSalvo) return
    // Um rascunho com vínculo não serve a quem não pode vincular (D33).
    const valoresRestaurados =
      !podeVincular && rascunhoSalvo.valores.vinculoDecisao === 'vinculado'
        ? { ...rascunhoSalvo.valores, vinculoDecisao: '' as never, ocorrenciaId: null, ocorrenciaResumo: null }
        : rascunhoSalvo.valores
    reset(valoresRestaurados)
    setStep(valoresRestaurados.vinculoDecisao ? rascunhoSalvo.etapaAtual : 1)
    // Cast: um rascunho salvo antes de qualquer decisão na etapa 1 ainda
    // pode ter o placeholder "".
    setVinculoTravado((valoresRestaurados.vinculoDecisao as string) !== '')
    setRascunhoSalvo(null)
    setConflitoRascunho(false)
  }

  async function handleDescartarRascunho() {
    await removerRascunhoProcesso(chaveRascunho)
    setRascunhoSalvo(null)
    setConflitoRascunho(false)
    aplicarVinculoDaUrl()
  }

  function handleSelecionarOcorrencia(ocorrencia: OcorrenciaParaVinculo) {
    setValue('vinculoDecisao', 'vinculado', { shouldValidate: true })
    setValue('ocorrenciaId', ocorrencia.id, { shouldValidate: true })
    setValue('ocorrenciaResumo', ocorrencia)
  }

  function handlePularVinculo() {
    setValue('vinculoDecisao', 'sem_vinculo', { shouldValidate: true })
    setValue('ocorrenciaId', null, { shouldValidate: true })
    setValue('ocorrenciaResumo', null)
  }

  async function avancar() {
    const campos = CAMPOS_STEP[step]
    const valido = campos.length === 0 ? true : await trigger(campos)
    if (!valido) return
    const proximo = (step + 1) as 2 | 3 | 4
    setStep(proximo)
    if (step === 1) setVinculoTravado(true)
    await salvarRascunhoProcesso(chaveRascunho, { etapaAtual: proximo, valores: getValues() })
  }

  function voltar(etapa?: 1 | 2 | 3) {
    setStep((atual) => etapa ?? (atual > 1 ? ((atual - 1) as 1 | 2 | 3) : atual))
  }

  async function onSubmit(dados: ProcessoFormValues) {
    try {
      const novo = await mutation.mutateAsync(paraRequisicao(dados))
      await removerRascunhoProcesso(chaveRascunho)
      navigate(`/processos/${novo.id}`)
    } catch (erro) {
      setSubmitError(mensagemDoErro(erro))
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  const amostrasErros = errors.amostras as unknown as (AmostraErros | undefined)[] | undefined
  const destinoVoltar = ocorrenciaDaUrl ? `/ocorrencias/${ocorrenciaDaUrl.id}` : '/processos'

  return (
    <div className="wizard-shell">
      <div className="page-header">
        <div className="title-block">
          <Link to={destinoVoltar} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
            ← Voltar
          </Link>
          <h1>Novo Processo Sanitário</h1>
          <p className="subtitle">Protocolo será gerado automaticamente ao registrar.</p>
        </div>
      </div>

      <Stepper etapas={['Vínculo', 'Responsável', 'Amostras', 'Revisão']} atual={step} />

      {erroCatalogos && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar doenças, laboratórios e sintomas. Recarregue a página.</div>
        </div>
      )}

      {conflitoRascunho && (
        <div className="alert warning" role="alert">
          <span className="bullet" />
          <div className="alert-content">
            Há um rascunho salvo com um vínculo de ocorrência diferente do que você está abrindo agora.
            <div className="flex gap-2" style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-sm btn-primary" onClick={handleRestaurarRascunho}>
                Usar rascunho salvo
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={handleDescartarRascunho}>
                Descartar e usar este vínculo
              </button>
            </div>
          </div>
        </div>
      )}

      {rascunhoSalvo && !conflitoRascunho && (
        <BannerRascunho
          onRestaurar={handleRestaurarRascunho}
          onDescartar={() => void handleDescartarRascunho()}
          salvoEm={rascunhoSalvo.salvoEm}
        />
      )}

      {submitError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">{submitError}</div>
        </div>
      )}

      <FormProvider {...formulario}>
        <form onSubmit={aoEnviar} noValidate>
          <div className={`card step-pane${step === 1 ? ' active' : ''}`}>
            <div className="card-header">
              <h3>1. Dados e vínculo com ocorrência</h3>
            </div>
            <div className="card-body col gap-4">
              {podeVincular || vinculoTravado ? (
                <SeletorOcorrencia
                  vinculoDecisao={valores.vinculoDecisao}
                  ocorrenciaId={valores.ocorrenciaId}
                  travado={vinculoTravado}
                  ocorrenciaVinculada={valores.ocorrenciaResumo}
                  erro={errors.vinculoDecisao?.message}
                  onSelecionar={handleSelecionarOcorrencia}
                  onPular={handlePularVinculo}
                />
              ) : (
                <div>
                  <p className="hint" style={{ marginBottom: 12 }}>
                    Vincular o processo a uma ocorrência exige permissão de escrita em ocorrências e denúncias. Este processo
                    será registrado sem vínculo; quem tem a permissão pode vinculá-lo depois, pelo detalhe.
                  </p>
                  <button type="button" className="btn btn-outline" onClick={handlePularVinculo}>
                    Continuar sem vínculo
                  </button>
                  {valores.vinculoDecisao === 'sem_vinculo' && <span className="hint"> Sem vínculo.</span>}
                  {errors.vinculoDecisao && <span className="err">{errors.vinculoDecisao.message}</span>}
                </div>
              )}
              <CamposDadosProcesso />
              <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
                <button type="button" className="btn btn-primary" onClick={avancar}>
                  Continuar →
                </button>
              </div>
            </div>
          </div>

          <div className={`card step-pane${step === 2 ? ' active' : ''}`}>
            <div className="card-header">
              <h3>2. Responsável / munícipe</h3>
            </div>
            <div className="card-body col gap-4">
              <CamposResponsavel />
              <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
                <button type="button" className="btn btn-ghost" onClick={() => voltar()}>
                  ← Voltar
                </button>
                <button type="button" className="btn btn-primary" onClick={avancar}>
                  Continuar →
                </button>
              </div>
            </div>
          </div>

          <div className={`card step-pane${step === 3 ? ' active' : ''}`}>
            <div className="card-header">
              <h3>3. Amostras, sintomas e contato humano ({fields.length})</h3>
            </div>
            <div className="card-body col gap-4">
              {fields.map((field, indice) => (
                <AmostraAnimalCard
                  key={field.id}
                  index={indice}
                  numero={indice + 1}
                  control={control}
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  erros={amostrasErros?.[indice] as AmostraErros | undefined}
                  podeRemover={fields.length > 1}
                  onRemover={() => remove(indice)}
                />
              ))}
              {typeof errors.amostras?.message === 'string' && <span className="err">{errors.amostras.message}</span>}
              <button type="button" className="btn btn-outline" style={{ width: 'fit-content' }} onClick={() => append(amostraVazia())}>
                + Adicionar animal
              </button>
              <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
                <button type="button" className="btn btn-ghost" onClick={() => voltar()}>
                  ← Voltar
                </button>
                <button type="button" className="btn btn-primary" onClick={avancar}>
                  Continuar →
                </button>
              </div>
            </div>
          </div>

          <div className={`card step-pane${step === 4 ? ' active' : ''}`}>
            <div className="card-header">
              <h3>4. Revisão</h3>
            </div>
            <div className="card-body col gap-4">
              <RevisaoProcesso valores={valores} catalogos={catalogos} onEditar={voltar} />
              <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
                <button type="button" className="btn btn-ghost" onClick={() => voltar(3)}>
                  ← Voltar
                </button>
                <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Registrando…' : 'Registrar Processo Sanitário'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
      <p className="hint">Registrado por {user?.nome} {user?.sobrenome}.</p>
    </div>
  )
}
