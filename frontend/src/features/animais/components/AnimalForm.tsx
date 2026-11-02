import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, type FieldErrors as RhfFieldErrors } from 'react-hook-form'
import { AlertaErroEnvio } from '@/components/AlertaErroEnvio'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { toast } from '@/components/toast/toast'
import { aplicarErrosDeCampo, mapaDeCampos, mensagemDeRegraDaApi } from '@/lib/erroApi'
import type { Animal } from '../types/animais.types'
import { animalFormUiSchema, type AnimalFormUiValues } from '../schemas/animalFormSchema'
import { ImagemInvalidaError, blobParaDataUri, comprimirImagem, dataUriParaBlob } from '../utils/comprimirImagem'
import {
  paraAnimalRequest,
  rascunhoParaValores,
  valoresDeAnimal,
  valoresParaRascunho,
  valoresVazios,
  type RascunhoAnimalValores,
} from '../utils/animalFormMapeamento'
import {
  agendarSalvarRascunhoAnimal,
  cancelarSalvamentoRascunhoAnimal,
  carregarRascunhoAnimal,
  chaveRascunhoAnimal,
  removerRascunhoAnimal,
  salvarRascunhoAnimal,
} from '../storage/rascunhoAnimalStorage'
import { AvisoEnvioPausado } from '@/components/AvisoEnvioPausado'
import { BannerRascunho } from '@/components/BannerRascunho'
import { Stepper } from '@/components/Stepper'
import {
  carregarArquivoRascunho,
  removerArquivosDoRascunho,
  salvarArquivoRascunho,
  type ArmazenamentoRascunho,
  type DonoArquivoRascunho,
} from '@/lib/rascunhoDb'
import { useRascunho } from '@/lib/useRascunho'
import { useAtualizarAnimalMutation, useCriarAnimalMutation } from '../hooks/useAnimais'
import { CamposDadosBasicos } from './CamposDadosBasicos'
import { CamposSaudeBaia } from './CamposSaudeBaia'
import { RevisaoAnimal } from './RevisaoAnimal'
import { UploadFotoAnimal } from './UploadFotoAnimal'

interface AnimalFormProps {
  animal?: Animal
}

const CAMPOS_STEP: Record<1 | 2 | 3, (keyof AnimalFormUiValues)[]> = {
  1: ['nome', 'especie', 'sexo', 'raca', 'coloracao', 'pelagem', 'porte', 'pesoKg', 'idadeAprox', 'dataNascimentoAprox', 'microchip', 'numeroMedalha', 'dataImplantacaoChip'],
  2: [
    'status',
    'motivoEntrada',
    'dataEntrada',
    'baiaId',
    'dataEsterilizacao',
    'procedencia',
    'laudoEutanasia',
    'tipoDestinoTransferencia',
    'destinoTransferencia',
    'dataSaida',
    'documentoTransferencia',
    'condicoes',
    'condicoesOutras',
  ],
  3: [],
}

const ETAPAS = ['Dados Básicos', 'Saúde & Baia', 'Foto & Revisão'] as const

const CAMPOS_COM_ERRO = new Set<string>([...CAMPOS_STEP[1], ...CAMPOS_STEP[2]])

const MAPA_ERROS_SERVIDOR: Record<string, keyof AnimalFormUiValues> = {
  ...mapaDeCampos<AnimalFormUiValues>([...CAMPOS_STEP[1], ...CAMPOS_STEP[2], 'observacoes']),
  esterilizado: 'castracaoOpcao',
  transferencia: 'tipoDestinoTransferencia',
  'transferencia.tipoDestino': 'tipoDestinoTransferencia',
  'transferencia.destino': 'destinoTransferencia',
  'transferencia.dataSaida': 'dataSaida',
  'transferencia.documento': 'documentoTransferencia',
}

const ARMAZENAMENTO_RASCUNHO_ANIMAL: ArmazenamentoRascunho<RascunhoAnimalValores> = {
  carregar: (chave) => carregarRascunhoAnimal<RascunhoAnimalValores>(chave),
  agendarSalvar: (chave, valores) => agendarSalvarRascunhoAnimal(chave, valores),
  salvar: (chave, valores) => salvarRascunhoAnimal(chave, valores),
  remover: (chave) => removerRascunhoAnimal(chave),
  cancelarAgendado: (chave) => cancelarSalvamentoRascunhoAnimal(chave),
}

