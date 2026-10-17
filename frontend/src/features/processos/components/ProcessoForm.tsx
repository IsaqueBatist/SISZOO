import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'
import { AmostraAnimalCard, type AmostraErros } from './AmostraAnimalCard'
import './ProcessoForm.css'
import { CAMPOS_STEP, hojeIso, processoFormSchema, type ProcessoFormValues } from '../schemas/processoFormSchema'
import type { AmostraAnimalRequest, CriarProcessoRequest } from '../types/processos.types'
import {
  agendarSalvarRascunhoProcesso,
  carregarRascunhoProcesso,
  chaveRascunhoProcesso,
  removerRascunhoProcesso,
  salvarRascunhoProcesso,
  type RascunhoProcesso,
} from '../storage/rascunhoProcessoStorage'
import { RevisaoProcesso } from './RevisaoProcesso'
import { SeletorOcorrencia, type OcorrenciaParaVinculo } from './SeletorOcorrencia'
import { useCatalogosProcessoQuery, useCriarProcessoMutation } from '../hooks/useProcessos'

function amostraVazia(): ProcessoFormValues['amostras'][number] {
  return {
    origem: 'canil',
    animalId: '',
    animalDescricao: '',
    statusClinico: '' as never,
    tipoAbrigo: '' as never,
    alteracaoComportamental: '',
    dataColeta: hojeIso(),
    materialBiologico: '' as never,
    contatoHumano: false,
    nivelContato: undefined,
    agrediuHumano: undefined,
    observacoes: '',
    sintomas: [],
  }
}

function valoresVazios(): ProcessoFormValues {
  return {
    vinculoDecisao: '' as never,
    ocorrenciaId: null,
    ocorrenciaResumo: null,
    dataAbertura: hojeIso(),
    doenca: '',
    laboratorio: '',
    responsavel: {
      nome: '',
      cpf: '',
      telefone: '',
      email: '',
      cep: '',
      endereco: '',
      bairroResidencial: '',
      bairroOcorrencia: '',
    },
    amostras: [amostraVazia()],
    observacoes: '',
  }
}

function textoOuIndefinido(valor: string | undefined): string | undefined {
  const limpo = valor?.trim()
  return limpo ? limpo : undefined
}

// Payload de POST /api/processos. Whitelist por modalidade: a amostra do
// canil leva só o animalId (o servidor copia a identificação da ficha e
// recusa com 422 se ela vier junto, DH-5); a de campo leva a identificação.
// Nível de contato e agressão só com contato; sintomas só em SINTOMATICO.
function paraAmostraRequisicao(amostra: ProcessoFormValues['amostras'][number]): AmostraAnimalRequest {
  const clinico = {
    statusClinico: amostra.statusClinico,
    tipoAbrigo: amostra.tipoAbrigo,
    alteracaoComportamental: textoOuIndefinido(amostra.alteracaoComportamental),
    dataColeta: amostra.dataColeta,
    materialBiologico: amostra.materialBiologico,
    contatoHumano: amostra.contatoHumano,
    nivelContato: amostra.contatoHumano ? amostra.nivelContato : undefined,
    agrediuHumano: amostra.contatoHumano ? amostra.agrediuHumano : undefined,
    observacoes: textoOuIndefinido(amostra.observacoes),
    sintomas: amostra.statusClinico === 'SINTOMATICO' ? amostra.sintomas : [],
  }
  if (amostra.origem === 'canil') {
    return { animalId: amostra.animalId, ...clinico }
  }
  return {
    especie: amostra.especie,
    sexo: amostra.sexo,
    raca: textoOuIndefinido(amostra.raca),
    coloracao: textoOuIndefinido(amostra.coloracao),
    pelagem: amostra.pelagem || undefined,
    idadeAprox: textoOuIndefinido(amostra.idadeAprox),
    pesoKg: amostra.pesoKg,
    ...clinico,
  }
}

