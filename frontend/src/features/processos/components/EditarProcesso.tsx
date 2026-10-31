import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, type Control, type Resolver, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertaErroEnvio } from '@/components/AlertaErroEnvio'
import { avisar } from '@/lib/avisos'
import { aplicarErrosDeCampo, mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'
import { useCatalogosAnimaisQuery } from '@/features/animais/hooks/useAnimais'
import { formatarProtocoloProcesso } from '@/features/ocorrencias/utils/protocolo'
import { useCatalogosProcessoQuery, useEditarProcessoMutation, useProcessoQuery } from '../hooks/useProcessos'
import { processoEdicaoSchema, type ProcessoEdicaoValues } from '../schemas/processoEdicaoSchema'
import type { ProcessoFormValues } from '../schemas/processoFormSchema'
import type { Processo } from '../types/processos.types'
import { paraEdicao, valoresDeProcesso } from '../utils/processoFormMapeamento'
import { AmostraAnimalCard, type AmostraErros } from './AmostraAnimalCard'
import { CamposDadosProcesso } from './CamposDadosProcesso'
import { CamposResponsavel } from './CamposResponsavel'
import './ProcessoForm.css'

function FormularioEdicao({ processo }: { processo: Processo }) {
  const navigate = useNavigate()
  const editar = useEditarProcessoMutation(processo.id)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const formulario = useForm<ProcessoEdicaoValues>({
    resolver: zodResolver(processoEdicaoSchema) as unknown as Resolver<ProcessoEdicaoValues>,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: valoresDeProcesso(processo),
  })
  const {
    register,
    control,
    setValue,
    watch,
    setError,
    handleSubmit,
    formState: { errors },
  } = formulario
  const amostras = watch('amostras')
  const voltar = `/processos/${processo.id}`

  async function salvar(valores: ProcessoEdicaoValues) {
    try {
      await editar.mutateAsync(paraEdicao(valores, processo))
      avisar('Alterações salvas e registradas no histórico do processo.')
      navigate(voltar)
    } catch (erro) {
      const campos = aplicarErrosDeCampo(erro, setError)
      if (campos.length === 0) {
        setErroEnvio(mensagemDeRegraDaApi(erro) ?? 'Não foi possível salvar as alterações. Nada foi mudado. Tente novamente.')
      }
    }
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    setErroEnvio(null)
    void handleSubmit(salvar)(evento)
  }

  return (
    <FormProvider {...formulario}>
      <form onSubmit={aoEnviar} noValidate className="col gap-4">
        <AlertaErroEnvio mensagem={erroEnvio} />

        <div className="card">
          <div className="card-header">
            <h3>Dados do processo</h3>
          </div>
          <div className="card-body">
            <CamposDadosProcesso edicao={{ doencaBloqueada: processo.resultado !== null }} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Responsável</h3>
          </div>
          <div className="card-body">
            <CamposResponsavel />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Amostras</h3>
          </div>
          <div className="card-body col gap-3">
            {amostras.map((_amostra, index) => (
              <AmostraAnimalCard
                key={processo.amostras[index].id}
                index={index}
                numero={index + 1}
                control={control as unknown as Control<ProcessoFormValues>}
                register={register as unknown as UseFormRegister<ProcessoFormValues>}
                setValue={setValue as unknown as UseFormSetValue<ProcessoFormValues>}
                watch={watch as unknown as UseFormWatch<ProcessoFormValues>}
                erros={errors.amostras?.[index] as AmostraErros | undefined}
                podeRemover={false}
                onRemover={() => undefined}
                identificacaoFixa
              />
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Motivo da alteração</h3>
          </div>
          <div className="card-body">
            <div className="field">
              <label htmlFor="edicao-justificativa">
                Por que este processo está sendo alterado? <span className="req">*</span>
              </label>
              <textarea
                id="edicao-justificativa"
                className={`textarea${errors.justificativa ? ' error' : ''}`}
                aria-invalid={errors.justificativa ? true : undefined}
                aria-describedby={errors.justificativa ? 'edicao-justificativa-erro' : 'edicao-justificativa-dica'}
                maxLength={1000}
                {...register('justificativa')}
              />
              {errors.justificativa ? (
                <span className="err" id="edicao-justificativa-erro">{errors.justificativa.message}</span>
              ) : (
                <span className="hint" id="edicao-justificativa-dica">
                  O motivo, os dados anteriores e os novos ficam no histórico do processo e não podem ser apagados.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
          <Link to={voltar} className="btn btn-ghost">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={editar.isPending}>
            {editar.isPending ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </FormProvider>
  )
}

// Rota só para o Administrador (RotaAdmin); o backend exige a autoridade própria.
export function EditarProcesso() {
  const { id } = useParams<{ id: string }>()
  const { data: processo, isLoading, isError, error } = useProcessoQuery(id)
  const catalogosProcesso = useCatalogosProcessoQuery()
  const catalogosAnimais = useCatalogosAnimaisQuery()

  // O formulário só monta com os catálogos: um select sem a opção do valor salvo
  // mostraria outro dado (a primeira opção) como se fosse o do processo.
  if (isLoading || catalogosProcesso.isLoading || catalogosAnimais.isLoading) return <p>Carregando processo…</p>

  if (isError || !processo) {
    const naoEncontrado = statusHttpDoErro(error) === 404
    return (
      <div className="alert danger" role="alert">
        <span className="bullet" />
        <div className="alert-content">
          {naoEncontrado ? 'Processo sanitário não encontrado.' : 'Não foi possível carregar este processo sanitário. Tente novamente.'}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <Link to={`/processos/${processo.id}`} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
            ← Voltar para o processo
          </Link>
          <h1>Editar processo {formatarProtocoloProcesso(processo.protocolo)}</h1>
          <p className="subtitle">
            Protocolo, abertura, status, resultados e vínculo com ocorrência não mudam por aqui.
          </p>
        </div>
      </div>
      <FormularioEdicao processo={processo} />
    </>
  )
}
