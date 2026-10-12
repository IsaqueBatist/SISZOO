import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/layout/Icon'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'
import { AnexoInvalidoError, MAXIMO_ANEXOS, validarAnexo } from '../utils/anexoOcorrencia'
import './OcorrenciaForm.css'
import { ocorrenciaFormSchema, TIPOS_OCORRENCIA_VALORES, type OcorrenciaFormValues } from '../schemas/ocorrenciaFormSchema'
import type {
  AtualizarOcorrenciaRequest,
  CriarOcorrenciaRequest,
  DenunciadoRequest,
  DenuncianteRequest,
  Ocorrencia,
} from '../types/ocorrencias.types'
import {
  agendarSalvarRascunhoOcorrencia,
  cancelarRascunhoAgendadoOcorrencia,
  chaveRascunhoOcorrencia,
  carregarRascunhoOcorrencia,
  removerRascunhoOcorrencia,
  salvarRascunhoOcorrencia,
} from '../storage/rascunhoOcorrenciaStorage'
import { iconeDeTipo, labelDeTipo } from '../utils/statusBadge'
import { formatarHora, hojeIso } from '../utils/datas'
import { formatarProtocoloOcorrencia } from '../utils/protocolo'
import { useAtualizarOcorrenciaMutation, useCriarOcorrenciaMutation } from '../hooks/useOcorrencias'
import { useAnexosPendentes } from '../hooks/useAnexosPendentes'
import { AvisoAnexosPendentes } from './AvisoAnexosPendentes'

const DENUNCIANTE_VAZIO = { nome: '', cpf: '', telefone: '', email: '', cep: '', endereco: '', bairroResidencial: '' }

function valoresVazios(): OcorrenciaFormValues {
  return {
    tipoOcorrencia: 'zoonose',
    dataAbertura: hojeIso(),
    horaAbertura: '',
    endereco: '',
    bairro: '',
    pontoReferencia: '',
    descricao: '',
    urgente: false,
    sigilosa: false,
    anonima: false,
    denunciante: { ...DENUNCIANTE_VAZIO },
    denunciadoAtivo: false,
    denunciado: { nome: '', cpf: '', telefone: '', endereco: '', observacoes: '' },
    anexos: [],
  }
}

// Edição: valores iniciais a partir da ocorrência devolvida pelo backend.
// Denunciante mascarado (sigilosa sem permissão) entra vazio e não é editável
// nem enviado — os null da máscara apagariam os dados reais (D10).
function valoresDaOcorrencia(ocorrencia: Ocorrencia, mascarado: boolean): OcorrenciaFormValues {
  const denunciante = ocorrencia.denunciante
  const denunciado = ocorrencia.denunciado
  return {
    tipoOcorrencia: ocorrencia.tipoOcorrencia,
    dataAbertura: ocorrencia.dataAbertura,
    horaAbertura: ocorrencia.horaAbertura ? formatarHora(ocorrencia.horaAbertura) : '',
    endereco: ocorrencia.endereco,
    bairro: ocorrencia.bairro,
    pontoReferencia: ocorrencia.pontoReferencia ?? '',
    descricao: ocorrencia.descricao,
    urgente: ocorrencia.urgente,
    sigilosa: ocorrencia.sigilosa,
    anonima: ocorrencia.anonima,
    denunciante:
      mascarado || !denunciante
        ? { ...DENUNCIANTE_VAZIO }
        : {
            nome: denunciante.nome ?? '',
            cpf: denunciante.cpf ?? '',
            telefone: denunciante.telefone ?? '',
            email: denunciante.email ?? '',
            cep: denunciante.cep ?? '',
            endereco: denunciante.endereco ?? '',
            bairroResidencial: denunciante.bairroResidencial ?? '',
          },
    denunciadoAtivo: denunciado !== null,
    denunciado: {
      nome: denunciado?.nome ?? '',
      cpf: denunciado?.cpf ?? '',
      telefone: denunciado?.telefone ?? '',
      endereco: denunciado?.endereco ?? '',
      observacoes: denunciado?.observacoes ?? '',
    },
    anexos: [],
  }
}

