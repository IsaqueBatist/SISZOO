import { isAxiosError } from 'axios'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, type FieldErrors as RhfFieldErrors } from 'react-hook-form'
import { z } from 'zod'
import { Icon } from '../../components/layout/Icon'
import type { Animal, AnimalRequest, CatalogoItem, Pelagem, Porte, Sexo } from './animais.types'
import {
  CASTRACAO_OPCOES,
  PELAGEM_OPCOES,
  PORTE_OPCOES,
  SEXO_OPCOES,
  animalFormSchema,
  castracaoParaEsterilizado,
  esterilizadoParaCastracao,
  type CastracaoOpcao,
} from './animalFormSchema'
import { ImagemInvalidaError, comprimirImagem } from './comprimirImagem'
import {
  agendarSalvarRascunhoAnimal,
  carregarRascunhoAnimal,
  chaveRascunhoAnimal,
  removerRascunhoAnimal,
  salvarRascunhoAnimal,
} from './rascunhoAnimalStorage'
import { useAtualizarAnimalMutation, useBaiasAtivasQuery, useCatalogosAnimaisQuery, useCriarAnimalMutation } from './useAnimais'

interface AnimalFormProps {
  animal?: Animal
}

// Schema de UI: troca `esterilizado: boolean` (campo real do DTO) por
// `castracaoOpcao` (os 3 cartões do protótipo) — a conversão para o DTO
// acontece só no submit, via castracaoParaEsterilizado. Mantém o
// animalFormSchema original intacto (é o contrato espelhado do backend,
// usado/citado em outros lugares).
const animalFormUiSchema = animalFormSchema.omit({ esterilizado: true }).extend({
  castracaoOpcao: z.enum(['nao_castrado', 'orquiectomia', 'osh']),
})
type AnimalFormUiValues = z.infer<typeof animalFormUiSchema>

const CAMPOS_STEP: Record<1 | 2 | 3, (keyof AnimalFormUiValues)[]> = {
  1: ['nome', 'especie', 'sexo', 'raca', 'coloracao', 'pelagem', 'porte', 'pesoKg', 'idadeAprox', 'dataNascimentoAprox', 'microchip'],
  2: ['status', 'motivoEntrada', 'dataEntrada', 'baiaId', 'dataEsterilizacao'],
  3: [],
}

const CAMPOS_COM_ERRO = new Set<string>([...CAMPOS_STEP[1], ...CAMPOS_STEP[2]])

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
  dataEsterilizacao: string
  status: string
  motivoEntrada: string
  dataEntrada: string
  baiaId: string
  fotoUrl: string
  observacoes: string
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function valoresVazios(): RascunhoAnimalValores {
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
    castracaoOpcao: 'nao_castrado',
    dataEsterilizacao: '',
    status: '',
    motivoEntrada: '',
    dataEntrada: hojeISO(),
    baiaId: '',
    fotoUrl: '',
    observacoes: '',
  }
}

function valoresDeAnimal(animal: Animal): RascunhoAnimalValores {
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
// persistido em IndexedDB (RascunhoAnimalValores, todo em string) — o shape
// exato não pode mudar, ou rascunhos já salvos por usuários ficam órfãos.
function valoresParaRascunho(valores: AnimalFormUiValues): RascunhoAnimalValores {
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
    castracaoOpcao: valores.castracaoOpcao,
    dataEsterilizacao: valores.dataEsterilizacao ?? '',
    status: valores.status,
    motivoEntrada: valores.motivoEntrada,
    dataEntrada: valores.dataEntrada,
    baiaId: valores.baiaId ?? '',
    fotoUrl: valores.fotoUrl ?? '',
    observacoes: valores.observacoes ?? '',
  }
}

