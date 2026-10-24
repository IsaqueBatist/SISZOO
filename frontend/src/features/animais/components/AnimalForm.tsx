import { isAxiosError } from 'axios'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, type FieldErrors as RhfFieldErrors } from 'react-hook-form'
import { z } from 'zod'
import { Icon } from '@/components/layout/Icon'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatarDataBR, hojeEmItu } from '@/lib/datas'
import { aplicarErrosDeCampo, mapaDeCampos, mensagemDeRegraDaApi } from '@/lib/erroApi'
import type { Animal, AnimalRequest, CatalogoItem, Pelagem, Porte, Sexo } from '../types/animais.types'
import {
  CASTRACAO_OPCOES,
  PELAGEM_OPCOES,
  PORTE_OPCOES,
  SEXO_OPCOES,
  animalFormSchema,
  castracaoParaEsterilizado,
  esterilizadoParaCastracao,
  type CastracaoOpcao,
} from '../schemas/animalFormSchema'
import { ImagemInvalidaError, blobParaDataUri, comprimirImagem, dataUriParaBlob } from '../utils/comprimirImagem'
import {
  agendarSalvarRascunhoAnimal,
  cancelarSalvamentoRascunhoAnimal,
  carregarRascunhoAnimal,
  chaveRascunhoAnimal,
  removerRascunhoAnimal,
  salvarRascunhoAnimal,
} from '../storage/rascunhoAnimalStorage'
import { BannerRascunho } from '@/components/BannerRascunho'
import {
  carregarArquivoRascunho,
  removerArquivosDoRascunho,
  salvarArquivoRascunho,
  type ArmazenamentoRascunho,
  type DonoArquivoRascunho,
} from '@/lib/rascunhoDb'
import { useRascunho } from '@/lib/useRascunho'
import { useAtualizarAnimalMutation, useBaiasAtivasQuery, useCatalogosAnimaisQuery, useCriarAnimalMutation } from '../hooks/useAnimais'

interface AnimalFormProps {
  animal?: Animal
}

// Schema de UI: troca `esterilizado: boolean` (campo real do DTO) por
// `castracaoOpcao` (os 3 cartões do protótipo) — a conversão para o DTO
// acontece só no submit, via castracaoParaEsterilizado. Mantém o
// animalFormSchema original intacto (é o contrato espelhado do backend,
// usado/citado em outros lugares).
const animalFormUiSchema = animalFormSchema
  .omit({ esterilizado: true })
  .extend({
    castracaoOpcao: z.enum(['nao_castrado', 'orquiectomia', 'osh']),
  })
  // Mesma regra do AnimalService: o animal não nasce depois de entrar no CCZ.
  .superRefine((dados, ctx) => {
    if (dados.dataNascimentoAprox && dados.dataEntrada && dados.dataNascimentoAprox > dados.dataEntrada) {
      ctx.addIssue({
        code: 'custom',
        path: ['dataNascimentoAprox'],
        message: 'A data de nascimento não pode ser posterior à data de entrada.',
      })
    }
  })
type AnimalFormUiValues = z.infer<typeof animalFormUiSchema>

const CAMPOS_STEP: Record<1 | 2 | 3, (keyof AnimalFormUiValues)[]> = {
  1: ['nome', 'especie', 'sexo', 'raca', 'coloracao', 'pelagem', 'porte', 'pesoKg', 'idadeAprox', 'dataNascimentoAprox', 'microchip', 'numeroMedalha', 'dataImplantacaoChip'],
  2: ['status', 'motivoEntrada', 'dataEntrada', 'baiaId', 'dataEsterilizacao', 'procedencia', 'laudoEutanasia'],
  3: [],
}

const CAMPOS_COM_ERRO = new Set<string>([...CAMPOS_STEP[1], ...CAMPOS_STEP[2]])

// Campo do DTO -> campo do formulário, para os erros por campo do 422. O
// `esterilizado` do DTO é o grupo de cartões de castração na tela.
const MAPA_ERROS_SERVIDOR: Record<string, keyof AnimalFormUiValues> = {
  ...mapaDeCampos<AnimalFormUiValues>([...CAMPOS_STEP[1], ...CAMPOS_STEP[2], 'observacoes']),
  esterilizado: 'castracaoOpcao',
}

interface RascunhoAnimalValores {
  nome: string
  especie: string
  sexo: Sexo | ''
  raca: string
  coloracao: string
  pelagem: Pelagem | ''
  porte: Porte | ''
  pesoKg: string
  idadeAprox: string
  dataNascimentoAprox: string
  microchip: string
  castracaoOpcao: CastracaoOpcao
  // F2-004 / F2-008: opcionais no rascunho (rascunhos antigos não os têm)
  numeroMedalha?: string
  dataImplantacaoChip?: string
  procedencia?: string
  laudoEutanasia?: string
  dataEsterilizacao: string
  status: string
  motivoEntrada: string
  dataEntrada: string
  baiaId: string
  // T42: a foto NÃO vai mais aqui como data URI. O rascunho guarda só o id do
  // arquivo na store 'arquivos', onde a imagem comprimida fica como Blob.
  // Rascunhos gravados antes da T42 ainda têm `fotoUrl` preenchido; ele é
  // ignorado na restauração (ver rascunhoParaValores).
  fotoArquivoId?: string
  observacoes: string
}

