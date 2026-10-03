import { zodResolver } from '@hookform/resolvers/zod'
import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/AuthContext'
import { useOcorrenciaQuery } from '@/features/ocorrencias/hooks/useOcorrencias'
import { ErroNegocioProcesso } from '../api/processosApi'
import { AmostraAnimalCard, type AmostraErros } from './AmostraAnimalCard'
import './ProcessoForm.css'
import { CAMPOS_STEP, processoFormSchema, type ProcessoFormValues } from '../schemas/processoFormSchema'
import { DOENCA_OPCOES, LABORATORIO_OPCOES } from '../utils/processosCatalogos'
import type { AmostraAnimal, CriarProcessoRequest, OcorrenciaParaVinculo } from '../types/processos.types'
import {
  agendarSalvarRascunhoProcesso,
  carregarRascunhoProcesso,
  removerRascunhoProcesso,
  salvarRascunhoProcesso,
  type RascunhoProcesso,
} from '../storage/rascunhoProcessoStorage'
import { RevisaoProcesso } from './RevisaoProcesso'
import { SeletorOcorrencia } from './SeletorOcorrencia'
import { useCriarProcessoMutation } from '../hooks/useProcessos'

const FUSO_ITU = 'America/Sao_Paulo'

function hojeIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO_ITU }).format(new Date())
}