export function AnimalForm({ animal }: AnimalFormProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const chaveRascunho = chaveRascunhoAnimal(user?.id ?? '', animal?.id)
  const iniciais = animal ? valoresDeAnimal(animal) : valoresVazios()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fotoErro, setFotoErro] = useState<string | null>(null)
  const [fotoAviso, setFotoAviso] = useState<string | null>(null)
  const [fotoCarregando, setFotoCarregando] = useState(false)
  const [rascunhoMensagem, setRascunhoMensagem] = useState<string | null>(null)

  const fotoArquivoId = useRef<string | null>(null)
  const donoDosArquivos: DonoArquivoRascunho = { store: 'animais', chave: chaveRascunho }

  const criarMutation = useCriarAnimalMutation()
  const atualizarMutation = useAtualizarAnimalMutation()
  const salvando = criarMutation.isPending || atualizarMutation.isPending
  const envioPausado = criarMutation.isPaused || atualizarMutation.isPaused
  const destinoVoltar = animal ? `/animais/${animal.id}` : '/animais'

  const formulario = useForm<AnimalFormUiValues>({
    resolver: zodResolver(animalFormUiSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: rascunhoParaValores(iniciais, iniciais.fotoUrl),
  })
  const { handleSubmit, watch, setValue, setError, getValues, reset, trigger } = formulario
  const fotoUrl = watch('fotoUrl')

  const rascunho = useRascunho<AnimalFormUiValues, RascunhoAnimalValores>({
    armazenamento: ARMAZENAMENTO_RASCUNHO_ANIMAL,
    chave: chaveRascunho,
    watch,
    reset,
    getValues,
    paraRascunho: (valoresAtuais) => valoresParaRascunho(valoresAtuais, fotoArquivoId.current),
    deRascunho: (salvo) => rascunhoParaValores(salvo, getValues('fotoUrl')),
  })

  useEffect(() => {
    if (!rascunhoMensagem) return
    const timer = setTimeout(() => setRascunhoMensagem(null), 3000)
    return () => clearTimeout(timer)
  }, [rascunhoMensagem])

  async function handleSalvarRascunhoAgora() {
    await rascunho.salvarAgora()
    setRascunhoMensagem('Rascunho salvo.')
  }

  async function handleRestaurarRascunho() {
    const id = rascunho.rascunhoDisponivel?.fotoArquivoId ?? null
    rascunho.restaurar()
    if (!id) return
    fotoArquivoId.current = id
    const blob = await carregarArquivoRascunho(user?.id ?? '', id)
    if (blob) setValue('fotoUrl', await blobParaDataUri(blob))
  }

  async function handleDescartarRascunho() {
    await rascunho.descartar()
    fotoArquivoId.current = null
    await removerArquivosDoRascunho(donoDosArquivos)
  }

  async function handleArquivoFoto(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    event.target.value = ''
    if (!arquivo) return

    setFotoErro(null)
    setFotoAviso(null)
    setFotoCarregando(true)
    try {
      const dataUri = await comprimirImagem(arquivo)
      setValue('fotoUrl', dataUri)
      await guardarFotoNoRascunho(dataUri)
    } catch (erro) {
      setFotoErro(erro instanceof ImagemInvalidaError ? erro.message : 'Não foi possível processar a imagem.')
    } finally {
      setFotoCarregando(false)
    }
  }

  async function guardarFotoNoRascunho(dataUri: string) {
    const blob = dataUriParaBlob(dataUri)
    if (!blob) return
    await removerArquivosDoRascunho(donoDosArquivos)
    const referencia = await salvarArquivoRascunho(
      user?.id ?? '',
      donoDosArquivos,
      new File([blob], 'foto.jpg', { type: blob.type }),
    )
    fotoArquivoId.current = referencia?.id ?? null
    await rascunho.salvarAgora()
    if (!referencia) setFotoAviso('A foto não ficou salva no rascunho, mas continua no formulário.')
  }

  function tratarErroSubmit(erro: unknown) {
    const regra = mensagemDeRegraDaApi(erro)
    if (regra?.toLowerCase().includes('icrochip')) {
      setError('microchip', { message: regra })
      setStep(1)
      return
    }

    const campos = aplicarErrosDeCampo(erro, setError, MAPA_ERROS_SERVIDOR)
    if (campos.length > 0) {
      setStep((CAMPOS_STEP[1] as string[]).includes(campos[0]) ? 1 : 2)
      return
    }
    setSubmitError(regra ?? 'Não foi possível salvar o animal. Tente novamente.')
  }

  async function onSubmit(dados: AnimalFormUiValues) {
    const payload = paraAnimalRequest(dados, animal?.dataEntrada, animal)
    try {
      let idSalvo: string
      if (animal) {
        await atualizarMutation.mutateAsync({ id: animal.id, payload })
        idSalvo = animal.id
      } else {
        idSalvo = (await criarMutation.mutateAsync(payload)).id
      }
      await rascunho.removerAposSucesso()
      await removerArquivosDoRascunho(donoDosArquivos)
      toast.sucesso(animal ? 'Alterações salvas.' : `${dados.nome} cadastrado(a).`)
      navigate(`/animais/${idSalvo}`)
    } catch (erro) {
      tratarErroSubmit(erro)
    }
  }

  function onInvalid(errosValidacao: RhfFieldErrors<AnimalFormUiValues>) {
    const primeiroErro = (Object.keys(errosValidacao) as (keyof AnimalFormUiValues)[]).find((campo) =>
      CAMPOS_COM_ERRO.has(campo),
    )
    if (primeiroErro && CAMPOS_STEP[1].includes(primeiroErro)) setStep(1)
    else if (primeiroErro && CAMPOS_STEP[2].includes(primeiroErro)) setStep(2)
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit, onInvalid)(event)
  }

  async function avancarDaEtapa(atual: 1 | 2) {
    if (await trigger(CAMPOS_STEP[atual])) setStep((atual + 1) as 2 | 3)
  }

  return (
    <div className="wizard-shell">
      <div className="page-header">
        <div className="title-block">
          <Link to={destinoVoltar} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
            {animal ? '← Voltar para a ficha' : '← Voltar para Animais'}
          </Link>
          <h1>{animal ? `Editar ${animal.nome}` : 'Cadastrar Novo Animal'}</h1>
          <p className="subtitle">
            {animal ? 'Altere o que precisar e salve de qualquer etapa.' : 'Preencha as informações em 3 etapas. Você poderá editar depois.'}
          </p>
        </div>
      </div>

      {rascunho.rascunhoDisponivel && (
        <BannerRascunho
          onRestaurar={() => void handleRestaurarRascunho()}
          onDescartar={() => void handleDescartarRascunho()}
          salvoEm={rascunho.rascunhoSalvoEm}
        />
      )}

      <Stepper etapas={ETAPAS} atual={step} onIrPara={animal ? (numero) => setStep(numero as 1 | 2 | 3) : undefined} />

      <FormProvider {...formulario}>
        <form onSubmit={aoEnviar} noValidate>
          <AlertaErroEnvio mensagem={submitError} />

          <div className={`card step-pane${step === 1 ? ' active' : ''}`}>
            <div className="card-header">
              <h3>Dados Básicos</h3>
              <span className="sub">
                Campos com <span style={{ color: 'var(--color-danger)' }}>*</span> são obrigatórios
              </span>
            </div>
            <div className="card-body">
              <CamposDadosBasicos microchipTravado={Boolean(animal?.microchip)} />
            </div>
            <div
              className="card-header"
              style={{ borderTop: '1px solid var(--color-border)', borderBottom: 'none', justifyContent: 'flex-end' }}
            >
              <Link to={destinoVoltar} className="btn btn-ghost">
                Cancelar
              </Link>
              {animal && (
                <button type="submit" className="btn btn-outline" disabled={salvando}>
                  Salvar alterações
                </button>
              )}
              <button type="button" className="btn btn-primary" onClick={() => void avancarDaEtapa(1)}>
                Próximo: Saúde &amp; Baia →
              </button>
            </div>
          </div>

          <div className={`card step-pane${step === 2 ? ' active' : ''}`}>
            <div className="card-header">
              <h3>Saúde &amp; Baia</h3>
            </div>
            <div className="card-body">
              <CamposSaudeBaia baiaAtualId={iniciais.baiaId} transferenciaRegistrada={animal} />
            </div>
            <div
              className="card-header"
              style={{ borderTop: '1px solid var(--color-border)', borderBottom: 'none', justifyContent: 'space-between' }}
            >
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                ← Anterior
              </button>
              <div className="flex gap-2">
                {animal && (
                  <button type="submit" className="btn btn-outline" disabled={salvando}>
                    Salvar alterações
                  </button>
                )}
                <button type="button" className="btn btn-primary" onClick={() => void avancarDaEtapa(2)}>
                  Próximo: Foto &amp; Revisão →
                </button>
              </div>
            </div>
          </div>

          <div className={`card step-pane${step === 3 ? ' active' : ''}`}>
            <div className="card-header">
              <h3>Foto &amp; Revisão</h3>
            </div>
            <div className="card-body">
              <UploadFotoAnimal
                fotoUrl={fotoUrl}
                carregando={fotoCarregando}
                erro={fotoErro}
                aviso={fotoAviso}
                onArquivo={(event) => void handleArquivoFoto(event)}
              />
              <RevisaoAnimal />
            </div>
            <div
              className="card-header"
              style={{ borderTop: '1px solid var(--color-border)', borderBottom: 'none', justifyContent: 'space-between' }}
            >
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
                ← Anterior
              </button>
              <div className="flex gap-2" style={{ alignItems: 'center' }}>
                {rascunhoMensagem && <span className="hint">{rascunhoMensagem}</span>}
                <AvisoEnvioPausado pausado={envioPausado} />
                <button type="button" className="btn btn-outline" onClick={() => void handleSalvarRascunhoAgora()}>
                  Salvar como rascunho
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={salvando}>
                  {envioPausado ? 'Aguardando conexão…' : salvando ? 'Salvando…' : animal ? 'Salvar alterações' : 'Cadastrar animal'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
