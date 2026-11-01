import { useEffect, useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { BannerRascunho } from '@/components/BannerRascunho'
import { Icon } from '@/components/layout/Icon'
import { useToast } from '@/components/toast/useToast'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { adicionarMesesIso, formatarDataBR } from '@/lib/datas'
import { aplicarErrosDeCampo, mapaDeCampos, mensagemDeRegraDaApi } from '@/lib/erroApi'
import { useRascunho } from '@/lib/useRascunho'
import { armazenamentoRascunhoClinico, chaveRascunhoClinico } from '../storage/rascunhoClinicoStorage'
import { useCatalogosAnimaisQuery } from '../hooks/useAnimais'
import { CadastroRapidoVacina } from './CadastroRapidoVacina'
import { SelectCatalogoClinico } from './SelectCatalogoClinico'
import { vacinacaoFormSchema, type VacinacaoFormValues } from '../schemas/historicoFormSchemas'
import { LABELS_UNIDADE_DOSE } from '../utils/historicoLabels'
import { hojeEmItu } from '../utils/regrasVacina'
import { useCriarVacinacaoMutation } from '../hooks/useHistoricoAnimal'
import type { Vacinacao } from '../types/historico.types'

// Erros por campo do 422: só os campos que existem no modal.
const MAPA_ERROS_SERVIDOR = mapaDeCampos<VacinacaoFormValues>(
  Object.keys(vacinacaoFormSchema.shape) as (keyof VacinacaoFormValues)[],
)

const ARMAZENAMENTO_RASCUNHO = armazenamentoRascunhoClinico<VacinacaoFormValues>()

interface ModalRegistrarVacinaProps {
  animalId: string
  // Nova aplicação da mesma vacina, pedida pela linha que está vencendo na
  // aba. É um registro INDEPENDENTE (sem `retifica`): o reforço não corrige a
  // aplicação anterior, ele sucede a ela.
  reforco?: boolean
  // Vacina já escolhida ao abrir: usada pelo reforço, que sabe qual é.
  vacinaPreSelecionada?: string
  // Presente quando a ação é "Corrigir" um registro existente: o POST novo
  // aponta `retificaId` para ele, em vez de criar uma vacinação
  // independente (registros clínicos são imutáveis).
  retifica?: Vacinacao
  onFechar: () => void
  onSucesso: () => void
}

export function ModalRegistrarVacina({
  animalId,
  reforco = false,
  vacinaPreSelecionada,
  retifica,
  onFechar,
  onSucesso,
}: ModalRegistrarVacinaProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [cadastrandoVacina, setCadastrandoVacina] = useState(false)
  const [codigoRecemCadastrado, setCodigoRecemCadastrado] = useState<string | null>(null)

  const mutation = useCriarVacinacaoMutation(animalId)
  const catalogos = useCatalogosAnimaisQuery()
  const toast = useToast()

  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useForm<VacinacaoFormValues>({
    resolver: zodResolver(vacinacaoFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      vacina: vacinaPreSelecionada ?? retifica?.vacinaCodigo ?? '',
      // No reforço a aplicação é agora: já vem preenchida, e a pessoa troca
      // se estiver lançando uma aplicação de outro dia.
      dataAplicacao: reforco ? hojeEmItu() : (retifica?.dataAplicacao ?? ''),
      numeroDose: retifica?.numeroDose ?? undefined,
      doseQuantidade: retifica?.doseQuantidade,
      doseUnidade: retifica?.doseUnidade ?? undefined,
      lote: retifica?.lote ?? '',
      observacoes: retifica?.observacoes ?? '',
    },
  })

  // Internet instável do CCZ: fechar o modal sem salvar mantém o que foi
  // digitado; o envio com sucesso remove o rascunho.
  const rascunho = useRascunho<VacinacaoFormValues>({
    armazenamento: ARMAZENAMENTO_RASCUNHO,
    chave: chaveRascunhoClinico(user?.id ?? '', 'vacina', animalId, retifica?.id),
    watch,
    reset,
    getValues,
  })

  async function onSubmit(dados: VacinacaoFormValues) {
    try {
      await mutation.mutateAsync({
        animalId,
        vacina: dados.vacina,
        dataAplicacao: dados.dataAplicacao,
        numeroDose: dados.numeroDose,
        doseQuantidade: dados.doseQuantidade,
        doseUnidade: dados.doseUnidade,
        lote: dados.lote,
        observacoes: dados.observacoes,
        retificaId: retifica?.id,
      })
      await rascunho.removerAposSucesso()
      toast.sucesso(retifica ? 'Correção da vacinação registrada.' : reforco ? 'Reforço registrado.' : 'Vacinação registrada.')
      onSucesso()
    } catch (erro) {
      if (aplicarErrosDeCampo(erro, setError, MAPA_ERROS_SERVIDOR).length > 0) return
      setSubmitError(
        mensagemDeRegraDaApi(erro) ??
          `Não foi possível ${retifica ? 'corrigir' : 'registrar'} a vacinação. Tente novamente.`,
      )
    }
  }


  // Previsão do próximo reforço, ao vivo: é o que explica de onde sai o alerta
  // de vacina vencendo. Usa a mesma aritmética de meses do servidor —
  // inclusive o truncamento de fim de mês — para a previsão bater com a data
  // de validade que a tabela mostra depois de salvar.
  const codigoEscolhido = watch('vacina')
  const dataEscolhida = watch('dataAplicacao')
  const vacinaEscolhida = catalogos.data?.vacinas.find((item) => item.codigo === codigoEscolhido)
  const previsaoReforco =
    vacinaEscolhida?.intervaloMeses && dataEscolhida
      ? adicionarMesesIso(dataEscolhida, vacinaEscolhida.intervaloMeses)
      : null

  // Volta do cadastro rápido: a vacina nova já entra escolhida, como
  // Medicamentos.tsx faz com a categoria recém-criada.
  //
  // A seleção não pode ser feita direto no retorno do POST: o select é
  // não-controlado (`register`), e a `<option>` nova só existe depois de o
  // catálogo ser invalidado, refazer a consulta E o React re-renderizar. Um
  // `setValue` antes disso é descartado pelo DOM, que cai na primeira opção.
  // Por isso a escolha espera a opção aparecer.
  useEffect(() => {
    if (!codigoRecemCadastrado) return
    if (!catalogos.data?.vacinas.some((item) => item.codigo === codigoRecemCadastrado)) return
    setValue('vacina', codigoRecemCadastrado, { shouldValidate: true })
    setCodigoRecemCadastrado(null)
  }, [codigoRecemCadastrado, catalogos.data, setValue])

  function aoCadastrarVacina(codigo: string) {
    setCodigoRecemCadastrado(codigo)
    setCadastrandoVacina(false)
    toast.sucesso('Vacina cadastrada e selecionada.')
  }
  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{retifica ? 'Corrigir vacinação' : reforco ? 'Registrar reforço' : 'Registrar vacina'}</h3>
          <button type="button" className="btn btn-ghost btn-sm btn-icon-only" onClick={onFechar} aria-label="Fechar">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={aoEnviar} noValidate>
          <div className="modal-body">
            <div className="form-grid cols-1">
              {rascunho.rascunhoDisponivel && (
                <BannerRascunho onRestaurar={rascunho.restaurar} onDescartar={() => void rascunho.descartar()} salvoEm={rascunho.rascunhoSalvoEm} />
              )}
              {submitError && (
                <div className="alert danger" role="alert">
                  <span className="bullet" />
                  <div className="alert-content">{submitError}</div>
                </div>
              )}
              {reforco && (
                <div className="alert info" role="status">
                  <span className="bullet" />
                  <div className="alert-content">
                    Nova aplicação desta vacina.
                    <div className="alert-desc">
                      A aplicação anterior continua no histórico; esta passa a ser a vigente, e o alerta de
                      reforço é recalculado a partir dela.
                    </div>
                  </div>
                </div>
              )}
              {retifica && (
                <div className="alert info" role="alert">
                  <span className="bullet" />
                  <div className="alert-content">
                    O registro original não será alterado — esta correção cria um novo registro vinculado a ele.
                    <div className="alert-desc">
                      Use isto só para consertar um dado errado: a aplicação original passa a constar como
                      retificada. Para lançar uma <strong>nova aplicação</strong>, feche e use "Registrar reforço".
                    </div>
                  </div>
                </div>
              )}

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="vac-vacina">
                    Vacina <span className="req">*</span>
                  </label>
                  {/* O "+" fica ao lado do select, não substitui o componente:
                      SelectCatalogoClinico é quem trata carregando/erro/vazio
                      e só monta com as opções prontas. */}
                  <div className="flex gap-2">
                    <div style={{ flex: 1 }}>
                      <SelectCatalogoClinico
                        id="vac-vacina"
                        itens={catalogos.data?.vacinas}
                        carregando={catalogos.isLoading}
                        comErro={catalogos.isError}
                        onTentarNovamente={() => void catalogos.refetch()}
                        registro={register('vacina')}
                        temErro={Boolean(errors.vacina)}
                      />
                    </div>
                    {/* Sem checagem de papel aqui: a aba só oferece o caminho
                        para este modal a quem tem escrita (Admin e Vet), e o
                        backend recusa o POST de qualquer outro. */}
                    {!cadastrandoVacina && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm btn-icon-only"
                        title="Cadastrar nova vacina"
                        aria-label="Cadastrar nova vacina"
                        onClick={() => setCadastrandoVacina(true)}
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    )}
                  </div>
                  {errors.vacina && <span className="err">{errors.vacina.message}</span>}
                  {/* Explica de onde vem o alerta de reforço, com a data já
                      calculada. Só aparece com vacina e data escolhidas. */}
                  {previsaoReforco && (
                    <span className="hint">
                      Próximo reforço: {formatarDataBR(previsaoReforco)} (intervalo de{' '}
                      {vacinaEscolhida?.intervaloMeses} meses)
                    </span>
                  )}
                  {vacinaEscolhida && !vacinaEscolhida.intervaloMeses && (
                    <span className="hint">Esta vacina não tem intervalo de reforço: não gera alerta.</span>
                  )}
                </div>

                {cadastrandoVacina && (
                  <div className="field full">
                    <CadastroRapidoVacina
                      onCadastrada={aoCadastrarVacina}
                      onCancelar={() => setCadastrandoVacina(false)}
                    />
                  </div>
                )}

                <div className="field">
                  <label htmlFor="vac-data">
                    Data de aplicação <span className="req">*</span>
                  </label>
                  <input
                    id="vac-data"
                    className={`input${errors.dataAplicacao ? ' error' : ''}`}
                    type="date"
                    max={hojeEmItu()}
                    {...register('dataAplicacao')}
                  />
                  {errors.dataAplicacao && <span className="err">{errors.dataAplicacao.message}</span>}
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="vac-numero-dose">Número da dose</label>
                  <input
                    id="vac-numero-dose"
                    className="input"
                    type="number"
                    min={1}
                    step={1}
                    {...register('numeroDose', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="vac-dose-quantidade">
                    Quantidade da dose <span className="req">*</span>
                  </label>
                  <input
                    id="vac-dose-quantidade"
                    className={`input${errors.doseQuantidade ? ' error' : ''}`}
                    type="number"
                    min={0}
                    step="0.001"
                    {...register('doseQuantidade', { valueAsNumber: true })}
                  />
                  {errors.doseQuantidade && <span className="err">{errors.doseQuantidade.message}</span>}
                </div>
                <div className="field">
                  <label htmlFor="vac-dose-unidade">
                    Unidade <span className="req">*</span>
                  </label>
                  <select
                    id="vac-dose-unidade"
                    className={`select${errors.doseUnidade ? ' error' : ''}`}
                    {...register('doseUnidade', { setValueAs: (v) => (v === '' ? undefined : v) })}
                  >
                    <option value="">—</option>
                    {(Object.keys(LABELS_UNIDADE_DOSE) as (keyof typeof LABELS_UNIDADE_DOSE)[]).map((unidade) => (
                      <option key={unidade} value={unidade}>
                        {LABELS_UNIDADE_DOSE[unidade]}
                      </option>
                    ))}
                  </select>
                  {errors.doseUnidade && <span className="err">{errors.doseUnidade.message}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="vac-lote">Lote</label>
                <input
                  id="vac-lote"
                  className="input"
                  type="text"
                  {...register('lote', { setValueAs: (v: string) => (v.trim() ? v : undefined) })}
                />
              </div>

              <div className="field">
                <label htmlFor="vac-observacoes">Observações</label>
                <textarea
                  id="vac-observacoes"
                  className="textarea"
                  rows={3}
                  {...register('observacoes', { setValueAs: (v: string) => (v.trim() ? v : undefined) })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onFechar}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={mutation.isPending || !catalogos.data?.vacinas.length}
            >
              {mutation.isPending ? 'Salvando…' : retifica ? 'Salvar correção' : 'Registrar vacina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