// Monta o payload real a partir dos valores do form — strings vazias viram
// `undefined` (campo opcional ausente), nunca enviadas como "". Anexos não
// vão no JSON: cada arquivo é um POST multipart depois do cadastro (D15).
// Anônima nunca manda o bloco (D32); sigilosa sem nenhum dado também não.
function paraDenuncianteRequest(valores: OcorrenciaFormValues): DenuncianteRequest | undefined {
  if (valores.anonima) return undefined
  const bloco: DenuncianteRequest = {
    nome: valores.denunciante.nome || undefined,
    cpf: valores.denunciante.cpf || undefined,
    telefone: valores.denunciante.telefone || undefined,
    email: valores.denunciante.email || undefined,
    cep: valores.denunciante.cep || undefined,
    endereco: valores.denunciante.endereco || undefined,
    bairroResidencial: valores.denunciante.bairroResidencial || undefined,
  }
  return Object.values(bloco).some((valor) => valor !== undefined) ? bloco : undefined
}

function paraDenunciadoRequest(valores: OcorrenciaFormValues): DenunciadoRequest {
  return {
    nome: valores.denunciado.nome || undefined,
    cpf: valores.denunciado.cpf || undefined,
    telefone: valores.denunciado.telefone || undefined,
    endereco: valores.denunciado.endereco || undefined,
    observacoes: valores.denunciado.observacoes || undefined,
  }
}

function paraRequisicao(valores: OcorrenciaFormValues): CriarOcorrenciaRequest {
  return {
    tipoOcorrencia: valores.tipoOcorrencia as CriarOcorrenciaRequest['tipoOcorrencia'],
    dataAbertura: valores.dataAbertura,
    horaAbertura: valores.horaAbertura || undefined,
    endereco: valores.endereco,
    bairro: valores.bairro,
    pontoReferencia: valores.pontoReferencia || undefined,
    descricao: valores.descricao,
    urgente: valores.urgente,
    sigilosa: valores.sigilosa,
    anonima: valores.anonima,
    denunciante: paraDenuncianteRequest(valores),
    denunciado: valores.denunciadoAtivo ? paraDenunciadoRequest(valores) : undefined,
  }
}

// PUT (D10): as flags vão sempre; cada bloco só quando o usuário mexeu nele
// (ausente = sem alteração; presente = substitui o bloco inteiro). Desligar
// "existe denunciado" manda o bloco vazio, que limpa os dados. Identificar
// uma anônima manda `anonima: false` junto com o bloco do denunciante.
function paraAtualizacao(
  valores: OcorrenciaFormValues,
  original: Ocorrencia,
  alterados: { denunciante: boolean; denunciado: boolean },
  mascarado: boolean,
): AtualizarOcorrenciaRequest {
  const identificando = original.anonima && !valores.anonima
  const enviaDenunciante = !mascarado && !valores.anonima && (identificando || alterados.denunciante)
  return {
    ...paraRequisicao(valores),
    denunciante: enviaDenunciante ? (paraDenuncianteRequest(valores) ?? {}) : undefined,
    denunciado: alterados.denunciado ? (valores.denunciadoAtivo ? paraDenunciadoRequest(valores) : {}) : undefined,
  }
}

// LGPD: máquinas do CCZ podem ser compartilhadas. Se a ocorrência é
// sigilosa (ou anônima), os dados do denunciante não são persistidos no
// IndexedDB — ao restaurar o rascunho, o usuário precisa redigitá-los.
function paraRascunho(valores: OcorrenciaFormValues): OcorrenciaFormValues {
  if (!valores.sigilosa && !valores.anonima) return valores
  return { ...valores, denunciante: { ...DENUNCIANTE_VAZIO } }
}

interface OcorrenciaFormProps {
  // Presente = modo edição (/ocorrencias/:id/editar); ausente = cadastro.
  ocorrencia?: Ocorrencia
}

