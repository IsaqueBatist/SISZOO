import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Icon } from '@/components/layout/Icon'
import { useToast } from '@/components/toast/useToast'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { aplicarErrosDeCampo, mapaDeCampos, mensagemDeRegraDaApi } from '@/lib/erroApi'

import {
  useAtualizarVacinaMutation,
  useCriarVacinaMutation,
  useDesativarVacinaMutation,
  useVacinasQuery,
} from '../hooks/useVacinas'
import { vacinaFormSchema, type VacinaFormValues } from '../schemas/vacinaFormSchema'
import type { Vacina } from '../types/vacinas.types'

const MAPA_ERROS_VACINA = mapaDeCampos<VacinaFormValues>(['nome', 'intervaloMeses'])

// Catálogo usado pelo registro de vacinação (modal "Registrar vacina" da ficha
// do animal). Leitura: GESTAO_ANIMAIS:leitura (os três perfis). Cadastro e
// edição: GESTAO_ANIMAIS:escrita (Administrador e Veterinária). Desativar
// exige :exclusao, que só o Administrador tem.
//
// O intervalo de reforço cadastrado aqui é o que gera o alerta de vacina
// vencendo: a data de validade de cada aplicação é a data aplicada + esse
// intervalo.
export function Vacinas() {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet'
  const podeDesativar = roleKey === 'admin'

  const [incluirInativas, setIncluirInativas] = useState(false)
  const { data: vacinas, isLoading, isError } = useVacinasQuery(incluirInativas)

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>Vacinas {vacinas && <span className="counter">{vacinas.length} no catálogo</span>}</h1>
          <p className="subtitle">Catálogo usado no registro de vacinação da ficha do animal.</p>
        </div>
        <div className="actions">
          <label className="flex gap-2" style={{ alignItems: 'center', fontSize: 13 }}>
            <input type="checkbox" checked={incluirInativas} onChange={(e) => setIncluirInativas(e.target.checked)} />
            Mostrar inativas
          </label>
        </div>
      </div>

      {podeEscrever && <CadastroVacina />}

      {isLoading && <p className="subtitle">Carregando vacinas…</p>}

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar as vacinas. Tente novamente.</div>
        </div>
      )}

      {!isLoading && !isError && vacinas?.length === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="syringe" size={28} />
          </span>
          <h3>Nenhuma vacina cadastrada</h3>
          <p>
            {podeEscrever
              ? 'Cadastre a primeira vacina acima.'
              : 'Peça a um administrador ou veterinário para cadastrar.'}
          </p>
        </div>
      )}

      {!isLoading && !isError && vacinas && vacinas.length > 0 && (
        <div className="table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Vacina</th>
                  <th>Intervalo de reforço</th>
                  <th>Situação</th>
                  {(podeEscrever || podeDesativar) && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {vacinas.map((vacina) => (
                  <LinhaVacina
                    key={vacina.id}
                    vacina={vacina}
                    podeEscrever={podeEscrever}
                    podeDesativar={podeDesativar}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function LinhaVacina({
  vacina,
  podeEscrever,
  podeDesativar,
}: {
  vacina: Vacina
  podeEscrever: boolean
  podeDesativar: boolean
}) {
  const desativar = useDesativarVacinaMutation()
  const atualizar = useAtualizarVacinaMutation()
  const toast = useToast()

  function handleDesativar() {
    const confirmado = window.confirm(
      `Desativar a vacina ${vacina.nome}?\n\nOs registros já lançados continuam como estão, mas esta vacina deixa de gerar alerta de reforço e não poderá ser usada em novos registros.`,
    )
    if (!confirmado) return
    desativar.mutate(vacina.id, {
      onSuccess: () => toast.sucesso(`${vacina.nome} desativada.`),
      onError: (erro) =>
        toast.erro('Não foi possível desativar a vacina', mensagemDeRegraDaApi(erro) ?? 'Tente novamente.'),
    })
  }

  function handleReativar() {
    atualizar.mutate(
      { id: vacina.id, payload: { nome: vacina.nome, intervaloMeses: vacina.intervaloMeses ?? undefined, ativo: true } },
      {
        onSuccess: () => toast.sucesso(`${vacina.nome} reativada.`),
        onError: (erro) =>
          toast.erro('Não foi possível reativar a vacina', mensagemDeRegraDaApi(erro) ?? 'Tente novamente.'),
      },
    )
  }

  return (
    <tr>
      <td>{vacina.nome}</td>
      <td>
        {vacina.intervaloMeses === null ? (
          <span className="muted">Sem reforço</span>
        ) : (
          `${vacina.intervaloMeses} ${vacina.intervaloMeses === 1 ? 'mês' : 'meses'}`
        )}
      </td>
      <td>
        <span className={`badge ${vacina.ativo ? 'badge-available' : 'badge-deceased'}`}>
          {vacina.ativo ? 'Ativa' : 'Inativa'}
        </span>
      </td>
      {(podeEscrever || podeDesativar) && (
        <td>
          {vacina.ativo
            ? podeDesativar && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleDesativar}
                  disabled={desativar.isPending}
                >
                  Desativar
                </button>
              )
            : podeEscrever && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleReativar}
                  disabled={atualizar.isPending}
                >
                  Reativar
                </button>
              )}
        </td>
      )}
    </tr>
  )
}

function CadastroVacina() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const criar = useCriarVacinaMutation()
  const toast = useToast()

  const form = useForm<VacinaFormValues>({
    resolver: zodResolver(vacinaFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { nome: '', intervaloMeses: undefined },
  })

  async function salvar(dados: VacinaFormValues) {
    setSubmitError(null)
    try {
      const criada = await criar.mutateAsync({ nome: dados.nome, intervaloMeses: dados.intervaloMeses })
      form.reset({ nome: '', intervaloMeses: undefined })
      toast.sucesso(`${criada.nome} cadastrada.`)
    } catch (erro) {
      if (aplicarErrosDeCampo(erro, form.setError, MAPA_ERROS_VACINA).length > 0) return
      setSubmitError(mensagemDeRegraDaApi(erro) ?? 'Não foi possível cadastrar a vacina. Tente novamente.')
    }
  }

  const erros = form.formState.errors

  return (
    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <div className="card-header">
        <h3>Cadastrar vacina</h3>
      </div>
      <div className="card-body">
        <form onSubmit={(event) => void form.handleSubmit(salvar)(event)} noValidate>
          {submitError && (
            <div className="alert danger" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
              <span className="bullet" />
              <div className="alert-content">{submitError}</div>
            </div>
          )}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="vacina-nome">
                Nome <span className="req">*</span>
              </label>
              <input
                id="vacina-nome"
                className={`input${erros.nome ? ' error' : ''}`}
                type="text"
                placeholder="Ex: Antirrábica"
                {...form.register('nome')}
              />
              {erros.nome && <span className="err">{erros.nome.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="vacina-intervalo">Intervalo de reforço (meses)</label>
              <input
                id="vacina-intervalo"
                className={`input${erros.intervaloMeses ? ' error' : ''}`}
                type="number"
                min={1}
                step={1}
                placeholder="Ex: 12"
                // Campo numérico opcional: `valueAsNumber` puro transformaria
                // o vazio em NaN, que z.number() rejeita mesmo sendo optional.
                {...form.register('intervaloMeses', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
              />
              {erros.intervaloMeses && <span className="err">{erros.intervaloMeses.message}</span>}
              <span className="hint">
                É esse intervalo que gera o alerta de reforço: a validade de cada aplicação é a data aplicada mais
                esses meses. Deixe em branco se a vacina não tem reforço.
              </span>
            </div>
          </div>
          <div className="flex" style={{ justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
            <button type="submit" className="btn btn-primary" disabled={criar.isPending}>
              <Icon name="plus" size={14} />
              {criar.isPending ? 'Cadastrando…' : 'Cadastrar vacina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