// Valores iniciais do formulário. Diferem do rascunho só na foto: aqui ela é o
// data URI que a API devolve e recebe (`fotoUrl`, String no DTO); no rascunho é
// o id do arquivo guardado como Blob.
type ValoresIniciaisAnimal = Omit<RascunhoAnimalValores, 'fotoArquivoId'> & { fotoUrl: string }

// dataEntrada é LocalDateTime: o formulário só edita o dia. Se o dia não
// mudou na edição, reenvia o valor original completo para não zerar a hora;
// dia novo (ou cadastro) vai como meia-noite, como antes.
function dataEntradaParaEnvio(dataDoForm: string, original?: string): string {
  if (original && original.slice(0, 10) === dataDoForm) return original
  return `${dataDoForm}T00:00:00`
}

// Pelas funções de rascunhoAnimalStorage (store 'animais', chave e formato
// inalterados), não direto pelo banco.
const ARMAZENAMENTO_RASCUNHO_ANIMAL: ArmazenamentoRascunho<RascunhoAnimalValores> = {
  carregar: (chave) => carregarRascunhoAnimal<RascunhoAnimalValores>(chave),
  agendarSalvar: (chave, valores) => agendarSalvarRascunhoAnimal(chave, valores),
  salvar: (chave, valores) => salvarRascunhoAnimal(chave, valores),
  remover: (chave) => removerRascunhoAnimal(chave),
  cancelarAgendado: (chave) => cancelarSalvamentoRascunhoAnimal(chave),
}

function valoresVazios(): ValoresIniciaisAnimal {
  return {
    nome: '',
    especie: '',
    sexo: '',
    raca: '',
    coloracao: '',
    pelagem: '',
    porte: '',
    pesoKg: '',
    idadeAprox: '',
    dataNascimentoAprox: '',
    microchip: '',
    numeroMedalha: '',
    dataImplantacaoChip: '',
    procedencia: '',
    laudoEutanasia: '',
    castracaoOpcao: 'nao_castrado',
    dataEsterilizacao: '',
    status: '',
    motivoEntrada: '',
    dataEntrada: hojeEmItu(),
    baiaId: '',
    fotoUrl: '',
    observacoes: '',
  }
}

function valoresDeAnimal(animal: Animal): ValoresIniciaisAnimal {
  return {
    nome: animal.nome,
    especie: animal.especieCodigo,
    sexo: animal.sexo,
    raca: animal.raca ?? '',
    coloracao: animal.coloracao ?? '',
    pelagem: animal.pelagem ?? '',
    porte: animal.porte ?? '',
    pesoKg: animal.pesoKg != null ? String(animal.pesoKg) : '',
    idadeAprox: animal.idadeAprox ?? '',
    dataNascimentoAprox: animal.dataNascimentoAprox ?? '',
    microchip: animal.microchip ?? '',
    numeroMedalha: animal.numeroMedalha ?? '',
    dataImplantacaoChip: animal.dataImplantacaoChip ?? '',
    procedencia: animal.procedencia ?? '',
    laudoEutanasia: animal.laudoEutanasia ?? '',
    castracaoOpcao: esterilizadoParaCastracao(animal.esterilizado, animal.sexo),
    dataEsterilizacao: animal.dataEsterilizacao ?? '',
    status: animal.statusCodigo,
    motivoEntrada: animal.motivoEntradaCodigo,
    dataEntrada: animal.dataEntrada.slice(0, 10),
    baiaId: animal.baiaId ?? '',
    fotoUrl: animal.fotoUrl ?? '',
    observacoes: animal.observacoes ?? '',
  }
}

// Converte o valor do formulário (RHF, com número/undefined) para o formato
// persistido em IndexedDB (RascunhoAnimalValores, todo em string). A foto entra
// como id do arquivo na store 'arquivos' — nunca o data URI (T42).
function valoresParaRascunho(valores: AnimalFormUiValues, fotoArquivoId: string | null): RascunhoAnimalValores {
  return {
    nome: valores.nome,
    especie: valores.especie,
    sexo: valores.sexo,
    raca: valores.raca ?? '',
    coloracao: valores.coloracao ?? '',
    pelagem: valores.pelagem ?? '',
    porte: valores.porte ?? '',
    pesoKg: valores.pesoKg != null ? String(valores.pesoKg) : '',
    idadeAprox: valores.idadeAprox ?? '',
    dataNascimentoAprox: valores.dataNascimentoAprox ?? '',
    microchip: valores.microchip ?? '',
    numeroMedalha: valores.numeroMedalha ?? '',
    dataImplantacaoChip: valores.dataImplantacaoChip ?? '',
    procedencia: valores.procedencia ?? '',
    laudoEutanasia: valores.laudoEutanasia ?? '',
    castracaoOpcao: valores.castracaoOpcao,
    dataEsterilizacao: valores.dataEsterilizacao ?? '',
    status: valores.status,
    motivoEntrada: valores.motivoEntrada,
    dataEntrada: valores.dataEntrada,
    baiaId: valores.baiaId ?? '',
    fotoArquivoId: fotoArquivoId ?? undefined,
    observacoes: valores.observacoes ?? '',
  }
}