export function OcorrenciaForm({ ocorrencia }: OcorrenciaFormProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const emEdicao = ocorrencia !== undefined
  const mascarado = emEdicao && ocorrencia.sigilosa && !ocorrencia.podeVerDenunciante
  const chaveRascunho = chaveRascunhoOcorrencia(ocorrencia?.id)
  const mutation = useCriarOcorrenciaMutation()
  const mutationAtualizar = useAtualizarOcorrenciaMutation(ocorrencia?.id ?? '')
  const anexosPendentes = useAnexosPendentes()
  // Suspende o autosave depois do POST: limpar o form não pode recriar o
  // rascunho de uma ocorrência que já existe no backend.
  const autosaveSuspenso = useRef(false)

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [anexoErro, setAnexoErro] = useState<string | null>(null)
  const [rascunhoDisponivel, setRascunhoDisponivel] = useState<OcorrenciaFormValues | null>(null)
  const [rascunhoMensagem, setRascunhoMensagem] = useState<string | null>(null)
  const [prontoParaAutoSalvar, setProntoParaAutoSalvar] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    getValues,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<OcorrenciaFormValues>({
    resolver: zodResolver(ocorrenciaFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: ocorrencia ? valoresDaOcorrencia(ocorrencia, mascarado) : valoresVazios(),
  })

  const valores = watch()

  useEffect(() => {
    let cancelado = false
    carregarRascunhoOcorrencia<OcorrenciaFormValues>(chaveRascunho).then((valoresSalvos) => {
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
    // callback (mesma decisão de AnimalForm.tsx) — senão um stale closure
    // pode sobrescrever um rascunho real com um objeto vazio antes da
    // hidratação terminar.
    if (!prontoParaAutoSalvar) return
    const inscricao = watch((valoresAtuais) => {
      if (autosaveSuspenso.current) return
      agendarSalvarRascunhoOcorrencia(paraRascunho(valoresAtuais as OcorrenciaFormValues), chaveRascunho)
    })
    return () => inscricao.unsubscribe()
  }, [prontoParaAutoSalvar, watch, chaveRascunho])

  // keepDefaultValues: na edição, "alterado" continua sendo em relação à
  // ocorrência original, não ao rascunho restaurado.
  function handleRestaurarRascunho() {
    if (rascunhoDisponivel) reset(rascunhoDisponivel, { keepDefaultValues: true })
    setRascunhoDisponivel(null)
  }

  async function handleDescartarRascunho() {
    setRascunhoDisponivel(null)
    await removerRascunhoOcorrencia(chaveRascunho)
  }

  async function handleSalvarRascunhoAgora() {
    await salvarRascunhoOcorrencia(paraRascunho(getValues()), chaveRascunho)
    setRascunhoMensagem('Rascunho salvo.')
    setTimeout(() => setRascunhoMensagem(null), 3000)
  }

  function handleArquivosAnexo(event: ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (arquivos.length === 0) return

    setAnexoErro(null)
    const atuais = getValues('anexos')
    if (atuais.length + arquivos.length > MAXIMO_ANEXOS) {
      setAnexoErro(`Máximo de ${MAXIMO_ANEXOS} anexos.`)
      return
    }

    try {
      arquivos.forEach(validarAnexo)
    } catch (erro) {
      setAnexoErro(erro instanceof AnexoInvalidoError ? erro.message : 'Não foi possível adicionar o anexo.')
      return
    }

    setValue('anexos', [...atuais, ...arquivos], { shouldDirty: true })
  }

  function removerAnexo(indice: number) {
    const atuais = getValues('anexos')
    setValue(
      'anexos',
      atuais.filter((_, i) => i !== indice),
      { shouldDirty: true },
    )
  }

  // D15, fase 1: um único POST /ocorrencias. Daqui em diante a ocorrência
  // existe; o rascunho do form sai e só os anexos ficam pendentes (fase 2).
  async function onSubmit(dados: OcorrenciaFormValues) {
    if (ocorrencia) {
      await salvarEdicao(dados, ocorrencia)
      return
    }
    let nova
    try {
      nova = await mutation.mutateAsync(paraRequisicao(dados))
    } catch (erro) {
      setSubmitError(mensagemDeRegraDaApi(erro) ?? 'Não foi possível registrar a ocorrência. Tente novamente.')
      return
    }

    autosaveSuspenso.current = true
    cancelarRascunhoAgendadoOcorrencia()
    await removerRascunhoOcorrencia()

    if (dados.anexos.length === 0) {
      navigate(`/ocorrencias/${nova.id}`)
      return
    }
    const todosEnviados = await anexosPendentes.enviar({ ocorrenciaId: nova.id, protocolo: nova.protocolo, anexos: dados.anexos })
    if (todosEnviados) {
      navigate(`/ocorrencias/${nova.id}`)
      return
    }
    // Ficou anexo pendente: o form é limpo para que a mesma ocorrência não
    // seja registrada de novo; o aviso acima oferece Reenviar/Descartar.
    reset(valoresVazios())
    autosaveSuspenso.current = false
  }

  async function salvarEdicao(dados: OcorrenciaFormValues, original: Ocorrencia) {
    const alterados = {
      denunciante: Object.values(dirtyFields.denunciante ?? {}).some(Boolean),
      denunciado: Boolean(dirtyFields.denunciadoAtivo) || Object.values(dirtyFields.denunciado ?? {}).some(Boolean),
    }
    try {
      await mutationAtualizar.mutateAsync(paraAtualizacao(dados, original, alterados, mascarado))
    } catch (erro) {
      setSubmitError(
        statusHttpDoErro(erro) === 403
          ? 'Seu perfil não pode fazer esta alteração.'
          : (mensagemDeRegraDaApi(erro) ?? 'Não foi possível salvar as alterações. Tente novamente.'),
      )
      return
    }
    autosaveSuspenso.current = true
    cancelarRascunhoAgendadoOcorrencia()
    await removerRascunhoOcorrencia(chaveRascunho)
    navigate(`/ocorrencias/${original.id}`)
  }

  // D32: só o caminho anônima -> identificada existe na interface.
  function handleIdentificarDenunciante() {
    setValue('anonima', false, { shouldDirty: true })
  }

  async function handleReenviarAnexos() {
    const pendencia = anexosPendentes.pendencia
    if (!pendencia) return
    if (await anexosPendentes.enviar(pendencia)) navigate(`/ocorrencias/${pendencia.ocorrenciaId}`)
  }

  function handleAnonimaChange(marcada: boolean, onChange: (valor: boolean) => void) {
    onChange(marcada)
    if (marcada) {
      setValue('sigilosa', false)
      setValue('denunciante', { ...DENUNCIANTE_VAZIO })
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  return (
    <div className="form-shell">
      <div className="page-header">
        <div className="title-block">
          <Link
            to={ocorrencia ? `/ocorrencias/${ocorrencia.id}` : '/ocorrencias'}
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: 'flex-start' }}
          >
            ← Voltar
          </Link>
          {ocorrencia ? (
            <>
              <h1>Editar Ocorrência</h1>
              <p className="subtitle">
                <span className="mono">{formatarProtocoloOcorrencia(ocorrencia.protocolo)}</span> · registrada por{' '}
                {ocorrencia.registradoPorNome}
              </p>
            </>
          ) : (
            <>
              <h1>Registrar Ocorrência</h1>
              <p className="subtitle">
                Protocolo será gerado automaticamente ao registrar, registrada por {user?.nome} {user?.sobrenome}.
              </p>
            </>
          )}
        </div>
      </div>

      {!emEdicao && anexosPendentes.pendencia && (
        <AvisoAnexosPendentes
          pendencia={anexosPendentes.pendencia}
          falhas={anexosPendentes.falhas}
          enviando={anexosPendentes.enviando}
          onReenviar={() => void handleReenviarAnexos()}
          onDescartar={() => void anexosPendentes.descartar()}
        />
      )}

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

      {submitError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">{submitError}</div>
        </div>
      )}

      <form onSubmit={aoEnviar} noValidate>
        <div className="col gap-4">
          <div className="card">
            <div className="card-header">
              <h3>1. Tipo de Ocorrência</h3>
            </div>
            <div className="card-body">
              <Controller
                name="tipoOcorrencia"
                control={control}
                render={({ field }) => (
                  <div className="radio-cards" role="radiogroup" aria-label="Tipo de ocorrência">
                    {TIPOS_OCORRENCIA_VALORES.map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        role="radio"
                        aria-checked={field.value === tipo}
                        className={`radio-card${field.value === tipo ? ' selected' : ''}`}
                        onClick={() => field.onChange(tipo)}
                      >
                        <span className="ico">
                          <Icon name={iconeDeTipo(tipo)} size={18} />
                        </span>
                        <span className="label">{labelDeTipo(tipo)}</span>
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.tipoOcorrencia && <span className="err">{errors.tipoOcorrencia.message}</span>}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>2. Dados da Ocorrência</h3>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="oc-data">
                    Data de abertura <span className="req">*</span>
                  </label>
                  <input id="oc-data" className={`input${errors.dataAbertura ? ' error' : ''}`} type="date" {...register('dataAbertura')} />
                  {errors.dataAbertura && <span className="err">{errors.dataAbertura.message}</span>}
                </div>
                <div className="field">
                  <label htmlFor="oc-hora">Hora aproximada</label>
                  <input id="oc-hora" className="input" type="time" {...register('horaAbertura')} />
                </div>
                <div className="field full">
                  <label htmlFor="oc-endereco">
                    Endereço da ocorrência <span className="req">*</span>
                  </label>
                  <input
                    id="oc-endereco"
                    className={`input${errors.endereco ? ' error' : ''}`}
                    type="text"
                    placeholder="Logradouro, número, complemento"
                    {...register('endereco')}
                  />
                  {errors.endereco && <span className="err">{errors.endereco.message}</span>}
                </div>
                <div className="field">
                  <label htmlFor="oc-bairro">
                    Bairro <span className="req">*</span>
                  </label>
                  <input
                    id="oc-bairro"
                    className={`input${errors.bairro ? ' error' : ''}`}
                    type="text"
                    placeholder="Ex: Vila Esperança"
                    {...register('bairro')}
                  />
                  {errors.bairro && <span className="err">{errors.bairro.message}</span>}
                </div>
                <div className="field">
                  <label htmlFor="oc-ponto-referencia">Ponto de referência</label>
                  <input
                    id="oc-ponto-referencia"
                    className="input"
                    type="text"
                    placeholder="Ex: próximo à escola municipal"
                    {...register('pontoReferencia')}
                  />
                </div>
                <div className="field full">
                  <label htmlFor="oc-descricao">
                    Descrição da ocorrência <span className="req">*</span>
                  </label>
                  <textarea
                    id="oc-descricao"
                    className={`textarea${errors.descricao ? ' error' : ''}`}
                    placeholder="Descreva os fatos relatados pelo denunciante com clareza..."
                    {...register('descricao')}
                  />
                  {errors.descricao && <span className="err">{errors.descricao.message}</span>}
                </div>
                <div className="field full">
                  <label className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" {...register('urgente')} />
                    Urgente (contato humano-animal)
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>3. Dados do Denunciante</h3>
              <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                <div className="switch-row">
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Ocorrência sigilosa</span>
                  <Controller
                    name="sigilosa"
                    control={control}
                    render={({ field }) => (
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={field.value}
                          disabled={valores.anonima || (emEdicao && !ocorrencia.podeVerDenunciante)}
                          onChange={(event) => field.onChange(event.target.checked)}
                          aria-label="Ocorrência sigilosa"
                        />
                        <span className="slider" />
                      </label>
                    )}
                  />
                </div>
                {!emEdicao && (
                  <div className="switch-row">
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Denunciante anônimo</span>
                    <Controller
                      name="anonima"
                      control={control}
                      render={({ field }) => (
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={field.value}
                            disabled={valores.sigilosa}
                            onChange={(event) => handleAnonimaChange(event.target.checked, field.onChange)}
                            aria-label="Denunciante anônimo"
                          />
                          <span className="slider" />
                        </label>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="card-body">
              {errors.anonima && (
                <span className="err" style={{ display: 'block', marginBottom: 12 }}>
                  {errors.anonima.message}
                </span>
              )}
              {valores.sigilosa && (
                <div className="alert warning" role="alert" style={{ marginBottom: 12 }}>
                  <span className="bullet" />
                  <div className="alert-content">
                    Os dados do denunciante só serão exibidos a Administradores e Agentes Sanitários.
                  </div>
                </div>
              )}
              {mascarado ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Sigiloso: os dados do denunciante só podem ser vistos e alterados por Administradores e Agentes
                  Sanitários.
                </p>
              ) : valores.anonima ? (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    Denúncia anônima: nenhum dado do denunciante é registrado.
                  </p>
                  {emEdicao && ocorrencia.podeVerDenunciante && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: 8 }}
                      onClick={handleIdentificarDenunciante}
                    >
                      Identificar denunciante
                    </button>
                  )}
                </div>
              ) : (
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="den-nome">
                      Nome completo {!valores.sigilosa && <span className="req">*</span>}
                    </label>
                    <input
                      id="den-nome"
                      className={`input${errors.denunciante?.nome ? ' error' : ''}`}
                      type="text"
                      {...register('denunciante.nome')}
                    />
                    {errors.denunciante?.nome && <span className="err">{errors.denunciante.nome.message}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="den-cpf">CPF</label>
                    <input id="den-cpf" className="input mono" type="text" placeholder="000.000.000-00" {...register('denunciante.cpf')} />
                  </div>
                  <div className="field">
                    <label htmlFor="den-telefone">Telefone</label>
                    <input
                      id="den-telefone"
                      className="input mono"
                      type="text"
                      placeholder="(11) 9 0000-0000"
                      {...register('denunciante.telefone')}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="den-email">E-mail</label>
                    <input id="den-email" className="input" type="email" placeholder="exemplo@email.com" {...register('denunciante.email')} />
                  </div>
                  <div className="field">
                    <label htmlFor="den-cep">CEP</label>
                    <input id="den-cep" className="input mono" type="text" placeholder="00000-000" {...register('denunciante.cep')} />
                  </div>
                  <div className="field">
                    <label htmlFor="den-endereco">Endereço residencial</label>
                    <input id="den-endereco" className="input" type="text" placeholder="Logradouro, número" {...register('denunciante.endereco')} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>4. Existe Denunciado?</h3>
              <div className="switch-row">
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Sim, há um responsável identificado</span>
                <Controller
                  name="denunciadoAtivo"
                  control={control}
                  render={({ field }) => (
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        aria-label="Existe denunciado identificado"
                      />
                      <span className="slider" />
                    </label>
                  )}
                />
              </div>
            </div>
            <div className="card-body">
              {valores.denunciadoAtivo ? (
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="dcd-nome">Nome</label>
                    <input id="dcd-nome" className="input" type="text" {...register('denunciado.nome')} />
                  </div>
                  <div className="field">
                    <label htmlFor="dcd-cpf">CPF</label>
                    <input id="dcd-cpf" className="input mono" type="text" placeholder="000.000.000-00" {...register('denunciado.cpf')} />
                  </div>
                  <div className="field full">
                    <label htmlFor="dcd-endereco">Endereço</label>
                    <input
                      id="dcd-endereco"
                      className="input"
                      type="text"
                      placeholder="Logradouro, número, bairro"
                      {...register('denunciado.endereco')}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="dcd-telefone">Telefone</label>
                    <input
                      id="dcd-telefone"
                      className="input mono"
                      type="text"
                      placeholder="(11) 9 0000-0000"
                      {...register('denunciado.telefone')}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="dcd-observacoes">Observações</label>
                    <input id="dcd-observacoes" className="input" type="text" {...register('denunciado.observacoes')} />
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Ative o seletor acima para informar dados do denunciado.
                </p>
              )}
            </div>
          </div>

          {!emEdicao && (
            <div className="card">
              <div className="card-header">
                <h3>5. Anexos</h3>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {anexoErro && (
                  <div className="alert danger" role="alert">
                    <span className="bullet" />
                    <div className="alert-content">{anexoErro}</div>
                  </div>
                )}
                {valores.anexos.length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Nenhum anexo adicionado.</p>
                )}
                {valores.anexos.map((arquivo, indice) => (
                  <div
                    key={`${arquivo.name}-${arquivo.size}-${indice}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                  >
                    <Icon name="clipboard" size={16} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{arquivo.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {(arquivo.size / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon-only"
                      aria-label={`Remover ${arquivo.name}`}
                      onClick={() => removerAnexo(indice)}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}
                {valores.anexos.length < MAXIMO_ANEXOS && (
                  <label className="btn btn-outline btn-sm" style={{ width: 'fit-content', cursor: 'pointer' }}>
                    <Icon name="plus" size={14} />
                    Adicionar anexo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      multiple
                      onChange={handleArquivosAnexo}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          <div
            className="card"
            style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
          >
            {rascunhoMensagem && <span className="hint">{rascunhoMensagem}</span>}
            <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
              <Link to={ocorrencia ? `/ocorrencias/${ocorrencia.id}` : '/ocorrencias'} className="btn btn-ghost">
                Cancelar
              </Link>
              <button type="button" className="btn btn-outline" onClick={handleSalvarRascunhoAgora}>
                Salvar rascunho
              </button>
              {emEdicao ? (
                <button type="submit" className="btn btn-primary" disabled={mutationAtualizar.isPending}>
                  {mutationAtualizar.isPending ? 'Salvando…' : 'Salvar alterações'}
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={mutation.isPending || anexosPendentes.enviando || anexosPendentes.pendencia !== null}
                  title={anexosPendentes.pendencia ? 'Resolva os anexos pendentes antes de registrar outra ocorrência' : undefined}
                >
                  {mutation.isPending ? 'Registrando…' : 'Registrar Ocorrência'}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
