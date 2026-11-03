import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Icon } from '@/components/layout/Icon'
import { toast } from '@/components/toast/toast'
import type { Medicamento } from '@/features/animais/types/historico.types'
import { aplicarErrosDeCampo, mapaDeCampos, mensagemDeRegraDaApi } from '@/lib/erroApi'
import {
  useAtualizarMedicamentoMutation,
  useCategoriasFarmacologicasQuery,
  useCriarCategoriaFarmacologicaMutation,
  useCriarMedicamentoMutation,
} from '../hooks/useMedicamentos'
import {
  categoriaFormSchema,
  medicamentoFormSchema,
  type CategoriaFormValues,
  type MedicamentoFormValues,
} from '../schemas/medicamentoFormSchema'

const MAPA_ERROS_MEDICAMENTO = mapaDeCampos<MedicamentoFormValues>(['nome', 'categoriaId'])
const MAPA_ERROS_CATEGORIA = mapaDeCampos<CategoriaFormValues>(['nome'])

interface MedicamentoFormModalProps {
  medicamento?: Medicamento
  onFechar: () => void
}

export function MedicamentoFormModal({ medicamento, onFechar }: MedicamentoFormModalProps) {
  const editando = medicamento !== undefined
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [cadastrandoCategoria, setCadastrandoCategoria] = useState(false)

  const { data: categorias } = useCategoriasFarmacologicasQuery()
  const criar = useCriarMedicamentoMutation()
  const atualizar = useAtualizarMedicamentoMutation()

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<MedicamentoFormValues>({
    resolver: zodResolver(medicamentoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      nome: medicamento?.nome ?? '',
      categoriaId: medicamento?.categoriaId ?? '',
    },
  })

  const salvando = criar.isPending || atualizar.isPending
  const semCategorias = categorias?.length === 0

  async function salvar(dados: MedicamentoFormValues) {
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: medicamento.id, payload: dados })
        toast.sucesso(`${dados.nome} atualizado.`)
      } else {
        const criado = await criar.mutateAsync(dados)
        toast.sucesso(`${criado.nome} cadastrado.`)
      }
      onFechar()
    } catch (erro) {
      if (aplicarErrosDeCampo(erro, setError, MAPA_ERROS_MEDICAMENTO).length > 0) return
      setSubmitError(
        mensagemDeRegraDaApi(erro) ??
          `Não foi possível ${editando ? 'salvar' : 'cadastrar'} o medicamento. Tente novamente.`,
      )
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(salvar)(event)
  }

  function aoCadastrarCategoria(id: string, nome: string) {
    setValue('categoriaId', id, { shouldValidate: true })
    setCadastrandoCategoria(false)
    toast.sucesso(`Categoria ${nome} cadastrada e selecionada.`)
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{editando ? 'Editar medicamento' : 'Cadastrar medicamento'}</h3>
          <button type="button" className="btn btn-ghost btn-sm btn-icon-only" onClick={onFechar} aria-label="Fechar">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={aoEnviar} noValidate>
          <div className="modal-body">
            <div className="form-grid cols-1">
              {submitError && (
                <div className="alert danger" role="alert">
                  <div className="alert-content">{submitError}</div>
                </div>
              )}

              <div className="field">
                <label htmlFor="med-nome">
                  Nome <span className="req">*</span>
                </label>
                <input
                  id="med-nome"
                  className={`input${errors.nome ? ' error' : ''}`}
                  type="text"
                  placeholder="Ex: Amoxicilina 250mg"
                  autoFocus
                  {...register('nome')}
                />
                {errors.nome && <span className="err">{errors.nome.message}</span>}
              </div>

              <div className="field">
                <label htmlFor="med-categoria">
                  Categoria <span className="req">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    id="med-categoria"
                    className={`select${errors.categoriaId ? ' error' : ''}`}
                    style={{ flex: 1 }}
                    {...register('categoriaId')}
                  >
                    <option value="" disabled>
                      {semCategorias ? 'Nenhuma categoria cadastrada' : 'Selecione…'}
                    </option>
                    {categorias?.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                  {!cadastrandoCategoria && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm btn-icon-only"
                      title="Cadastrar nova categoria"
                      aria-label="Cadastrar nova categoria"
                      onClick={() => setCadastrandoCategoria(true)}
                    >
                      <Icon name="plus" size={16} />
                    </button>
                  )}
                </div>
                {errors.categoriaId && <span className="err">{errors.categoriaId.message}</span>}
                {semCategorias && !cadastrandoCategoria && (
                  <span className="hint">Cadastre a primeira categoria no “+” ao lado.</span>
                )}
              </div>

              {cadastrandoCategoria && (
                <div className="field">
                  <CadastroCategoria
                    onCadastrada={aoCadastrarCategoria}
                    onCancelar={() => setCadastrandoCategoria(false)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar medicamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CadastroCategoria({
  onCadastrada,
  onCancelar,
}: {
  onCadastrada: (id: string, nome: string) => void
  onCancelar: () => void
}) {
  const [erro, setErro] = useState<string | null>(null)
  const criar = useCriarCategoriaFarmacologicaMutation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { nome: '' },
  })

  async function salvar(dados: CategoriaFormValues) {
    try {
      const criada = await criar.mutateAsync(dados.nome)
      onCadastrada(criada.id, criada.nome)
    } catch (capturado) {
      if (aplicarErrosDeCampo(capturado, setError, MAPA_ERROS_CATEGORIA).length > 0) return
      setErro(mensagemDeRegraDaApi(capturado) ?? 'Não foi possível cadastrar a categoria. Tente novamente.')
    }
  }

  function aoEnviar(event: FormEvent<HTMLButtonElement>) {
    event.preventDefault()
    setErro(null)
    void handleSubmit(salvar)()
  }

  return (
    <div className="card" style={{ padding: 'var(--space-3)' }}>
      <strong style={{ fontSize: 13 }}>Nova categoria farmacológica</strong>

      {erro && (
        <div className="alert danger" role="alert" style={{ marginTop: 'var(--space-2)' }}>
          <div className="alert-content">{erro}</div>
        </div>
      )}

      <div className="field" style={{ marginTop: 'var(--space-2)' }}>
        <label htmlFor="med-nova-categoria">
          Nome da categoria <span className="req">*</span>
        </label>
        <input
          id="med-nova-categoria"
          className={`input${errors.nome ? ' error' : ''}`}
          type="text"
          placeholder="Ex: Antibiótico"
          autoFocus
          {...register('nome')}
        />
        {errors.nome ? (
          <span className="err">{errors.nome.message}</span>
        ) : (
          <span className="hint">Categoria não pode ser renomeada nem removida depois.</span>
        )}
      </div>

      <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelar}>
          Cancelar cadastro
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={aoEnviar} disabled={criar.isPending}>
          {criar.isPending ? 'Cadastrando…' : 'Cadastrar categoria'}
        </button>
      </div>
    </div>
  )
}
