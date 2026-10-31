import { useState, type FormEvent } from 'react'
import { mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useCriarUsuarioMutation } from '../hooks/useUsuarios'
import { usuarioFormSchema, type UsuarioFormValues } from '../schemas/usuarioFormSchema'
import { PERFIS_USUARIO, type PerfilUsuario } from '../types/usuarios.types'
import { gerarSenhaTemporaria } from '../utils/senhaTemporaria'
import { AlertaErroEnvio } from '@/components/AlertaErroEnvio'
import { Modal } from '@/components/Modal'

interface CriarUsuarioModalProps {
  onFechar: () => void
}

function dividirNomeCompleto(nomeCompleto: string): { nome: string; sobrenome: string } {
  const partes = nomeCompleto.trim().split(/\s+/)
  return { nome: partes[0], sobrenome: partes.slice(1).join(' ') }
}

export function CriarUsuarioModal({ onFechar }: CriarUsuarioModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Depois de criar, o modal mostra a senha: ela não volta a aparecer em lugar nenhum.
  const [criado, setCriado] = useState<{ nome: string; senha: string } | null>(null)
  const [copiada, setCopiada] = useState(false)

  const mutation = useCriarUsuarioMutation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      nomeCompleto: '',
      email: '',
      cargo: '',
      crmv: '',
      senhaInicial: gerarSenhaTemporaria(),
    },
  })

  const cargo = watch('cargo')

  async function onSubmit(dados: UsuarioFormValues) {
    const { nome, sobrenome } = dividirNomeCompleto(dados.nomeCompleto)

    try {
      await mutation.mutateAsync({
        nome,
        sobrenome,
        email: dados.email,
        cargo: dados.cargo as PerfilUsuario,
        crmv: dados.cargo === 'Veterinário' ? dados.crmv : undefined,
        senhaInicial: dados.senhaInicial,
      })
      setCriado({ nome: dados.nomeCompleto.trim(), senha: dados.senhaInicial })
    } catch (erro) {
      if (statusHttpDoErro(erro) === 409) {
        setError('email', { message: 'Já existe um usuário com este e-mail.' })
        return
      }
      setSubmitError(mensagemDeRegraDaApi(erro) ?? 'Não foi possível criar o usuário. Tente novamente.')
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  async function copiarSenha(senha: string) {
    try {
      await navigator.clipboard.writeText(senha)
      setCopiada(true)
    } catch {
      // Sem acesso à área de transferência: a senha segue na tela para copiar à mão.
      setCopiada(false)
    }
  }

  if (criado) {
    return (
      <Modal titulo="Usuário criado" onFechar={onFechar}>
        <div className="modal-body col gap-3">
          <p>
            Entregue esta senha temporária a <strong>{criado.nome}</strong>. Ela será trocada no primeiro acesso e não
            aparecerá de novo.
          </p>
          <div className="senha-temporaria">
            <code className="mono">{criado.senha}</code>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void copiarSenha(criado.senha)}>
              {copiada ? 'Copiada' : 'Copiar'}
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onFechar}>
            Concluir
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal titulo="Adicionar Usuário" onFechar={onFechar}>
      <form onSubmit={aoEnviar} noValidate>
        <div className="modal-body">
          <div className="form-grid cols-1">
            <AlertaErroEnvio mensagem={submitError} />

            <div className="field">
              <label htmlFor="nomeCompleto">
                Nome completo <span className="req">*</span>
              </label>
              <input
                id="nomeCompleto"
                className={`input${errors.nomeCompleto ? ' error' : ''}`}
                type="text"
                placeholder="Maria Silva Souza"
                {...register('nomeCompleto')}
              />
              {errors.nomeCompleto && <span className="err">{errors.nomeCompleto.message}</span>}
            </div>

            <div className="field">
              <label htmlFor="email">
                E-mail institucional <span className="req">*</span>
              </label>
              <input
                id="email"
                className={`input${errors.email ? ' error' : ''}`}
                type="email"
                placeholder="nome.sobrenome@itu.sp.gov.br"
                {...register('email')}
              />
              {errors.email && <span className="err">{errors.email.message}</span>}
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="cargo">
                  Perfil <span className="req">*</span>
                </label>
                <select id="cargo" className={`select${errors.cargo ? ' error' : ''}`} {...register('cargo')}>
                  <option value="" disabled>
                    Selecione…
                  </option>
                  {PERFIS_USUARIO.map((perfil) => (
                    <option key={perfil} value={perfil}>
                      {perfil}
                    </option>
                  ))}
                </select>
                {errors.cargo && <span className="err">{errors.cargo.message}</span>}
              </div>

              {cargo === 'Veterinário' && (
                <div className="field">
                  <label htmlFor="crmv">
                    CRMV <span className="req">*</span>
                  </label>
                  <input
                    id="crmv"
                    className={`input mono${errors.crmv ? ' error' : ''}`}
                    type="text"
                    placeholder="CRMV-SP 00000"
                    {...register('crmv')}
                  />
                  {errors.crmv && <span className="err">{errors.crmv.message}</span>}
                </div>
              )}
            </div>

            <div className="field">
              <label htmlFor="senhaInicial">Senha temporária</label>
              <div className="flex gap-2">
                <input
                  id="senhaInicial"
                  className={`input mono${errors.senhaInicial ? ' error' : ''}`}
                  type="text"
                  style={{ flex: 1 }}
                  {...register('senhaInicial')}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setValue('senhaInicial', gerarSenhaTemporaria())}
                >
                  Gerar outra
                </button>
              </div>
              {errors.senhaInicial && <span className="err">{errors.senhaInicial.message}</span>}
              <span className="hint">Você verá esta senha para entregar ao usuário, que precisará trocá-la no primeiro acesso.</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onFechar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Criando…' : 'Criar Usuário'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