function amostraVazia(): ProcessoFormValues['amostras'][number] {
  return {
    origem: 'canil',
    animalId: '',
    especieId: '',
    sexo: '' as never,
    raca: '',
    coloracao: '',
    pelagem: '',
    idadeAprox: '',
    pesoKg: undefined,
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
    dataAbertura: hojeIso(),
    doenca: '' as never,
    laboratorio: '' as never,
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

// Monta o payload real a partir dos valores do form. Whitelist explícita por
// `origem`: independente do que sobrou no estado interno do RHF de uma troca
// de modo anterior, o payload NUNCA carrega `animalId` para uma amostra
// "externo" nem inventa campos fora do que cada variante da união prevê.
function paraAmostraRequisicao(amostra: ProcessoFormValues['amostras'][number]): AmostraAnimal {
  const identificacao = {
    sexo: amostra.sexo,
    raca: amostra.raca || undefined,
    coloracao: amostra.coloracao || undefined,
    pelagem: amostra.pelagem || undefined,
    idadeAprox: amostra.idadeAprox || undefined,
    pesoKg: amostra.pesoKg,
  }
  const clinico = {
    statusClinico: amostra.statusClinico,
    tipoAbrigo: amostra.tipoAbrigo,
    alteracaoComportamental: amostra.alteracaoComportamental || undefined,
    dataColeta: amostra.dataColeta,
    materialBiologico: amostra.materialBiologico,
    contatoHumano: amostra.contatoHumano,
    nivelContato: amostra.contatoHumano ? amostra.nivelContato : undefined,
    agrediuHumano: amostra.contatoHumano ? amostra.agrediuHumano : undefined,
    observacoes: amostra.observacoes || undefined,
    sintomas: amostra.sintomas,
  }
  if (amostra.origem === 'canil') {
    return { origem: 'canil', animalId: amostra.animalId, especieId: amostra.especieId, ...identificacao, ...clinico }
  }
  return { origem: 'externo', especieId: amostra.especieId, ...identificacao, ...clinico }
}

function paraRequisicao(valores: ProcessoFormValues): CriarProcessoRequest {
  return {
    dataAbertura: valores.dataAbertura,
    doenca: valores.doenca,
    laboratorio: valores.laboratorio,
    ocorrenciaId: valores.vinculoDecisao === 'vinculado' ? valores.ocorrenciaId : null,
    responsavel: {
      nome: valores.responsavel.nome,
      cpf: valores.responsavel.cpf || undefined,
      telefone: valores.responsavel.telefone || undefined,
      email: valores.responsavel.email || undefined,
      cep: valores.responsavel.cep || undefined,
      endereco: valores.responsavel.endereco || undefined,
      bairroResidencial: valores.responsavel.bairroResidencial || undefined,
      bairroOcorrencia: valores.responsavel.bairroOcorrencia || undefined,
    },
    amostras: valores.amostras.map(paraAmostraRequisicao),
    observacoes: valores.observacoes || undefined,
  }
}

interface ProcessoFormProps {
  ocorrenciaIdDaUrl: string | null
}

export function ProcessoForm({ ocorrenciaIdDaUrl }: ProcessoFormProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const mutation = useCriarProcessoMutation()

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

  // A resumo da ocorrência vinculada é derivada da própria query — nunca
  // guardada em state próprio — para que ela reapareça sozinha depois de
  // restaurar um rascunho ou de uma entrada via `?ocorrencia=<id>`, sem
  // duplicar o dado nem arriscar ficar desatualizada. O mascaramento de
  // sigilo (RN3) já vem pronto de useOcorrenciaQuery (mesmo hook usado no
  // detalhe da ocorrência).
  const { data: ocorrenciaEncontrada } = useOcorrenciaQuery(valores.ocorrenciaId ?? undefined)
  const ocorrenciaVinculada: OcorrenciaParaVinculo | null =
    valores.vinculoDecisao === 'vinculado' && ocorrenciaEncontrada
      ? {
          id: ocorrenciaEncontrada.id,
          protocolo: ocorrenciaEncontrada.protocolo,
          tipoOcorrencia: ocorrenciaEncontrada.tipoOcorrencia,
          bairro: ocorrenciaEncontrada.bairro,
          statusOcorrencia: ocorrenciaEncontrada.statusOcorrencia,
          sigilosa: ocorrenciaEncontrada.sigilosa,
          denunciante: ocorrenciaEncontrada.denunciante ? { nome: ocorrenciaEncontrada.denunciante.nome } : null,
        }
      : null

  useEffect(() => {
    let cancelado = false
    carregarRascunhoProcesso<ProcessoFormValues>().then((salvo) => {
      if (cancelado) return
      if (salvo) {
        const divergem = ocorrenciaIdDaUrl != null && salvo.valores.ocorrenciaId != null && salvo.valores.ocorrenciaId !== ocorrenciaIdDaUrl
        setRascunhoSalvo(salvo)
        setConflitoRascunho(divergem)
      } else if (ocorrenciaIdDaUrl) {
        setValue('vinculoDecisao', 'vinculado')
        setValue('ocorrenciaId', ocorrenciaIdDaUrl)
        setVinculoTravado(true)
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
    // Mesmo gate de AnimalForm.tsx/OcorrenciaForm.tsx: a assinatura só é
    // criada depois que a checagem inicial de rascunho termina, senão um
    // callback com closure obsoleto pode sobrescrever um rascunho real.
    if (!prontoParaAutoSalvar) return
    const inscricao = watch((valoresAtuais) => {
      agendarSalvarRascunhoProcesso({ etapaAtual: step, valores: valoresAtuais as ProcessoFormValues })
    })
    return () => inscricao.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prontoParaAutoSalvar, watch])

  function handleRestaurarRascunho() {
    if (!rascunhoSalvo) return
    reset(rascunhoSalvo.valores)
    setStep(rascunhoSalvo.etapaAtual)
    // Cast: em runtime um rascunho salvo antes de qualquer decisão na etapa 1
    // ainda pode ter o placeholder "" (mesmo o tipo, como os demais campos
    // enum do form, "mentindo" que isso nunca acontece — ver amostraVazia()).
    setVinculoTravado((rascunhoSalvo.valores.vinculoDecisao as string) !== '')
    setRascunhoSalvo(null)
    setConflitoRascunho(false)
  }

  async function handleDescartarRascunho() {
    await removerRascunhoProcesso()
    setRascunhoSalvo(null)
    setConflitoRascunho(false)
    if (ocorrenciaIdDaUrl) {
      setValue('vinculoDecisao', 'vinculado')
      setValue('ocorrenciaId', ocorrenciaIdDaUrl)
      setVinculoTravado(true)
    }
  }

  function handleSelecionarOcorrencia(ocorrencia: OcorrenciaParaVinculo) {
    setValue('vinculoDecisao', 'vinculado', { shouldValidate: true })
    setValue('ocorrenciaId', ocorrencia.id, { shouldValidate: true })
  }

  function handlePularVinculo() {
    setValue('vinculoDecisao', 'sem_vinculo', { shouldValidate: true })
    setValue('ocorrenciaId', null, { shouldValidate: true })
  }

  async function avancar() {
    const campos = CAMPOS_STEP[step]
    const valido = campos.length === 0 ? true : await trigger(campos)
    if (!valido) return
    const proximo = (step + 1) as 2 | 3 | 4
    setStep(proximo)
    if (step === 1) setVinculoTravado(true)
    await salvarRascunhoProcesso({ etapaAtual: proximo, valores: getValues() })
  }

  function voltar(etapa?: 1 | 2 | 3) {
    setStep((atual) => etapa ?? (atual > 1 ? ((atual - 1) as 1 | 2 | 3) : atual))
  }

  async function onSubmit(dados: ProcessoFormValues) {
    try {
      const novo = await mutation.mutateAsync(paraRequisicao(dados))
      await removerRascunhoProcesso()
      // T33 introduziu o detalhe do processo — o destino pós-submit deixa de
      // bifurcar entre /ocorrencias e /ocorrencias/:id (provisório da T32) e
      // passa a ser sempre o processo recém-criado.
      navigate(`/processos/${novo.id}`)
    } catch (erro) {
      setSubmitError(erro instanceof ErroNegocioProcesso ? erro.message : 'Não foi possível registrar o processo. Tente novamente.')
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  const amostrasErros = errors.amostras as unknown as (AmostraErros | undefined)[] | undefined

  return (
    <div className="wizard-shell">
      <div className="page-header">
        <div className="title-block">
          <Link to="/ocorrencias" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
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
            <SeletorOcorrencia
              vinculoDecisao={valores.vinculoDecisao}
              ocorrenciaId={valores.ocorrenciaId}
              travado={vinculoTravado}
              ocorrenciaVinculada={ocorrenciaVinculada}
              erro={errors.vinculoDecisao?.message}
              onSelecionar={handleSelecionarOcorrencia}
              onPular={handlePularVinculo}
            />
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
                <select id="proc-doenca" className={`select${errors.doenca ? ' error' : ''}`} defaultValue="" {...register('doenca')}>
                  <option value="" disabled>
                    Selecione
                  </option>
                  {DOENCA_OPCOES.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
                {errors.doenca && <span className="err">{errors.doenca.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="proc-laboratorio">
                  Laboratório de destino <span className="req">*</span>
                </label>
                <select
                  id="proc-laboratorio"
                  className={`select${errors.laboratorio ? ' error' : ''}`}
                  defaultValue=""
                  {...register('laboratorio')}
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {LABORATORIO_OPCOES.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
                {errors.laboratorio && <span className="err">{errors.laboratorio.message}</span>}
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
              </div>
              <div className="field">
                <label htmlFor="resp-email">E-mail</label>
                <input id="resp-email" className="input" type="email" {...register('responsavel.email')} />
              </div>
              <div className="field">
                <label htmlFor="resp-cep">CEP</label>
                <input id="resp-cep" className="input mono" type="text" placeholder="00000-000" {...register('responsavel.cep')} />
              </div>
              <div className="field full">
                <label htmlFor="resp-endereco">Endereço</label>
                <input id="resp-endereco" className="input" type="text" {...register('responsavel.endereco')} />
              </div>
              <div className="field">
                <label htmlFor="resp-bairro-res">Bairro residencial</label>
                <input id="resp-bairro-res" className="input" type="text" {...register('responsavel.bairroResidencial')} />
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
            <RevisaoProcesso valores={valores} ocorrenciaVinculada={ocorrenciaVinculada} onEditar={voltar} />
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
