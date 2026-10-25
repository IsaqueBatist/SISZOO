import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { BannerRascunho } from '@/components/BannerRascunho'
import { RadioCards } from '@/components/RadioCards'
import { Icon } from '@/components/layout/Icon'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'
import { AnexoInvalidoError, MAXIMO_ANEXOS, validarAnexo } from '../utils/anexoOcorrencia'
import './OcorrenciaForm.css'
import { ocorrenciaFormSchema, TIPOS_OCORRENCIA_VALORES, type OcorrenciaFormValues } from '../schemas/ocorrenciaFormSchema'
import type { Ocorrencia } from '../types/ocorrencias.types'
import { chaveRascunhoOcorrencia } from '../storage/rascunhoOcorrenciaStorage'
import { iconeDeTipo, labelDeTipo } from '../utils/statusBadge'
import { paraAtualizacao, paraRequisicao, valoresDaOcorrencia, valoresVazios } from '../utils/ocorrenciaFormMapeamento'
import { formatarProtocoloOcorrencia } from '../utils/protocolo'
import { useAtualizarOcorrenciaMutation, useCriarOcorrenciaMutation } from '../hooks/useOcorrencias'
import { useAnexosPendentes } from '../hooks/useAnexosPendentes'
import { useRascunhoOcorrencia } from '../hooks/useRascunhoOcorrencia'
import { AnexosOcorrenciaForm } from './AnexosOcorrenciaForm'
import { AvisoAnexosPendentes } from './AvisoAnexosPendentes'
import { SecaoDadosOcorrencia } from './SecaoDadosOcorrencia'
import { SecaoDenunciado } from './SecaoDenunciado'
import { SecaoDenunciante } from './SecaoDenunciante'

interface OcorrenciaFormProps {
  // Presente = modo edição (/ocorrencias/:id/editar); ausente = cadastro.
  ocorrencia?: Ocorrencia
}

// Cadastro e edição de ocorrência: o envio (POST com anexos em duas fases,
// D15; PUT por blocos, D10) e o rascunho. Cada card do formulário é uma seção
// que lê o formulário pelo FormProvider.
export function OcorrenciaForm({ ocorrencia }: OcorrenciaFormProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const emEdicao = ocorrencia !== undefined
  const mascarado = emEdicao && ocorrencia.sigilosa && !ocorrencia.podeVerDenunciante
  const mutation = useCriarOcorrenciaMutation()
  const mutationAtualizar = useAtualizarOcorrenciaMutation(ocorrencia?.id ?? '')
  const anexosPendentes = useAnexosPendentes()

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [anexoErro, setAnexoErro] = useState<string | null>(null)

  const formulario = useForm<OcorrenciaFormValues>({
    resolver: zodResolver(ocorrenciaFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: ocorrencia ? valoresDaOcorrencia(ocorrencia, mascarado) : valoresVazios(),
  })
  const {
    control,
    handleSubmit,
    watch,
    reset,
    getValues,
    setValue,
    formState: { errors, dirtyFields },
  } = formulario

  const anexos = watch('anexos')

  const rascunho = useRascunhoOcorrencia({
    chave: chaveRascunhoOcorrencia(user?.id ?? '', ocorrencia?.id),
    usuarioId: user?.id ?? '',
    watch,
    reset,
    getValues,
  })

  async function handleArquivosAnexo(event: ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (arquivos.length === 0) return

    setAnexoErro(null)
    rascunho.limparAvisoAnexo()
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
    await rascunho.guardarAnexos(arquivos)
  }

  async function removerAnexo(indice: number) {
    const atuais = getValues('anexos')
    const removido = atuais[indice]
    setValue(
      'anexos',
      atuais.filter((_, i) => i !== indice),
      { shouldDirty: true },
    )
    await rascunho.removerAnexoGuardado(removido)
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

    await rascunho.encerrarAposEnvio()

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
    rascunho.retomarAutosave()
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
    await rascunho.encerrarAposEnvio()
    navigate(`/ocorrencias/${original.id}`)
  }

  async function handleReenviarAnexos() {
    const pendencia = anexosPendentes.pendencia
    if (!pendencia) return
    if (await anexosPendentes.enviar(pendencia)) navigate(`/ocorrencias/${pendencia.ocorrenciaId}`)
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
          reenvioInutil={anexosPendentes.reenvioInutil}
          enviando={anexosPendentes.enviando}
          onReenviar={() => void handleReenviarAnexos()}
          onDescartar={() => void anexosPendentes.descartar()}
        />
      )}

      {rascunho.rascunhoDisponivel && (
        <BannerRascunho
          onRestaurar={() => void rascunho.restaurar()}
          onDescartar={() => void rascunho.descartar()}
          salvoEm={rascunho.rascunhoSalvoEm}
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
                    <RadioCards
                      opcoes={TIPOS_OCORRENCIA_VALORES.map((tipo) => ({
                        valor: tipo,
                        label: labelDeTipo(tipo),
                        icone: <Icon name={iconeDeTipo(tipo)} size={18} />,
                      }))}
                      valor={field.value}
                      onChange={field.onChange}
                      aria-label="Tipo de ocorrência"
                    />
                  )}
                />
                {errors.tipoOcorrencia && <span className="err">{errors.tipoOcorrencia.message}</span>}
              </div>
            </div>

            <SecaoDadosOcorrencia />

            <SecaoDenunciante
              mascarado={mascarado}
              podeAlterarSigilo={!emEdicao || ocorrencia.podeVerDenunciante}
              mostrarAnonimo={!emEdicao}
              podeIdentificar={emEdicao && ocorrencia.podeVerDenunciante}
              onSigilosaMarcada={() => void rascunho.esquecerAnexosGuardados()}
            />

            <SecaoDenunciado />

            {!emEdicao && (
              <AnexosOcorrenciaForm
                anexos={anexos}
                erro={anexoErro}
                aviso={rascunho.avisoAnexo}
                onAdicionar={(event) => void handleArquivosAnexo(event)}
                onRemover={(indice) => void removerAnexo(indice)}
              />
            )}

            <div
              className="card"
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
            >
              {rascunho.mensagem && <span className="hint">{rascunho.mensagem}</span>}
              <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
                <Link to={ocorrencia ? `/ocorrencias/${ocorrencia.id}` : '/ocorrencias'} className="btn btn-ghost">
                  Cancelar
                </Link>
                <button type="button" className="btn btn-outline" onClick={() => void rascunho.salvarAgora()}>
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
      </FormProvider>
    </div>
  )
}