// Inverso: um rascunho carregado do IndexedDB (todo string) vira valores do
// formulário RHF. Aceita tanto o formato atual quanto um rascunho salvo
// antes desta migração (mesmo shape — RascunhoAnimalValores não mudou).
function rascunhoParaValores(rascunho: RascunhoAnimalValores): AnimalFormUiValues {
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
    castracaoOpcao: rascunho.castracaoOpcao,
    dataEsterilizacao: rascunho.dataEsterilizacao || undefined,
    status: rascunho.status,
    motivoEntrada: rascunho.motivoEntrada,
    dataEntrada: rascunho.dataEntrada,
    baiaId: rascunho.baiaId || undefined,
    fotoUrl: rascunho.fotoUrl || undefined,
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
  const chaveRascunho = chaveRascunhoAnimal(animal?.id)
  const iniciais = animal ? valoresDeAnimal(animal) : valoresVazios()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fotoErro, setFotoErro] = useState<string | null>(null)
  const [fotoCarregando, setFotoCarregando] = useState(false)
  const [rascunhoDisponivel, setRascunhoDisponivel] = useState<RascunhoAnimalValores | null>(null)
  const [rascunhoMensagem, setRascunhoMensagem] = useState<string | null>(null)
  const [prontoParaAutoSalvar, setProntoParaAutoSalvar] = useState(false)

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
  const castracaoOpcao = valores.castracaoOpcao

  useEffect(() => {
    let cancelado = false
    carregarRascunhoAnimal<RascunhoAnimalValores>(chaveRascunho).then((valoresSalvos) => {
      if (cancelado) return
      if (valoresSalvos) setRascunhoDisponivel(valoresSalvos)
      setProntoParaAutoSalvar(true)
    })
    return () => {
      cancelado = true
    }
    // Só verifica o rascunho salvo uma vez, ao montar o formulário.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // O gate precisa envolver a CRIAÇÃO da assinatura, não só o corpo do
    // callback: criar a assinatura incondicionalmente e checar a flag só
    // dentro do callback é um stale closure real (o callback fecharia sobre
    // o valor de prontoParaAutoSalvar do momento em que a assinatura foi
    // criada) — na pior hipótese, salvaria um rascunho vazio por cima do
    // rascunho de verdade do usuário antes da hidratação terminar.
    if (!prontoParaAutoSalvar) return
    const inscricao = watch((valoresAtuais) => {
      agendarSalvarRascunhoAnimal(chaveRascunho, valoresParaRascunho(valoresAtuais as AnimalFormUiValues))
    })
    return () => inscricao.unsubscribe()
  }, [prontoParaAutoSalvar, chaveRascunho, watch])

  function handleRestaurarRascunho() {
    if (rascunhoDisponivel) reset(rascunhoParaValores(rascunhoDisponivel))
    setRascunhoDisponivel(null)
  }

  async function handleDescartarRascunho() {
    setRascunhoDisponivel(null)
    await removerRascunhoAnimal(chaveRascunho)
  }

  async function handleSalvarRascunhoAgora() {
    await salvarRascunhoAnimal(chaveRascunho, valoresParaRascunho(getValues()))
    setRascunhoMensagem('Rascunho salvo.')
    setTimeout(() => setRascunhoMensagem(null), 3000)
  }

  async function handleArquivoFoto(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    event.target.value = ''
    if (!arquivo) return

    setFotoErro(null)
    setFotoCarregando(true)
    try {
      const dataUri = await comprimirImagem(arquivo)
      setValue('fotoUrl', dataUri)
    } catch (erro) {
      setFotoErro(erro instanceof ImagemInvalidaError ? erro.message : 'Não foi possível processar a imagem.')
    } finally {
      setFotoCarregando(false)
    }
  }

  function tratarErroSubmit(erro: unknown) {
    if (isAxiosError(erro)) {
      const httpStatus = erro.response?.status
      const mensagem = (erro.response?.data as { mensagem?: string } | undefined)?.mensagem
      const pareceComMicrochip = mensagem?.toLowerCase().includes('icrochip')

      if (httpStatus === 409 || (httpStatus === 422 && pareceComMicrochip)) {
        setError('microchip', { message: mensagem ?? 'Microchip já cadastrado.' })
        setStep(1)
        return
      }
    }
    setSubmitError('Não foi possível salvar o animal. Tente novamente.')
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
      esterilizado: castracaoParaEsterilizado(dados.castracaoOpcao),
      dataEsterilizacao: dados.dataEsterilizacao,
      status: dados.status,
      motivoEntrada: dados.motivoEntrada,
      dataEntrada: `${dados.dataEntrada}T00:00:00`,
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
      await removerRascunhoAnimal(chaveRascunho)
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

      {rascunhoDisponivel && (
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
                  className="input"
                  type="date"
                  {...register('dataNascimentoAprox', { setValueAs: semVazio })}
                />
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

              {castracaoOpcao !== 'nao_castrado' && (
                <div className="field">
                  <label htmlFor="dataEsterilizacao">Data da castração</label>
                  <input
                    id="dataEsterilizacao"
                    className="input"
                    type="date"
                    {...register('dataEsterilizacao', { setValueAs: semVazio })}
                  />
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
