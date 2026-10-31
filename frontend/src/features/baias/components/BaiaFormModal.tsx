import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AlertaErroEnvio } from '@/components/AlertaErroEnvio'
import { Modal } from '@/components/Modal'
import { BannerRascunho } from '@/components/BannerRascunho'
import { useAtualizarBaiaMutation, useCatalogosAnimaisQuery, useCriarBaiaMutation } from '@/features/animais/hooks/useAnimais'
import type { Baia } from '@/features/animais/types/animais.types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { avisar } from '@/lib/avisos'
import { aplicarErrosDeCampo, mapaDeCampos, mensagemDeRegraDaApi } from '@/lib/erroApi'
import { useRascunho } from '@/lib/useRascunho'
import { baiaFormSchema, type BaiaFormValues } from '../schemas/baiaFormSchema'
import { armazenamentoRascunhoBaia, chaveRascunhoBaia } from '../storage/rascunhoBaiaStorage'

// Texto vazio ou só com espaços vai como ausente (o backend grava NULL e a
// listagem usa o tipo da baia). Mesmo padrão de AnimalForm.
const semEspacos = (v: unknown) => (typeof v === 'string' ? v.trim() || undefined : v)

// Erros por campo do 422: só os campos que existem no modal.
const MAPA_ERROS_SERVIDOR = mapaDeCampos<BaiaFormValues>(
  Object.keys(baiaFormSchema.shape) as (keyof BaiaFormValues)[],
)

const ARMAZENAMENTO_RASCUNHO = armazenamentoRascunhoBaia<BaiaFormValues>()

interface BaiaFormModalProps {
  baia?: Baia
  onFechar: () => void
}

export function BaiaFormModal({ baia, onFechar }: BaiaFormModalProps) {
  const editando = Boolean(baia)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: catalogos } = useCatalogosAnimaisQuery()
  const criarMutation = useCriarBaiaMutation()
  const atualizarMutation = useAtualizarBaiaMutation()
  const mutation = editando ? atualizarMutation : criarMutation

  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    setError,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useForm<BaiaFormValues>({
    resolver: zodResolver(baiaFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      nome: baia?.nome ?? '',
      tipoBaia: baia?.tipoBaiaCodigo ?? '',
      // valueAsNumber (não z.coerce.number() no schema): campo vazio vira
      // NaN, que z.number() rejeita como inválido ("Informe a capacidade.").
      // z.coerce.number() converteria '' em 0, um valor numérico válido —
      // mudaria a regra de negócio (capacidade zero silenciosamente aceita).
      capacidade: baia ? baia.capacidade : undefined,
      finalidade: baia?.finalidade ?? '',
      observacoes: baia?.observacoes ?? '',
    },
  })

  // Internet instável do CCZ: fechar o modal sem salvar mantém o que foi
  // digitado; salvar com sucesso remove o rascunho.
  const rascunho = useRascunho<BaiaFormValues>({
    armazenamento: ARMAZENAMENTO_RASCUNHO,
    chave: chaveRascunhoBaia(user?.id ?? '', baia?.id),
    watch,
    reset,
    getValues,
  })

  async function onSubmit(dados: BaiaFormValues) {
    const payload = {
      nome: dados.nome,
      tipoBaia: dados.tipoBaia,
      capacidade: dados.capacidade,
      finalidade: dados.finalidade,
      observacoes: dados.observacoes,
    }

    try {
      if (editando && baia) {
        await atualizarMutation.mutateAsync({ id: baia.id, payload })
      } else {
        await criarMutation.mutateAsync(payload)
      }
      await rascunho.removerAposSucesso()
      avisar(editando ? 'Baia atualizada.' : 'Baia criada.')
      onFechar()
    } catch (erro) {
      if (aplicarErrosDeCampo(erro, setError, MAPA_ERROS_SERVIDOR).length > 0) return
      setSubmitError(mensagemDeRegraDaApi(erro) ?? `Não foi possível ${editando ? 'salvar' : 'criar'} a baia. Tente novamente.`)
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  return (
    <Modal titulo={editando ? 'Editar Baia' : 'Adicionar Baia'} onFechar={onFechar}>
      <form onSubmit={aoEnviar} noValidate>
        <div className="modal-body">
          <div className="form-grid cols-1">
            {rascunho.rascunhoDisponivel && (
              <BannerRascunho onRestaurar={rascunho.restaurar} onDescartar={() => void rascunho.descartar()} salvoEm={rascunho.rascunhoSalvoEm} />
            )}
            <AlertaErroEnvio mensagem={submitError} />

            <div className="field">
              <label htmlFor="baia-nome">
                Nome <span className="req">*</span>
              </label>
              <input
                id="baia-nome"
                className={`input${errors.nome ? ' error' : ''}`} aria-invalid={errors.nome ? true : undefined} aria-describedby={errors.nome ? 'baia-nome-erro' : undefined}
                type="text"
                placeholder="Baia 8"
                {...register('nome')}
              />
              {errors.nome && <span className="err" id="baia-nome-erro">{errors.nome.message}</span>}
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="baia-tipo">
                  Tipo <span className="req">*</span>
                </label>
                <select id="baia-tipo" className={`select${errors.tipoBaia ? ' error' : ''}`} aria-invalid={errors.tipoBaia ? true : undefined} aria-describedby={errors.tipoBaia ? 'baia-tipo-erro' : undefined} {...register('tipoBaia')}>
                  <option value="" disabled>
                    Selecione…
                  </option>
                  {catalogos?.tiposBaia.map((tipo) => (
                    <option key={tipo.codigo} value={tipo.codigo}>
                      {tipo.nome}
                    </option>
                  ))}
                </select>
                {errors.tipoBaia && <span className="err" id="baia-tipo-erro">{errors.tipoBaia.message}</span>}
              </div>

              <div className="field">
                <label htmlFor="baia-capacidade">
                  Capacidade <span className="req">*</span>
                </label>
                <input
                  id="baia-capacidade"
                  className={`input${errors.capacidade ? ' error' : ''}`} aria-invalid={errors.capacidade ? true : undefined} aria-describedby={errors.capacidade ? 'baia-capacidade-erro' : undefined}
                  type="number"
                  min={1}
                  step={1}
                  {...register('capacidade', { valueAsNumber: true })}
                />
                {errors.capacidade && <span className="err" id="baia-capacidade-erro">{errors.capacidade.message}</span>}
              </div>
            </div>

            <div className="field">
              <label htmlFor="baia-finalidade">Finalidade</label>
              <input
                id="baia-finalidade"
                className={`input${errors.finalidade ? ' error' : ''}`} aria-invalid={errors.finalidade ? true : undefined} aria-describedby={errors.finalidade ? 'baia-finalidade-erro' : undefined}
                type="text"
                placeholder="Cães porte médio"
                {...register('finalidade', { setValueAs: semEspacos })}
              />
              {errors.finalidade && <span className="err" id="baia-finalidade-erro">{errors.finalidade.message}</span>}
            </div>

            <div className="field">
              <label htmlFor="baia-observacoes">Observações</label>
              <textarea id="baia-observacoes" className="textarea" rows={3} {...register('observacoes', { setValueAs: semEspacos })} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onFechar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando…' : editando ? 'Salvar' : 'Criar Baia'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