// Inverso: um rascunho carregado do IndexedDB (todo string) vira valores do
// formulário RHF. Aceita também um rascunho salvo antes da T42 — o `fotoUrl`
// que ele traz é ignorado, porque a foto do rascunho agora vem da store de
// arquivos, de forma assíncrona (ver handleRestaurarRascunho). `fotoUrlAtual`
// preserva o que já está na tela, que na edição é a foto do próprio animal.
function rascunhoParaValores(rascunho: RascunhoAnimalValores, fotoUrlAtual: string | undefined): AnimalFormUiValues {
  return {
    nome: rascunho.nome,
    especie: rascunho.especie,
    sexo: rascunho.sexo as AnimalFormUiValues['sexo'],
    raca: rascunho.raca || undefined,
    coloracao: rascunho.coloracao || undefined,
    pelagem: (rascunho.pelagem || undefined) as AnimalFormUiValues['pelagem'],
    porte: (rascunho.porte || undefined) as AnimalFormUiValues['porte'],
    pesoKg: rascunho.pesoKg.trim() ? Number(rascunho.pesoKg) : undefined,
    idadeAprox: rascunho.idadeAprox || undefined,
    dataNascimentoAprox: rascunho.dataNascimentoAprox || undefined,
    microchip: rascunho.microchip || undefined,
    numeroMedalha: rascunho.numeroMedalha || undefined,
    dataImplantacaoChip: rascunho.dataImplantacaoChip || undefined,
    procedencia: rascunho.procedencia || undefined,
    laudoEutanasia: rascunho.laudoEutanasia || undefined,
    castracaoOpcao: rascunho.castracaoOpcao,
    dataEsterilizacao: rascunho.dataEsterilizacao || undefined,
    status: rascunho.status,
    motivoEntrada: rascunho.motivoEntrada,
    dataEntrada: rascunho.dataEntrada,
    baiaId: rascunho.baiaId || undefined,
    fotoUrl: fotoUrlAtual || undefined,
    observacoes: rascunho.observacoes || undefined,
  }
}

function nomeCatalogo(itens: CatalogoItem[] | undefined, codigo: string): string {
  if (!codigo) return '—'
  return itens?.find((item) => item.codigo === codigo)?.nome ?? codigo
}

function formatarDataBr(data: string): string {
  if (!data) return '—'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

// setValueAs roda tanto sobre o valor digitado (string, do DOM) quanto sobre
// o valor inicial vindo de defaultValues/reset/setValue diretamente — que
// pode já chegar como number/undefined, não só string.
const semEspacos = (v: unknown) => (typeof v === 'string' ? v.trim() || undefined : v)
const semVazio = (v: unknown) => (typeof v === 'string' ? v || undefined : v)
const paraNumeroOuIndefinido = (v: unknown) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'string') return v.trim() ? Number(v) : undefined
  return undefined
}

