import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  useCategoriasFarmacologicasQuery,
  useCriarMedicamentoMutation,
} from '@/features/medicamentos/hooks/useMedicamentos'
import {
  medicamentoFormSchema,
  type MedicamentoFormValues,
} from '@/features/medicamentos/schemas/medicamentoFormSchema'
import { aplicarErrosDeCampo, mapaDeCampos, mensagemDeRegraDaApi } from '@/lib/erroApi'

const MAPA_ERROS_MEDICAMENTO = mapaDeCampos<MedicamentoFormValues>(['nome', 'categoriaId'])

interface CadastroRapidoMedicamentoProps {
  onCadastrado: (id: string) => void
  onCancelar: () => void
}

export function CadastroRapidoMedicamento({ onCadastrado, onCancelar }: CadastroRapidoMedicamentoProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const criar = useCriarMedicamentoMutation()
  const { data: categorias } = useCategoriasFarmacologicasQuery()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<MedicamentoFormValues>({
    resolver: zodResolver(medicamentoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { nome: '', categoriaId: '' },
  })

  async function salvar(dados: MedicamentoFormValues) {
    try {
      const criado = await criar.mutateAsync({ nome: dados.nome, categoriaId: dados.categoriaId })
      onCadastrado(criado.id)
    } catch (erro) {
      if (aplicarErrosDeCampo(erro, setError, MAPA_ERROS_MEDICAMENTO).length > 0) return
      setSubmitError(mensagemDeRegraDaApi(erro) ?? 'Não foi possível cadastrar o medicamento. Tente novamente.')
    }
  }

  function aoEnviar(event: FormEvent<HTMLButtonElement>) {
    event.preventDefault()
    setSubmitError(null)
    void handleSubmit(salvar)()
  }

  return (
    <div className="card" style={{ padding: 'var(--space-3)' }}>
      <strong style={{ fontSize: 13 }}>Novo medicamento</strong>

      {submitError && (
        <div className="alert danger" role="alert" style={{ marginTop: 'var(--space-2)' }}>
          <div className="alert-content">{submitError}</div>
        </div>
      )}

      <div className="form-grid" style={{ marginTop: 'var(--space-2)' }}>
        <div className="field">
          <label htmlFor="pres-novo-nome">
            Nome <span className="req">*</span>
          </label>
          <input
            id="pres-novo-nome"
            className={`input${errors.nome ? ' error' : ''}`}
            autoFocus
            {...register('nome')}
          />
          {errors.nome && <span className="err">{errors.nome.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="pres-nova-categoria">
            Categoria <span className="req">*</span>
          </label>
          <select
            id="pres-nova-categoria"
            className={`select${errors.categoriaId ? ' error' : ''}`}
            {...register('categoriaId')}
          >
            <option value="" disabled>
              Selecione…
            </option>
            {categorias?.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
          {errors.categoriaId ? (
            <span className="err">{errors.categoriaId.message}</span>
          ) : (
            <span className="hint">Categoria nova: cadastre em Medicamentos.</span>
          )}
        </div>
      </div>

      <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancelar}>
          Cancelar cadastro
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={aoEnviar} disabled={criar.isPending}>
          {criar.isPending ? 'Cadastrando…' : 'Cadastrar medicamento'}
        </button>
      </div>
    </div>
  )
}
