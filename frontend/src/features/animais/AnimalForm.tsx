import { isAxiosError } from 'axios'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

interface FieldErrors {
  nome?: string
  especie?: string
  sexo?: string
  raca?: string
  coloracao?: string
  pelagem?: string
  porte?: string
  pesoKg?: string
  idadeAprox?: string
  dataNascimentoAprox?: string
  microchip?: string
  dataEsterilizacao?: string
  status?: string
  motivoEntrada?: string
  dataEntrada?: string
  baiaId?: string
  observacoes?: string
}

const CAMPOS_STEP: Record<1 | 2 | 3, (keyof FieldErrors)[]> = {
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

function nomeCatalogo(itens: CatalogoItem[] | undefined, codigo: string): string {
  if (!codigo) return '—'
  return itens?.find((item) => item.codigo === codigo)?.nome ?? codigo
}

function formatarDataBr(data: string): string {
  if (!data) return '—'
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

export function AnimalForm({ animal }: AnimalFormProps) {
  const navigate = useNavigate()
  const chaveRascunho = chaveRascunhoAnimal(animal?.id)
  const iniciais = animal ? valoresDeAnimal(animal) : valoresVazios()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [nome, setNome] = useState(iniciais.nome)
  const [especie, setEspecie] = useState(iniciais.especie)
  const [sexo, setSexo] = useState<Sexo | ''>(iniciais.sexo)
  const [raca, setRaca] = useState(iniciais.raca)
  const [coloracao, setColoracao] = useState(iniciais.coloracao)
  const [pelagem, setPelagem] = useState<Pelagem | ''>(iniciais.pelagem)
  const [porte, setPorte] = useState<Porte | ''>(iniciais.porte)
  const [pesoKg, setPesoKg] = useState(iniciais.pesoKg)
  const [idadeAprox, setIdadeAprox] = useState(iniciais.idadeAprox)
  const [dataNascimentoAprox, setDataNascimentoAprox] = useState(iniciais.dataNascimentoAprox)
  const [microchip, setMicrochip] = useState(iniciais.microchip)
  const [castracaoOpcao, setCastracaoOpcao] = useState<CastracaoOpcao>(iniciais.castracaoOpcao)
  const [dataEsterilizacao, setDataEsterilizacao] = useState(iniciais.dataEsterilizacao)
  const [status, setStatus] = useState(iniciais.status)
  const [motivoEntrada, setMotivoEntrada] = useState(iniciais.motivoEntrada)
  const [dataEntrada, setDataEntrada] = useState(iniciais.dataEntrada)
  const [baiaId, setBaiaId] = useState(iniciais.baiaId)
  const [fotoUrl, setFotoUrl] = useState(iniciais.fotoUrl)
  const [observacoes, setObservacoes] = useState(iniciais.observacoes)

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
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

  useEffect(() => {
    let cancelado = false
    carregarRascunhoAnimal<RascunhoAnimalValores>(chaveRascunho).then((valores) => {
      if (cancelado) return
      if (valores) setRascunhoDisponivel(valores)
      setProntoParaAutoSalvar(true)
    })
    return () => {
      cancelado = true
    }
    // Só verifica o rascunho salvo uma vez, ao montar o formulário.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!prontoParaAutoSalvar) return
    agendarSalvarRascunhoAnimal(chaveRascunho, {
      nome,
      especie,
      sexo,
      raca,
      coloracao,
      pelagem,
      porte,
      pesoKg,
      idadeAprox,
      dataNascimentoAprox,
      microchip,
      castracaoOpcao,
      dataEsterilizacao,
      status,
      motivoEntrada,
      dataEntrada,
      baiaId,
      fotoUrl,
      observacoes,
    })
  }, [
    prontoParaAutoSalvar,
    chaveRascunho,
    nome,
    especie,
    sexo,
    raca,
    coloracao,
    pelagem,
    porte,
    pesoKg,
    idadeAprox,
    dataNascimentoAprox,
    microchip,
    castracaoOpcao,
    dataEsterilizacao,
    status,
    motivoEntrada,
    dataEntrada,
    baiaId,
    fotoUrl,
    observacoes,
  ])

  function aplicarValores(valores: RascunhoAnimalValores) {
    setNome(valores.nome)
    setEspecie(valores.especie)
    setSexo(valores.sexo)
    setRaca(valores.raca)
    setColoracao(valores.coloracao)
    setPelagem(valores.pelagem)
    setPorte(valores.porte)
    setPesoKg(valores.pesoKg)
    setIdadeAprox(valores.idadeAprox)
    setDataNascimentoAprox(valores.dataNascimentoAprox)
    setMicrochip(valores.microchip)
    setCastracaoOpcao(valores.castracaoOpcao)
    setDataEsterilizacao(valores.dataEsterilizacao)
    setStatus(valores.status)
    setMotivoEntrada(valores.motivoEntrada)
    setDataEntrada(valores.dataEntrada)
    setBaiaId(valores.baiaId)
    setFotoUrl(valores.fotoUrl)
    setObservacoes(valores.observacoes)
  }

  function handleRestaurarRascunho() {
    if (rascunhoDisponivel) aplicarValores(rascunhoDisponivel)
    setRascunhoDisponivel(null)
  }

  async function handleDescartarRascunho() {
    setRascunhoDisponivel(null)
    await removerRascunhoAnimal(chaveRascunho)
  }

  async function handleSalvarRascunhoAgora() {
    await salvarRascunhoAnimal(chaveRascunho, {
      nome,
      especie,
      sexo,
      raca,
      coloracao,
      pelagem,
      porte,
      pesoKg,
      idadeAprox,
      dataNascimentoAprox,
      microchip,
      castracaoOpcao,
      dataEsterilizacao,
      status,
      motivoEntrada,
      dataEntrada,
      baiaId,
      fotoUrl,
      observacoes,
    })
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
      setFotoUrl(dataUri)
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
        setFieldErrors((atual) => ({ ...atual, microchip: mensagem ?? 'Microchip já cadastrado.' }))
        setStep(1)
        return
      }
    }
    setSubmitError('Não foi possível salvar o animal. Tente novamente.')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const resultado = animalFormSchema.safeParse({
      nome,
      especie,
      sexo: sexo || undefined,
      raca: raca.trim() || undefined,
      coloracao: coloracao.trim() || undefined,
      pelagem: pelagem || undefined,
      porte: porte || undefined,
      pesoKg: pesoKg.trim() ? Number(pesoKg) : undefined,
      idadeAprox: idadeAprox.trim() || undefined,
      dataNascimentoAprox: dataNascimentoAprox || undefined,
      microchip: microchip.trim() || undefined,
      esterilizado: castracaoParaEsterilizado(castracaoOpcao),
      dataEsterilizacao: dataEsterilizacao || undefined,
      status,
      motivoEntrada,
      dataEntrada,
      baiaId: baiaId || undefined,
      fotoUrl: fotoUrl || undefined,
      observacoes: observacoes.trim() || undefined,
    })

    if (!resultado.success) {
      const erros: FieldErrors = {}
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0]
        if (typeof campo === 'string' && CAMPOS_COM_ERRO.has(campo)) {
          erros[campo as keyof FieldErrors] = issue.message
        }
      }
      setFieldErrors(erros)
      const primeiroErro = Object.keys(erros)[0] as keyof FieldErrors | undefined
      if (primeiroErro && CAMPOS_STEP[1].includes(primeiroErro)) setStep(1)
      else if (primeiroErro && CAMPOS_STEP[2].includes(primeiroErro)) setStep(2)
      return
    }

    setFieldErrors({})

    const payload: AnimalRequest = {
      nome: resultado.data.nome,
      especie: resultado.data.especie,
      sexo: resultado.data.sexo,
      raca: resultado.data.raca,
      coloracao: resultado.data.coloracao,
      pelagem: resultado.data.pelagem,
      porte: resultado.data.porte,
      pesoKg: resultado.data.pesoKg,
      idadeAprox: resultado.data.idadeAprox,
      dataNascimentoAprox: resultado.data.dataNascimentoAprox,
      microchip: resultado.data.microchip,
      esterilizado: resultado.data.esterilizado,
      dataEsterilizacao: resultado.data.dataEsterilizacao,
      status: resultado.data.status,
      motivoEntrada: resultado.data.motivoEntrada,
      dataEntrada: `${resultado.data.dataEntrada}T00:00:00`,
      baiaId: resultado.data.baiaId,
      fotoUrl: resultado.data.fotoUrl,
      observacoes: resultado.data.observacoes,
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

      <form onSubmit={handleSubmit} noValidate>
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
                  className={`input${fieldErrors.nome ? ' error' : ''}`}
                  type="text"
                  placeholder="Ex: Rex"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                />
                {fieldErrors.nome ? (
                  <span className="err">{fieldErrors.nome}</span>
                ) : (
                  <span className="hint">Use o nome de chamada do animal. Se desconhecido, use um apelido.</span>
                )}
              </div>

              <div className="field full">
                <label id="especie-label">
                  Espécie <span className="req">*</span>
                </label>
                <div className="radio-cards" role="radiogroup" aria-labelledby="especie-label">
                  {catalogos?.especies.map((item) => (
                    <button
                      key={item.codigo}
                      type="button"
                      role="radio"
                      aria-checked={especie === item.codigo}
                      className={`radio-card${especie === item.codigo ? ' selected' : ''}`}
                      onClick={() => setEspecie(item.codigo)}
                    >
                      <span className="label">{item.nome}</span>
                    </button>
                  ))}
                </div>
                {fieldErrors.especie && <span className="err">{fieldErrors.especie}</span>}
              </div>

              <div className="field">
                <label htmlFor="microchip">Microchip</label>
                <input
                  id="microchip"
                  className={`input mono${fieldErrors.microchip ? ' error' : ''}`}
                  type="text"
                  placeholder="985121234567890"
                  maxLength={15}
                  value={microchip}
                  disabled={microchipTravado}
                  onChange={(event) => setMicrochip(event.target.value)}
                />
                {fieldErrors.microchip ? (
                  <span className="err">{fieldErrors.microchip}</span>
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
                <div className="radio-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }} role="radiogroup" aria-labelledby="sexo-label">
                  {SEXO_OPCOES.map((opcao) => (
                    <button
                      key={opcao.valor}
                      type="button"
                      role="radio"
                      aria-checked={sexo === opcao.valor}
                      className={`radio-card${sexo === opcao.valor ? ' selected' : ''}`}
                      onClick={() => setSexo(opcao.valor)}
                    >
                      <span className="label">{opcao.label}</span>
                    </button>
                  ))}
                </div>
                {fieldErrors.sexo && <span className="err">{fieldErrors.sexo}</span>}
              </div>

              <div className="field">
                <label id="porte-label">Porte</label>
                <div className="radio-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }} role="radiogroup" aria-labelledby="porte-label">
                  {PORTE_OPCOES.map((opcao) => (
                    <button
                      key={opcao.valor}
                      type="button"
                      role="radio"
                      aria-checked={porte === opcao.valor}
                      className={`radio-card${porte === opcao.valor ? ' selected' : ''}`}
                      onClick={() => setPorte(opcao.valor)}
                    >
                      <span className="label">{opcao.label}</span>
                      <span className="sub">{opcao.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label htmlFor="raca">Raça</label>
                <input
                  id="raca"
                  className="input"
                  type="text"
                  placeholder="Ex: SRD, Labrador, Poodle..."
                  value={raca}
                  onChange={(event) => setRaca(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="dataNascimentoAprox">Data provável de nascimento</label>
                <input
                  id="dataNascimentoAprox"
                  className="input"
                  type="date"
                  value={dataNascimentoAprox}
                  onChange={(event) => setDataNascimentoAprox(event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="pelagem">Pelagem</label>
                <select id="pelagem" className="select" value={pelagem} onChange={(event) => setPelagem(event.target.value as Pelagem)}>
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
                  value={coloracao}
                  onChange={(event) => setColoracao(event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="idadeAprox">Idade aproximada</label>
                <input
                  id="idadeAprox"
                  className="input"
                  type="text"
                  placeholder="Ex: 2 anos"
                  value={idadeAprox}
                  onChange={(event) => setIdadeAprox(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="pesoKg">Peso (kg)</label>
                <input
                  id="pesoKg"
                  className={`input${fieldErrors.pesoKg ? ' error' : ''}`}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ex: 12.5"
                  value={pesoKg}
                  onChange={(event) => setPesoKg(event.target.value)}
                />
                {fieldErrors.pesoKg && <span className="err">{fieldErrors.pesoKg}</span>}
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
                <select id="baiaId" className="select" value={baiaId} onChange={(event) => setBaiaId(event.target.value)}>
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
                <select
                  id="status"
                  className={`select${fieldErrors.status ? ' error' : ''}`}
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="" disabled>
                    Selecione…
                  </option>
                  {catalogos?.status.map((item) => (
                    <option key={item.codigo} value={item.codigo}>
                      {item.nome}
                    </option>
                  ))}
                </select>
                {fieldErrors.status && <span className="err">{fieldErrors.status}</span>}
              </div>

              <div className="field">
                <label htmlFor="motivoEntrada">
                  Motivo de entrada <span className="req">*</span>
                </label>
                <select
                  id="motivoEntrada"
                  className={`select${fieldErrors.motivoEntrada ? ' error' : ''}`}
                  value={motivoEntrada}
                  onChange={(event) => setMotivoEntrada(event.target.value)}
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
                {fieldErrors.motivoEntrada && <span className="err">{fieldErrors.motivoEntrada}</span>}
              </div>
              <div className="field">
                <label htmlFor="dataEntrada">
                  Data de entrada <span className="req">*</span>
                </label>
                <input
                  id="dataEntrada"
                  className={`input${fieldErrors.dataEntrada ? ' error' : ''}`}
                  type="date"
                  value={dataEntrada}
                  onChange={(event) => setDataEntrada(event.target.value)}
                />
                {fieldErrors.dataEntrada && <span className="err">{fieldErrors.dataEntrada}</span>}
              </div>

              <div className="field full">
                <label id="castracao-label">Castração</label>
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
                      aria-checked={castracaoOpcao === opcao.valor}
                      className={`radio-card${castracaoOpcao === opcao.valor ? ' selected' : ''}`}
                      onClick={() => setCastracaoOpcao(opcao.valor)}
                    >
                      <span className="label">{opcao.label}</span>
                      <span className="sub">{opcao.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {castracaoOpcao !== 'nao_castrado' && (
                <div className="field">
                  <label htmlFor="dataEsterilizacao">Data da castração</label>
                  <input
                    id="dataEsterilizacao"
                    className="input"
                    type="date"
                    value={dataEsterilizacao}
                    onChange={(event) => setDataEsterilizacao(event.target.value)}
                  />
                </div>
              )}

              <div className="field full">
                <label htmlFor="observacoes">Observações gerais</label>
                <textarea
                  id="observacoes"
                  className="textarea"
                  placeholder="Comportamento, características marcantes, histórico relevante..."
                  value={observacoes}
                  onChange={(event) => setObservacoes(event.target.value)}
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
                {fotoUrl ? (
                  <div className="animal-avatar xl" style={{ margin: '0 auto 12px' }}>
                    <img src={fotoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className="ico">
                    <Icon name="plus" size={24} />
                  </div>
                )}
                <h4>{fotoCarregando ? 'Processando imagem…' : fotoUrl ? 'Trocar foto' : 'Arraste uma foto ou clique para enviar'}</h4>
                <p>JPG ou PNG, até 5MB.</p>
              </label>
              {fotoErro && <span className="err">{fotoErro}</span>}
            </div>

            <div className="fieldset">
              <legend>Revisão dos dados</legend>
              <div className="review-grid">
                <div className="review-row">
                  <span className="k">Nome</span>
                  <span className="v">{nome || '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Espécie</span>
                  <span className="v">{nomeCatalogo(catalogos?.especies, especie)}</span>
                </div>
                <div className="review-row">
                  <span className="k">Microchip</span>
                  <span className="v mono">{microchip || '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Sexo</span>
                  <span className="v">{SEXO_OPCOES.find((opcao) => opcao.valor === sexo)?.label ?? '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Porte</span>
                  <span className="v">{PORTE_OPCOES.find((opcao) => opcao.valor === porte)?.label ?? '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Raça</span>
                  <span className="v">{raca || '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Nasc. aprox.</span>
                  <span className="v">{formatarDataBr(dataNascimentoAprox)}</span>
                </div>
                <div className="review-row">
                  <span className="k">Pelagem · Cor</span>
                  <span className="v">
                    {PELAGEM_OPCOES.find((opcao) => opcao.valor === pelagem)?.label ?? '—'} · {coloracao || '—'}
                  </span>
                </div>
                <div className="review-row">
                  <span className="k">Motivo de entrada</span>
                  <span className="v">{nomeCatalogo(catalogos?.motivosEntrada, motivoEntrada)}</span>
                </div>
                <div className="review-row">
                  <span className="k">Baia</span>
                  <span className="v">{baias?.find((baia) => baia.id === baiaId)?.nome ?? '—'}</span>
                </div>
                <div className="review-row">
                  <span className="k">Status</span>
                  <span className="v">{nomeCatalogo(catalogos?.status, status)}</span>
                </div>
                <div className="review-row">
                  <span className="k">Castração</span>
                  <span className="v">{CASTRACAO_OPCOES.find((opcao) => opcao.valor === castracaoOpcao)?.label}</span>
                </div>
                <div className="review-row" style={{ gridColumn: '1 / -1' }}>
                  <span className="k">Observações</span>
                  <span className="v">{observacoes || '—'}</span>
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