function paraRequisicao(valores: ProcessoFormValues): CriarProcessoRequest {
  return {
    dataAbertura: valores.dataAbertura,
    doenca: valores.doenca,
    laboratorio: valores.laboratorio,
    ocorrenciaId: valores.vinculoDecisao === 'vinculado' ? valores.ocorrenciaId : null,
    responsavel: {
      nome: valores.responsavel.nome.trim(),
      cpf: textoOuIndefinido(valores.responsavel.cpf),
      telefone: textoOuIndefinido(valores.responsavel.telefone),
      email: textoOuIndefinido(valores.responsavel.email),
      cep: textoOuIndefinido(valores.responsavel.cep),
      endereco: textoOuIndefinido(valores.responsavel.endereco),
      bairroResidencial: textoOuIndefinido(valores.responsavel.bairroResidencial),
      bairroOcorrencia: textoOuIndefinido(valores.responsavel.bairroOcorrencia),
    },
    amostras: valores.amostras.map(paraAmostraRequisicao),
    observacoes: textoOuIndefinido(valores.observacoes),
  }
}

// Mensagem do servidor (409/422) com os campos recusados, quando vierem.
function mensagemDoErro(erro: unknown): string {
  if (statusHttpDoErro(erro) === 403) {
    return 'Você não tem permissão para registrar este processo (vincular a uma ocorrência exige escrita em ocorrências).'
  }
  const mensagem = mensagemDeRegraDaApi(erro)
  if (!mensagem) return 'Não foi possível registrar o processo. Tente novamente.'
  const campos = isAxiosError(erro)
    ? (erro.response?.data as { campos?: { campo: string; mensagem: string }[] } | undefined)?.campos
    : undefined
  return campos?.length ? `${mensagem}: ${campos.map((c) => `${c.campo} — ${c.mensagem}`).join('; ')}` : mensagem
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
  const [rascunhoSalvo, setRascunhoSalvo] = useState<RascunhoProcesso<ProcessoFormValues> | null>(null)
  const [conflitoRascunho, setConflitoRascunho] = useState(false)
  const [prontoParaAutoSalvar, setProntoParaAutoSalvar] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
  } = useForm<ProcessoFormValues>({
    resolver: zodResolver(processoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: valoresVazios(),
  })

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
    if (!prontoParaAutoSalvar) return
    const inscricao = watch((valoresAtuais) => {
      agendarSalvarRascunhoProcesso(chaveRascunho, { etapaAtual: step, valores: valoresAtuais as ProcessoFormValues })
    })
    return () => inscricao.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prontoParaAutoSalvar, watch])

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

      <div className="stepper">
        {(['Vínculo', 'Responsável', 'Amostras', 'Revisão'] as const).map((label, indice) => {
          const numero = (indice + 1) as 1 | 2 | 3 | 4
          return (
            <Fragment key={numero}>
              {indice > 0 && <div className={`arrow${step > numero ? ' done' : ''}`} />}
              <div className={`step${step === numero ? ' active' : step > numero ? ' done' : ''}`}>
                <span className="num">{numero}</span>
                <span>{label}</span>
              </div>
            </Fragment>
          )
        })}
      </div>

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
        <div className="alert info" role="alert">
          <span className="bullet" />
          <div className="alert-content">
            Encontramos um rascunho salvo deste formulário.
            <div className="flex gap-2" style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-sm btn-primary" onClick={handleRestaurarRascunho}>
                Restaurar rascunho
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={handleDescartarRascunho}>
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">{submitError}</div>
        </div>
      )}

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
            <div className="form-grid">
              <div className="field">
                <label htmlFor="proc-data-abertura">
                  Data de abertura <span className="req">*</span>
                </label>
                <input
                  id="proc-data-abertura"
                  className={`input${errors.dataAbertura ? ' error' : ''}`}
                  type="date"
                  {...register('dataAbertura')}
                />
                {errors.dataAbertura && <span className="err">{errors.dataAbertura.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="proc-doenca">
                  Tipo de doença investigada <span className="req">*</span>
                </label>
                <select id="proc-doenca" className={`select${errors.doenca ? ' error' : ''}`} {...register('doenca')}>
                  <option value="" disabled>
                    Selecione
                  </option>
                  {catalogos?.doencas.map((opcao) => (
                    <option key={opcao.codigo} value={opcao.codigo}>
                      {opcao.nome}
                    </option>
                  ))}
                </select>
                {errors.doenca && <span className="err">{errors.doenca.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="proc-laboratorio">
                  Laboratório de destino <span className="req">*</span>
                </label>
                <select id="proc-laboratorio" className={`select${errors.laboratorio ? ' error' : ''}`} {...register('laboratorio')}>
                  <option value="" disabled>
                    Selecione
                  </option>
                  {catalogos?.laboratorios.map((opcao) => (
                    <option key={opcao.codigo} value={opcao.codigo}>
                      {opcao.nome}
                    </option>
                  ))}
                </select>
                {errors.laboratorio && <span className="err">{errors.laboratorio.message}</span>}
              </div>
              <div className="field full">
                <label htmlFor="proc-observacoes">Observações</label>
                <textarea id="proc-observacoes" className="textarea" {...register('observacoes')} />
              </div>
            </div>
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
            <div className="form-grid">
              <div className="field">
                <label htmlFor="resp-nome">
                  Nome <span className="req">*</span>
                </label>
                <input
                  id="resp-nome"
                  className={`input${errors.responsavel?.nome ? ' error' : ''}`}
                  type="text"
                  {...register('responsavel.nome')}
                />
                {errors.responsavel?.nome && <span className="err">{errors.responsavel.nome.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="resp-cpf">CPF</label>
                <input id="resp-cpf" className="input mono" type="text" placeholder="000.000.000-00" {...register('responsavel.cpf')} />
                {errors.responsavel?.cpf && <span className="err">{errors.responsavel.cpf.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="resp-telefone">Telefone</label>
                <input
                  id="resp-telefone"
                  className="input mono"
                  type="text"
                  placeholder="(11) 9 0000-0000"
                  {...register('responsavel.telefone')}
                />
                {errors.responsavel?.telefone && <span className="err">{errors.responsavel.telefone.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="resp-email">E-mail</label>
                <input id="resp-email" className="input" type="email" {...register('responsavel.email')} />
                {errors.responsavel?.email && <span className="err">{errors.responsavel.email.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="resp-cep">CEP</label>
                <input id="resp-cep" className="input mono" type="text" placeholder="00000-000" {...register('responsavel.cep')} />
                {errors.responsavel?.cep && <span className="err">{errors.responsavel.cep.message}</span>}
              </div>
              <div className="field full">
                <label htmlFor="resp-endereco">Endereço</label>
                <input id="resp-endereco" className="input" type="text" {...register('responsavel.endereco')} />
                {errors.responsavel?.endereco && <span className="err">{errors.responsavel.endereco.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="resp-bairro-res">Bairro residencial</label>
                <input id="resp-bairro-res" className="input" type="text" {...register('responsavel.bairroResidencial')} />
                {errors.responsavel?.bairroResidencial && <span className="err">{errors.responsavel.bairroResidencial.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="resp-bairro-oco">Bairro da ocorrência</label>
                <input
                  id="resp-bairro-oco"
                  className="input"
                  type="text"
                  placeholder="Local onde o animal estava"
                  {...register('responsavel.bairroOcorrencia')}
                />
                {errors.responsavel?.bairroOcorrencia && <span className="err">{errors.responsavel.bairroOcorrencia.message}</span>}
              </div>
            </div>
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
      <p className="hint">Registrado por {user?.nome} {user?.sobrenome}.</p>
    </div>
  )
}
