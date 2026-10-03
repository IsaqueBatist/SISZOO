import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { DESFECHO_ANIMAL_OPCOES, RESULTADO_OPCOES } from '../utils/processosCatalogos'
import {
  enviarAmostrasFormSchema,
  registrarResultadoFormSchema,
  type EnviarAmostrasFormValues,
  type RegistrarResultadoFormValues,
} from '../schemas/processoStatusFormSchema'
import type { Processo, RegistrarResultadoRequest } from '../types/processos.types'
import { useConcluirProcessoMutation, useEnviarAmostrasMutation, useRegistrarResultadoMutation } from '../hooks/useProcessos'

interface CardStatusProcessoProps {
  processo: Processo
  podeEscrever: boolean
}

// Três ações de transição de status (aberto → aguardando_resultado →
// com_resultado → concluido, catálogo do DER.md §3.5) num único componente,
// cada uma só visível no status de origem certo — mesmo padrão
// multi-branch de CardEncerramento.tsx. O DER não define os gatilhos de
// cada transição (ver "Riscos e pendências" do plano); esta é a proposta
// da entrega, revisável.
export function CardStatusProcesso({ processo, podeEscrever }: CardStatusProcessoProps) {
  const [erro, setErro] = useState<string | null>(null)
  const mutationEnviar = useEnviarAmostrasMutation(processo.id)
  const mutationResultado = useRegistrarResultadoMutation(processo.id)
  const mutationConcluir = useConcluirProcessoMutation(processo.id)

  const {
    register: registerEnvio,
    handleSubmit: handleSubmitEnvio,
  } = useForm<EnviarAmostrasFormValues>({
    resolver: zodResolver(enviarAmostrasFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { previsaoRetorno: '' },
  })

  const {
    register: registerResultado,
    handleSubmit: handleSubmitResultado,
    formState: { errors: errosResultado },
  } = useForm<RegistrarResultadoFormValues>({
    resolver: zodResolver(registrarResultadoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { resultadoLaboratorial: '', desfechoAnimal: '' },
  })

  if (!podeEscrever) return null

  async function aoEnviarAmostras(dados: EnviarAmostrasFormValues) {
    setErro(null)
    try {
      await mutationEnviar.mutateAsync({ previsaoRetorno: dados.previsaoRetorno || undefined })
    } catch {
      setErro('Não foi possível enviar as amostras ao laboratório. Tente novamente.')
    }
  }

  async function aoRegistrarResultado(dados: RegistrarResultadoFormValues) {
    setErro(null)
    try {
      await mutationResultado.mutateAsync({
        resultadoLaboratorial: dados.resultadoLaboratorial as RegistrarResultadoRequest['resultadoLaboratorial'],
        desfechoAnimal: (dados.desfechoAnimal || undefined) as RegistrarResultadoRequest['desfechoAnimal'],
      })
    } catch {
      setErro('Não foi possível registrar o resultado. Tente novamente.')
    }
  }

  async function aoConcluir() {
    setErro(null)
    try {
      await mutationConcluir.mutateAsync()
    } catch {
      setErro('Não foi possível concluir o processo. Tente novamente.')
    }
  }

  function aoEnviarFormularioEnvio(event: FormEvent<HTMLFormElement>) {
    setErro(null)
    void handleSubmitEnvio(aoEnviarAmostras)(event)
  }

  function aoEnviarFormularioResultado(event: FormEvent<HTMLFormElement>) {
    setErro(null)
    void handleSubmitResultado(aoRegistrarResultado)(event)
  }

  if (processo.statusProcesso === 'aberto') {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Enviar amostras ao laboratório</h3>
        </div>
        <div className="card-body">
          {erro && (
            <div className="alert danger" role="alert" style={{ marginBottom: 12 }}>
              <span className="bullet" />
              <div className="alert-content">{erro}</div>
            </div>
          )}
          <form onSubmit={aoEnviarFormularioEnvio} noValidate>
            <div className="field">
              <label htmlFor="proc-previsao">Previsão de retorno</label>
              <input id="proc-previsao" className="input" type="date" {...registerEnvio('previsaoRetorno')} />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 12 }}
              disabled={mutationEnviar.isPending}
            >
              {mutationEnviar.isPending ? 'Enviando…' : 'Enviar amostras ao laboratório'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Guard extra (além do status) é defesa-em-profundidade: o store já
  // rejeita uma segunda chamada pelo status, mas a UI nem deveria oferecer o
  // form de novo se por algum motivo `resultadoLaboratorial` já existir —
  // write-once, mesma regra de registros clínicos do CLAUDE.md raiz.
  if (processo.statusProcesso === 'aguardando_resultado' && !processo.resultadoLaboratorial) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Registrar resultado</h3>
        </div>
        <div className="card-body">
          {erro && (
            <div className="alert danger" role="alert" style={{ marginBottom: 12 }}>
              <span className="bullet" />
              <div className="alert-content">{erro}</div>
            </div>
          )}
          <form onSubmit={aoEnviarFormularioResultado} noValidate>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="proc-resultado">Resultado laboratorial</label>
              <select
                id="proc-resultado"
                className={`select${errosResultado.resultadoLaboratorial ? ' error' : ''}`}
                defaultValue=""
                {...registerResultado('resultadoLaboratorial')}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {RESULTADO_OPCOES.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.label}
                  </option>
                ))}
              </select>
              {errosResultado.resultadoLaboratorial && (
                <span className="err">{errosResultado.resultadoLaboratorial.message}</span>
              )}
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="proc-desfecho">Desfecho do animal</label>
              <select id="proc-desfecho" className="select" defaultValue="" {...registerResultado('desfechoAnimal')}>
                <option value="">—</option>
                {DESFECHO_ANIMAL_OPCOES.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={mutationResultado.isPending}>
              {mutationResultado.isPending ? 'Registrando…' : 'Registrar resultado'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (processo.statusProcesso === 'com_resultado') {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Concluir processo</h3>
        </div>
        <div className="card-body">
          {erro && (
            <div className="alert danger" role="alert" style={{ marginBottom: 12 }}>
              <span className="bullet" />
              <div className="alert-content">{erro}</div>
            </div>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={aoConcluir} disabled={mutationConcluir.isPending}>
            {mutationConcluir.isPending ? 'Concluindo…' : 'Concluir processo'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