export function AnimalForm({ animal }: AnimalFormProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  // Rotas de formulário ficam atrás de RotaProtegida: o usuário sempre existe aqui.
  const chaveRascunho = chaveRascunhoAnimal(user?.id ?? '', animal?.id)
  const iniciais = animal ? valoresDeAnimal(animal) : valoresVazios()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fotoErro, setFotoErro] = useState<string | null>(null)
  const [fotoAviso, setFotoAviso] = useState<string | null>(null)
  const [fotoCarregando, setFotoCarregando] = useState(false)
  const [rascunhoMensagem, setRascunhoMensagem] = useState<string | null>(null)

  // T42: id da foto na store 'arquivos'. Em ref, não em estado, porque só
  // alimenta o que é gravado no rascunho — mudar não precisa redesenhar a tela.
  const fotoArquivoId = useRef<string | null>(null)
  const donoDosArquivos: DonoArquivoRascunho = { store: 'animais', chave: chaveRascunho }

  const { data: catalogos } = useCatalogosAnimaisQuery()
  const { data: baias } = useBaiasAtivasQuery()
  const criarMutation = useCriarAnimalMutation()
  const atualizarMutation = useAtualizarAnimalMutation()
  const salvando = criarMutation.isPending || atualizarMutation.isPending
  const microchipTravado = Boolean(animal?.microchip)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    getValues,
    reset,
    formState: { errors },
  } = useForm<AnimalFormUiValues>({
    resolver: zodResolver(animalFormUiSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      nome: iniciais.nome,
      especie: iniciais.especie,
      sexo: iniciais.sexo as AnimalFormUiValues['sexo'],
      raca: iniciais.raca || undefined,
      coloracao: iniciais.coloracao || undefined,
      pelagem: (iniciais.pelagem || undefined) as AnimalFormUiValues['pelagem'],
      porte: (iniciais.porte || undefined) as AnimalFormUiValues['porte'],
      pesoKg: iniciais.pesoKg.trim() ? Number(iniciais.pesoKg) : undefined,
      idadeAprox: iniciais.idadeAprox || undefined,
      dataNascimentoAprox: iniciais.dataNascimentoAprox || undefined,
      microchip: iniciais.microchip || undefined,
      castracaoOpcao: iniciais.castracaoOpcao,
      dataEsterilizacao: iniciais.dataEsterilizacao || undefined,
      status: iniciais.status,
      motivoEntrada: iniciais.motivoEntrada,
      dataEntrada: iniciais.dataEntrada,
      baiaId: iniciais.baiaId || undefined,
      fotoUrl: iniciais.fotoUrl || undefined,
      observacoes: iniciais.observacoes || undefined,
    },
  })

  // Todos os campos são lidos ao vivo pela etapa 3 (revisão) — assinar tudo
  // com watch() aceita o mesmo padrão de re-render que o formulário já tinha
  // quando cada campo era um useState controlado; preservar o comportamento
  // vem antes de qualquer ganho de performance que o RHF ofereceria por padrão.
  const valores = watch()
  // F2-008: o laudo só aparece (e só é exigido) quando o destino é eutanásia.
  const statusSelecionado = valores.status
  const castracaoOpcao = valores.castracaoOpcao

  // Carrega uma vez ao montar, só então começa a salvar (debounce de 800 ms),
  // e grava no formato RascunhoAnimalValores (ver valoresParaRascunho).
  const rascunho = useRascunho<AnimalFormUiValues, RascunhoAnimalValores>({
    armazenamento: ARMAZENAMENTO_RASCUNHO_ANIMAL,
    chave: chaveRascunho,
    watch,
    reset,
    getValues,
    paraRascunho: (valoresAtuais) => valoresParaRascunho(valoresAtuais, fotoArquivoId.current),
    deRascunho: (salvo) => rascunhoParaValores(salvo, getValues('fotoUrl')),
  })

  async function handleSalvarRascunhoAgora() {
    await rascunho.salvarAgora()
    setRascunhoMensagem('Rascunho salvo.')
    setTimeout(() => setRascunhoMensagem(null), 3000)
  }

  // A foto do rascunho vem da store de arquivos, o que é assíncrono e não cabe
  // na conversão síncrona do `deRascunho` — por isso o restaurar é envolvido
  // aqui, lendo o id antes de o aviso ser fechado.
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

  // Grava a imagem comprimida como Blob, UMA vez, aqui — fora do debounce do
  // rascunho de texto, que guarda só o id. A foto anterior sai antes, para o
  // rascunho não acumular arquivos trocados.
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
    // O autosave disparado pelo setValue da foto foi montado antes desta
    // gravação e não tem o id; salvar agora o substitui.
    await rascunho.salvarAgora()
    // Sem IndexedDB ou sem cota: a foto segue na tela e no envio, só não
    // sobrevive a um recarregamento.
    if (!referencia) setFotoAviso('A foto não ficou salva no rascunho, mas continua no formulário.')
  }

  function tratarErroSubmit(erro: unknown) {
    if (isAxiosError(erro)) {
      const httpStatus = erro.response?.status
      const mensagem = (erro.response?.data as { mensagem?: string } | undefined)?.mensagem
      const pareceComMicrochip = mensagem?.toLowerCase().includes('icrochip')

      if ((httpStatus === 409 || httpStatus === 422) && pareceComMicrochip) {
        setError('microchip', { message: mensagem ?? 'Microchip já cadastrado.' })
        setStep(1)
        return
      }
    }

    const campos = aplicarErrosDeCampo(erro, setError, MAPA_ERROS_SERVIDOR)
    if (campos.length > 0) {
      setStep((CAMPOS_STEP[1] as string[]).includes(campos[0]) ? 1 : 2)
      return
    }
    // 409 de baia cheia/inativa e outras regras sem campo: mostra o motivo.
    setSubmitError(mensagemDeRegraDaApi(erro) ?? 'Não foi possível salvar o animal. Tente novamente.')
  }

  async function onSubmit(dados: AnimalFormUiValues) {
    const payload: AnimalRequest = {
      nome: dados.nome,
      especie: dados.especie,
      sexo: dados.sexo,
      raca: dados.raca,
      coloracao: dados.coloracao,
      pelagem: dados.pelagem,
      porte: dados.porte,
      pesoKg: dados.pesoKg,
      idadeAprox: dados.idadeAprox,
      dataNascimentoAprox: dados.dataNascimentoAprox,
      microchip: dados.microchip,
      numeroMedalha: dados.numeroMedalha,
      dataImplantacaoChip: dados.dataImplantacaoChip,
      procedencia: dados.procedencia,
      laudoEutanasia: dados.laudoEutanasia,
      esterilizado: castracaoParaEsterilizado(dados.castracaoOpcao),
      // Rascunho antigo pode trazer data com "não castrado": não envia.
      dataEsterilizacao: dados.castracaoOpcao === 'nao_castrado' ? undefined : dados.dataEsterilizacao,
      status: dados.status,
      motivoEntrada: dados.motivoEntrada,
      dataEntrada: dataEntradaParaEnvio(dados.dataEntrada, animal?.dataEntrada),
      baiaId: dados.baiaId,
      fotoUrl: dados.fotoUrl,
      observacoes: dados.observacoes,
    }

    try {
      if (animal) {
        await atualizarMutation.mutateAsync({ id: animal.id, payload })
      } else {
        await criarMutation.mutateAsync(payload)
      }
      await rascunho.removerAposSucesso()
      await removerArquivosDoRascunho(donoDosArquivos)
      navigate('/animais')
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

  return (
    <div className="wizard-shell">
      <div className="page-header">
        <div className="title-block">
          <Link to="/animais" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
            ← Voltar para Animais
          </Link>
          <h1>{animal ? `Editar ${animal.nome}` : 'Cadastrar Novo Animal'}</h1>
          <p className="subtitle">
            {animal ? 'Atualize os dados do animal em 3 etapas.' : 'Preencha as informações em 3 etapas. Você poderá editar depois.'}
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

      <div className="stepper">
        <div className={`step${step === 1 ? ' active' : step > 1 ? ' done' : ''}`}>
          <span className="num">1</span>
          <span>Dados Básicos</span>
        </div>
        <div className={`arrow${step > 1 ? ' done' : ''}`} />
        <div className={`step${step === 2 ? ' active' : step > 2 ? ' done' : ''}`}>
          <span className="num">2</span>
          <span>Saúde &amp; Baia</span>
        </div>
        <div className={`arrow${step > 2 ? ' done' : ''}`} />
        <div className={`step${step === 3 ? ' active' : ''}`}>
          <span className="num">3</span>
          <span>Foto &amp; Revisão</span>
        </div>
      </div>

      <form onSubmit={aoEnviar} noValidate>
        {submitError && (
          <div className="alert danger" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            <span className="bullet" />
            <div className="alert-content">{submitError}</div>
          </div>
        )}

        <div className={`card step-pane${step === 1 ? ' active' : ''}`}>
          <div className="card-header">
            <h3>Dados Básicos</h3>
            <span className="sub">
              Campos com <span style={{ color: 'var(--color-danger)' }}>*</span> são obrigatórios
            </span>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="field full">
                <label htmlFor="nome">
                  Nome do animal <span className="req">*</span>
                </label>
                <input
                  id="nome"
                  className={`input${errors.nome ? ' error' : ''}`}
                  type="text"
                  placeholder="Ex: Rex"
                  {...register('nome')}
                />
                {errors.nome ? (
                  <span className="err">{errors.nome.message}</span>
                ) : (
                  <span className="hint">Use o nome de chamada do animal. Se desconhecido, use um apelido.</span>
                )}
              </div>

              <div className="field full">
                <label id="especie-label">
                  Espécie <span className="req">*</span>
                </label>
                <Controller
                  name="especie"
                  control={control}
                  render={({ field }) => (
                    <div className="radio-cards" role="radiogroup" aria-labelledby="especie-label">
                      {catalogos?.especies.map((item) => (
                        <button
                          key={item.codigo}
                          type="button"
                          role="radio"
                          aria-checked={field.value === item.codigo}
                          className={`radio-card${field.value === item.codigo ? ' selected' : ''}`}
                          onClick={() => field.onChange(item.codigo)}
                        >
                          <span className="label">{item.nome}</span>
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.especie && <span className="err">{errors.especie.message}</span>}
              </div>

              <div className="field">
                <label htmlFor="microchip">Microchip</label>
                <input
                  id="microchip"
                  className={`input mono${errors.microchip ? ' error' : ''}`}
                  type="text"
                  placeholder="985121234567890"
                  maxLength={15}
                  disabled={microchipTravado}
                  {...register('microchip', { setValueAs: semEspacos })}
                />
                {errors.microchip ? (
                  <span className="err">{errors.microchip.message}</span>
                ) : (
                  <span className="hint">
                    {microchipTravado
                      ? 'Microchip já definido: não pode mais ser alterado.'
                      : '15 dígitos numéricos (ISO 11784). Ficha fica incompleta sem microchip.'}
                  </span>
                )}
              </div>

              <div className="field">
                <label htmlFor="dataImplantacaoChip">Data de implantação do chip</label>
                <input
                  id="dataImplantacaoChip"
                  className={`input${errors.dataImplantacaoChip ? ' error' : ''}`}
                  type="date"
                  max={hojeEmItu()}
                  {...register('dataImplantacaoChip', { setValueAs: semEspacos })}
                />
                {errors.dataImplantacaoChip ? (
                  <span className="err">{errors.dataImplantacaoChip.message}</span>
                ) : (
                  <span className="hint">Registrada quando o chip é implantado no CCZ (RN01). Exige microchip.</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="numeroMedalha">Número da medalha</label>
                <input
                  id="numeroMedalha"
                  className={`input mono${errors.numeroMedalha ? ' error' : ''}`}
                  type="text"
                  maxLength={30}
                  placeholder="Ex.: M-0042"
                  {...register('numeroMedalha', { setValueAs: semEspacos })}
                />
                {errors.numeroMedalha ? (
                  <span className="err">{errors.numeroMedalha.message}</span>
                ) : (
                  <span className="hint">Plaqueta de identificação; única quando informada.</span>
                )}
              </div>

              <div className="field">
                <label id="sexo-label">
                  Sexo <span className="req">*</span>
                </label>
                <Controller
                  name="sexo"
                  control={control}
                  render={({ field }) => (
                    <div
                      className="radio-cards"
                      style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
                      role="radiogroup"
                      aria-labelledby="sexo-label"
                    >
                      {SEXO_OPCOES.map((opcao) => (
                        <button
                          key={opcao.valor}
                          type="button"
                          role="radio"
                          aria-checked={field.value === opcao.valor}
                          className={`radio-card${field.value === opcao.valor ? ' selected' : ''}`}
                          onClick={() => field.onChange(opcao.valor)}
                        >
                          <span className="label">{opcao.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.sexo && <span className="err">{errors.sexo.message}</span>}
              </div>

              <div className="field">
                <label id="porte-label">Porte</label>
                <Controller
                  name="porte"
                  control={control}
                  render={({ field }) => (
                    <div
                      className="radio-cards"
                      style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
                      role="radiogroup"
                      aria-labelledby="porte-label"
                    >
                      {PORTE_OPCOES.map((opcao) => (
                        <button
                          key={opcao.valor}
                          type="button"
                          role="radio"
                          aria-checked={field.value === opcao.valor}
                          className={`radio-card${field.value === opcao.valor ? ' selected' : ''}`}
                          onClick={() => field.onChange(opcao.valor)}
                        >
                          <span className="label">{opcao.label}</span>
                          <span className="sub">{opcao.sub}</span>
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              <div className="field">
                <label htmlFor="raca">Raça</label>
                <input
                  id="raca"
                  className="input"
                  type="text"
                  placeholder="Ex: SRD, Labrador, Poodle..."
                  {...register('raca', { setValueAs: semEspacos })}
                />
              </div>
              <div className="field">
                <label htmlFor="dataNascimentoAprox">Data provável de nascimento</label>
                <input
                  id="dataNascimentoAprox"
                  className={`input${errors.dataNascimentoAprox ? ' error' : ''}`}
                  type="date"
                  max={hojeEmItu()}
                  {...register('dataNascimentoAprox', { setValueAs: semVazio })}
                />
                {errors.dataNascimentoAprox && <span className="err">{errors.dataNascimentoAprox.message}</span>}
              </div>

              <div className="field">
                <label htmlFor="pelagem">Pelagem</label>
                <select id="pelagem" className="select" {...register('pelagem', { setValueAs: semVazio })}>
                  <option value="">Selecione…</option>
                  {PELAGEM_OPCOES.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="coloracao">Cor / coloração</label>
                <input
                  id="coloracao"
                  className="input"
                  type="text"
                  placeholder="Ex: Caramelo, Preto e branco..."
                  {...register('coloracao', { setValueAs: semEspacos })}
                />
              </div>

              <div className="field">
                <label htmlFor="idadeAprox">Idade aproximada</label>
                <input
                  id="idadeAprox"
                  className="input"
                  type="text"
                  placeholder="Ex: 2 anos"
                  {...register('idadeAprox', { setValueAs: semEspacos })}
                />
              </div>
              <div className="field">
                <label htmlFor="pesoKg">Peso (kg)</label>
                <input
                  id="pesoKg"
                  className={`input${errors.pesoKg ? ' error' : ''}`}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 12.5"
                  {...register('pesoKg', { setValueAs: paraNumeroOuIndefinido })}
                />
                {errors.pesoKg && <span className="err">{errors.pesoKg.message}</span>}
              </div>
            </div>
          </div>
          <div
            className="card-header"
            style={{ borderTop: '1px solid var(--color-border)', borderBottom: 'none', justifyContent: 'flex-end' }}
          >
            <Link to="/animais" className="btn btn-ghost">
              Cancelar
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
              Próximo: Saúde &amp; Baia →
            </button>
          </div>
        </div>

        <div className={`card step-pane${step === 2 ? ' active' : ''}`}>
          <div className="card-header">
            <h3>Saúde &amp; Baia</h3>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="baiaId">Baia atual</label>
                <select id="baiaId" className="select" {...register('baiaId', { setValueAs: semVazio })}>
                  <option value="">Sem baia (em trânsito)</option>
                  {baias?.map((baia) => (
                    <option key={baia.id} value={baia.id} disabled={baia.superlotada && baia.id !== iniciais.baiaId}>
                      {baia.nome} — {baia.ocupacaoAtual}/{baia.capacidade}
                      {baia.superlotada ? ' (superlotada)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="status">
                  Status <span className="req">*</span>
                </label>
                <select id="status" className={`select${errors.status ? ' error' : ''}`} {...register('status')}>
                  <option value="" disabled>
                    Selecione…
                  </option>
                  {catalogos?.status.map((item) => (
                    <option key={item.codigo} value={item.codigo}>
                      {item.nome}
                    </option>
                  ))}
                </select>
                {errors.status && <span className="err">{errors.status.message}</span>}
              </div>

              <div className="field">
                <label htmlFor="motivoEntrada">
                  Motivo de entrada <span className="req">*</span>
                </label>
                <select
                  id="motivoEntrada"
                  className={`select${errors.motivoEntrada ? ' error' : ''}`}
                  {...register('motivoEntrada')}
                >
                  <option value="" disabled>
                    Selecione…
                  </option>
                  {catalogos?.motivosEntrada.map((item) => (
                    <option key={item.codigo} value={item.codigo}>
                      {item.nome}
                    </option>
                  ))}
                </select>
                {errors.motivoEntrada && <span className="err">{errors.motivoEntrada.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="dataEntrada">
                  Data de entrada <span className="req">*</span>
                </label>
                <input
                  id="dataEntrada"
                  className={`input${errors.dataEntrada ? ' error' : ''}`}
                  type="date"
                  max={hojeEmItu()}
                  {...register('dataEntrada')}
                />
                {errors.dataEntrada && <span className="err">{errors.dataEntrada.message}</span>}
              </div>

              <div className="field full">
                <label id="castracao-label">Castração</label>
                <Controller
                  name="castracaoOpcao"
                  control={control}
                  render={({ field }) => (
                    <div
                      className="radio-cards"
                      style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
                      role="radiogroup"
                      aria-labelledby="castracao-label"
                    >
                      {CASTRACAO_OPCOES.map((opcao) => (
                        <button
                          key={opcao.valor}
                          type="button"
                          role="radio"
                          aria-checked={field.value === opcao.valor}
                          className={`radio-card${field.value === opcao.valor ? ' selected' : ''}`}
                          onClick={() => {
                            field.onChange(opcao.valor)
                            // O campo some da tela, mas o RHF guardaria o valor:
                            // "não castrado" com data é recusado pelo backend.
                            if (opcao.valor === 'nao_castrado') setValue('dataEsterilizacao', undefined)
                          }}
                        >
                          <span className="label">{opcao.label}</span>
                          <span className="sub">{opcao.sub}</span>
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {castracaoOpcao !== 'nao_castrado' && (
                <div className="field">
                  <label htmlFor="dataEsterilizacao">Data da castração</label>
                  <input
                    id="dataEsterilizacao"
                    className={`input${errors.dataEsterilizacao ? ' error' : ''}`}
                    type="date"
                    max={hojeEmItu()}
                    {...register('dataEsterilizacao', { setValueAs: semVazio })}
                  />
                  {errors.dataEsterilizacao && <span className="err">{errors.dataEsterilizacao.message}</span>}
                </div>
              )}

              <div className="field full">
                <label htmlFor="observacoes">Observações gerais</label>
                <textarea
                  id="observacoes"
                  className="textarea"
                  placeholder="Comportamento, características marcantes, histórico relevante..."
                  {...register('observacoes', { setValueAs: semEspacos })}
                />
              </div>

              <div className="field">
                <label htmlFor="procedencia">Procedência</label>
                <input
                  id="procedencia"
                  className={`input${errors.procedencia ? ' error' : ''}`}
                  type="text"
                  maxLength={200}
                  placeholder="Ex.: Recolhido na Rua das Flores, Vila Progresso"
                  {...register('procedencia', { setValueAs: semEspacos })}
                />
                {errors.procedencia ? (
                  <span className="err">{errors.procedencia.message}</span>
                ) : (
                  <span className="hint">Origem do animal na entrada (RF-A05), complementar ao motivo de entrada.</span>
                )}
              </div>

              {statusSelecionado === 'obito_eutanasia' && (
                <div className="field full">
                  <label htmlFor="laudoEutanasia">
                    Laudo de eutanásia <span className="req">*</span>
                  </label>
                  <textarea
                    id="laudoEutanasia"
                    className={`input${errors.laudoEutanasia ? ' error' : ''}`}
                    rows={4}
                    maxLength={4000}
                    placeholder="Justificativa do responsável técnico (Lei nº 14.228/2021, art. 2º, § 1º)"
                    {...register('laudoEutanasia', { setValueAs: semEspacos })}
                  />
                  {errors.laudoEutanasia ? (
                    <span className="err">{errors.laudoEutanasia.message}</span>
                  ) : (
                    <span className="hint">Obrigatório ao registrar o destino óbito por eutanásia.</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div
            className="card-header"
            style={{ borderTop: '1px solid var(--color-border)', borderBottom: 'none', justifyContent: 'space-between' }}
          >
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
              ← Anterior
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>
              Próximo: Foto &amp; Revisão →
            </button>
          </div>
        </div>

        <div className={`card step-pane${step === 3 ? ' active' : ''}`}>
          <div className="card-header">
            <h3>Foto &amp; Revisão</h3>
          </div>
          <div className="card-body">
            <div className="field full" style={{ marginBottom: 'var(--space-5)' }}>
              <label htmlFor="foto">Foto do animal</label>
              <label className="upload-area" style={{ display: 'block' }}>
                <input
                  id="foto"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleArquivoFoto}
                  style={{ display: 'none' }}
                />
                {valores.fotoUrl ? (
                  <div className="animal-avatar xl" style={{ margin: '0 auto 12px' }}>
                    <img src={valores.fotoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className="ico">
                    <Icon name="plus" size={24} />
                  </div>
                )}
                <h4>{fotoCarregando ? 'Processando imagem…' : valores.fotoUrl ? 'Trocar foto' : 'Arraste uma foto ou clique para enviar'}</h4>
                <p>JPG ou PNG, até 5MB.</p>
              </label>
              {fotoErro && <span className="err">{fotoErro}</span>}
              {fotoAviso && <span className="hint">{fotoAviso}</span>}
            </div>

            <div className="fieldset">
              <legend>Revisão dos dados</legend>
              <div className="review-grid">
                <div className="review-row">
                  <span className="k">Nome</span>
                  <span className="v">{valores.nome || '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Espécie</span>
                  <span className="v">{nomeCatalogo(catalogos?.especies, valores.especie)}</span>
                </div>
                <div className="review-row">
                  <span className="k">Microchip</span>
                  <span className="v mono">{valores.microchip || '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Medalha</span>
                  <span className="v mono">{valores.numeroMedalha || '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Implantação do chip</span>
                  <span className="v">{valores.dataImplantacaoChip ? formatarDataBR(valores.dataImplantacaoChip) : '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Procedência</span>
                  <span className="v">{valores.procedencia || '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Sexo</span>
                  <span className="v">{SEXO_OPCOES.find((opcao) => opcao.valor === valores.sexo)?.label ?? '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Porte</span>
                  <span className="v">{PORTE_OPCOES.find((opcao) => opcao.valor === valores.porte)?.label ?? '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Raça</span>
                  <span className="v">{valores.raca || '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Nasc. aprox.</span>
                  <span className="v">{formatarDataBr(valores.dataNascimentoAprox ?? '')}</span>
                </div>
                <div className="review-row">
                  <span className="k">Pelagem · Cor</span>
                  <span className="v">
                    {PELAGEM_OPCOES.find((opcao) => opcao.valor === valores.pelagem)?.label ?? '—'} · {valores.coloracao || '—'}
                  </span>
                </div>
                <div className="review-row">
                  <span className="k">Motivo de entrada</span>
                  <span className="v">{nomeCatalogo(catalogos?.motivosEntrada, valores.motivoEntrada)}</span>
                </div>
                <div className="review-row">
                  <span className="k">Baia</span>
                  <span className="v">{baias?.find((baia) => baia.id === valores.baiaId)?.nome ?? '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Status</span>
                  <span className="v">{nomeCatalogo(catalogos?.status, valores.status)}</span>
                </div>
                <div className="review-row">
                  <span className="k">Castração</span>
                  <span className="v">{CASTRACAO_OPCOES.find((opcao) => opcao.valor === valores.castracaoOpcao)?.label}</span>
                </div>
                <div className="review-row" style={{ gridColumn: '1 / -1' }}>
                  <span className="k">Observações</span>
                  <span className="v">{valores.observacoes || '—'}</span>
                </div>
              </div>
            </div>
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
              <button type="button" className="btn btn-outline" onClick={handleSalvarRascunhoAgora}>
                Salvar como rascunho
              </button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={salvando}>
                {salvando ? 'Salvando…' : animal ? 'Salvar alterações' : 'Cadastrar animal'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
