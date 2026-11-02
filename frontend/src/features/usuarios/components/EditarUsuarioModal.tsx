import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AlertaErroEnvio } from '@/components/AlertaErroEnvio'
import { Modal } from '@/components/Modal'
import { toast } from '@/components/toast/toast'
import { aplicarErrosDeCampo, mensagemDeRegraDaApi } from '@/lib/erroApi'
import { useAtualizarUsuarioMutation } from '../hooks/useUsuarios'
import { edicaoUsuarioSchema, type EdicaoUsuarioValues } from '../schemas/edicaoUsuarioSchema'
import { PERFIS_USUARIO, type PerfilUsuario, type UsuarioListItem } from '../types/usuarios.types'

interface EditarUsuarioModalProps {
  usuario: UsuarioListItem
  ehOProprioUsuario: boolean
  onFechar: () => void
}

export function EditarUsuarioModal({ usuario, ehOProprioUsuario, onFechar }: EditarUsuarioModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const mutation = useAtualizarUsuarioMutation()
  const cargoAtual = usuario.cargos[0] ?? ''

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<EdicaoUsuarioValues>({
    resolver: zodResolver(edicaoUsuarioSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      cargo: cargoAtual,
      crmv: usuario.crmv ?? '',
      telefone: usuario.telefone ?? '',
    },
  })

  const cargo = watch('cargo')
  const mudaraOPerfil = cargo !== cargoAtual

  async function onSubmit(dados: EdicaoUsuarioValues) {
    try {
      await mutation.mutateAsync({
        id: usuario.id,
        payload: {
          nome: dados.nome,
          sobrenome: dados.sobrenome,
          cargo: dados.cargo as PerfilUsuario,
          crmv: dados.crmv || undefined,
          telefone: dados.telefone || undefined,
        },
      })
      toast.sucesso(`Cadastro de ${dados.nome} ${dados.sobrenome} atualizado.`)
      onFechar()
    } catch (erro) {
      const campos = aplicarErrosDeCampo(erro, setError)
      if (campos.length === 0) {
        setSubmitError(mensagemDeRegraDaApi(erro) ?? 'Não foi possível salvar o cadastro. Tente novamente.')
      }
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  return (
    <Modal titulo="Editar usuário" onFechar={onFechar}>
      <form onSubmit={aoEnviar} noValidate>
        <div className="modal-body">
          <div className="form-grid cols-1">
            <AlertaErroEnvio mensagem={submitError} />

            <div className="form-grid">
              <div className="field">
                <label htmlFor="edicao-nome">
                  Nome <span className="req">*</span>
                </label>
                <input
                  id="edicao-nome"
                  className={`input${errors.nome ? ' error' : ''}`}
                  aria-invalid={errors.nome ? true : undefined}
                  aria-describedby={errors.nome ? 'edicao-nome-erro' : undefined}
                  type="text"
                  {...register('nome')}
                />
                {errors.nome && <span className="err" id="edicao-nome-erro">{errors.nome.message}</span>}
              </div>
              <div className="field">
                <label htmlFor="edicao-sobrenome">
                  Sobrenome <span className="req">*</span>
                </label>
                <input
                  id="edicao-sobrenome"
                  className={`input${errors.sobrenome ? ' error' : ''}`}
                  aria-invalid={errors.sobrenome ? true : undefined}
                  aria-describedby={errors.sobrenome ? 'edicao-sobrenome-erro' : undefined}
                  type="text"
                  {...register('sobrenome')}
                />
                {errors.sobrenome && <span className="err" id="edicao-sobrenome-erro">{errors.sobrenome.message}</span>}
              </div>
            </div>

            <div className="field">
              <label htmlFor="edicao-email">E-mail institucional</label>
              <input id="edicao-email" className="input" type="email" value={usuario.email} readOnly aria-describedby="edicao-email-dica" />
              <span className="hint" id="edicao-email-dica">O e-mail é o login da pessoa e não muda.</span>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="edicao-cargo">
                  Perfil <span className="req">*</span>
                </label>
                <select
                  id="edicao-cargo"
                  className={`select${errors.cargo ? ' error' : ''}`}
                  aria-invalid={errors.cargo ? true : undefined}
                  aria-describedby={ehOProprioUsuario ? 'edicao-cargo-dica' : errors.cargo ? 'edicao-cargo-erro' : undefined}
                  disabled={ehOProprioUsuario}
                  {...register('cargo')}
                >
                  {PERFIS_USUARIO.map((perfil) => (
                    <option key={perfil} value={perfil}>
                      {perfil}
                    </option>
                  ))}
                </select>
                {ehOProprioUsuario && (
                  <span className="hint" id="edicao-cargo-dica">Peça a outro Administrador para alterar o seu perfil.</span>
                )}
                {errors.cargo && <span className="err" id="edicao-cargo-erro">{errors.cargo.message}</span>}
              </div>

              {cargo === 'Veterinário' && (
                <div className="field">
                  <label htmlFor="edicao-crmv">
                    CRMV <span className="req">*</span>
                  </label>
                  <input
                    id="edicao-crmv"
                    className={`input mono${errors.crmv ? ' error' : ''}`}
                    aria-invalid={errors.crmv ? true : undefined}
                    aria-describedby={errors.crmv ? 'edicao-crmv-erro' : undefined}
                    type="text"
                    {...register('crmv')}
                  />
                  {errors.crmv && <span className="err" id="edicao-crmv-erro">{errors.crmv.message}</span>}
                </div>
              )}
            </div>

            <div className="field">
              <label htmlFor="edicao-telefone">Telefone</label>
              <input
                id="edicao-telefone"
                className={`input${errors.telefone ? ' error' : ''}`}
                aria-invalid={errors.telefone ? true : undefined}
                aria-describedby={errors.telefone ? 'edicao-telefone-erro' : undefined}
                type="tel"
                {...register('telefone')}
              />
              {errors.telefone && <span className="err" id="edicao-telefone-erro">{errors.telefone.message}</span>}
            </div>

            {mudaraOPerfil && (
              <div className="alert warning" role="status">
                <span className="bullet" />
                <div className="alert-content">
                  Mudar o perfil encerra as sessões de {usuario.nome}, que precisará entrar de novo.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onFechar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
