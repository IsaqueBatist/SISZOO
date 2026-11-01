import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Icon } from '@/components/layout/Icon'
import { useMedicamentosAtivosQuery } from '@/features/animais/hooks/useHistoricoAnimal'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { aplicarErrosDeCampo, mapaDeCampos, mensagemDeRegraDaApi } from '@/lib/erroApi'
import { normalizarBusca } from '@/lib/texto'
import { classeDoFiltro, useFiltrosLista } from '@/lib/useFiltrosLista'
import {
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
const FILTROS_PADRAO = { busca: '', categoria: '' }

// Catálogo usado pela prescrição (modal "Registrar medicamento" da ficha).
// Leitura: GESTAO_ANIMAIS:leitura (Administrador, Veterinária e Agente).
// Cadastro de medicamento e de categoria: GESTAO_ANIMAIS:escrita, que só
// Administrador e Veterinária têm (mesma regra de RotaEscritaAnimais).
// Não há seed: o CCZ cadastra as categorias e os medicamentos reais.
export function Medicamentos() {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet'

  const { data: medicamentos, isLoading, isError } = useMedicamentosAtivosQuery()
  const { filtros, definirFiltros, limparFiltros, filtrosAtivos } = useFiltrosLista('medicamentos', FILTROS_PADRAO)

  const categorias = useMemo(() => {
    const nomesPorId = new Map((medicamentos ?? []).map((medicamento) => [medicamento.categoriaId, medicamento.categoriaNome]))
    return [...nomesPorId].sort(([, nomeA], [, nomeB]) => nomeA.localeCompare(nomeB, 'pt-BR'))
  }, [medicamentos])

  const medicamentosFiltrados = useMemo(() => {
    const busca = normalizarBusca(filtros.busca)
    return (medicamentos ?? []).filter(
      (medicamento) =>
        (!filtros.categoria || medicamento.categoriaId === filtros.categoria) &&
        (!busca || normalizarBusca(medicamento.nome).includes(busca)),
    )
  }, [medicamentos, filtros.busca, filtros.categoria])

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>
            Medicamentos {medicamentos && <span className="counter">{medicamentos.length} ativos</span>}
          </h1>
          <p className="subtitle">Catálogo usado nas prescrições da ficha do animal.</p>
        </div>
      </div>

      {podeEscrever && <CadastroMedicamento />}

      <div className="filter-bar" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="search-input">
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Buscar medicamento pelo nome..."
            aria-label="Buscar medicamentos"
            value={filtros.busca}
            onChange={(event) => definirFiltros({ busca: event.target.value })}
          />
        </div>
        <select
          className={classeDoFiltro(filtros.categoria)}
          aria-label="Filtrar por categoria"
          value={filtros.categoria}
          onChange={(event) => definirFiltros({ categoria: event.target.value })}
        >
          <option value="">Categoria: Todas</option>
          {categorias.map(([id, nome]) => (
            <option key={id} value={id}>
              {nome}
            </option>
          ))}
        </select>
        {filtrosAtivos && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={limparFiltros}>
            Limpar filtros
          </button>
        )}
      </div>

      {isLoading && <p className="subtitle">Carregando medicamentos…</p>}

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar os medicamentos. Tente novamente.</div>
        </div>
      )}

      {!isLoading && !isError && medicamentos?.length === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="pill" size={28} />
          </span>
          <h3>Nenhum medicamento cadastrado</h3>
          <p>{podeEscrever ? 'Cadastre o primeiro medicamento acima.' : 'Peça a um administrador ou veterinário para cadastrar.'}</p>
        </div>
      )}

      {!isLoading && !isError && medicamentos && medicamentos.length > 0 && medicamentosFiltrados.length === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="pill" size={28} />
          </span>
          <h3>Nenhum medicamento encontrado</h3>
          <p>Nenhum resultado com estes filtros.</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={limparFiltros}>
            Limpar filtros
          </button>
        </div>
      )}

      {!isLoading && !isError && medicamentosFiltrados.length > 0 && (
        <div className="table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Categoria</th>
                </tr>
              </thead>
              <tbody>
                {medicamentosFiltrados.map((medicamento) => (
                  <tr key={medicamento.id}>
                    <td>{medicamento.nome}</td>
                    <td>{medicamento.categoriaNome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              Mostrando <strong>{medicamentosFiltrados.length}</strong> de <strong>{medicamentos?.length ?? 0}</strong> medicamentos
            </span>
          </div>
        </div>
      )}
    </>
  )
}

function CadastroMedicamento() {
  const [erroMedicamento, setErroMedicamento] = useState<string | null>(null)
  const [erroCategoria, setErroCategoria] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const { data: categorias } = useCategoriasFarmacologicasQuery()
  const criarMedicamento = useCriarMedicamentoMutation()
  const criarCategoria = useCriarCategoriaFarmacologicaMutation()

  const formMedicamento = useForm<MedicamentoFormValues>({
    resolver: zodResolver(medicamentoFormSchema),
    mode: 'onSubmit',
    defaultValues: { nome: '', categoriaId: '' },
  })
  const formCategoria = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaFormSchema),
    mode: 'onSubmit',
    defaultValues: { nome: '' },
  })

  async function salvarMedicamento(dados: MedicamentoFormValues) {
    setErroMedicamento(null)
    setMensagem(null)
    try {
      const criado = await criarMedicamento.mutateAsync({ nome: dados.nome, categoriaId: dados.categoriaId })
      // Mantém a categoria: costuma-se cadastrar vários da mesma em sequência.
      formMedicamento.reset({ nome: '', categoriaId: dados.categoriaId })
      setMensagem(`${criado.nome} cadastrado.`)
    } catch (erro) {
      if (aplicarErrosDeCampo(erro, formMedicamento.setError, MAPA_ERROS_MEDICAMENTO).length > 0) return
      setErroMedicamento(mensagemDeRegraDaApi(erro) ?? 'Não foi possível cadastrar o medicamento. Tente novamente.')
    }
  }

  async function salvarCategoria(dados: CategoriaFormValues) {
    setErroCategoria(null)
    try {
      const criada = await criarCategoria.mutateAsync(dados.nome)
      formCategoria.reset({ nome: '' })
      // A categoria nova já fica escolhida no cadastro do medicamento.
      formMedicamento.setValue('categoriaId', criada.id, { shouldValidate: true })
    } catch (erro) {
      if (aplicarErrosDeCampo(erro, formCategoria.setError, MAPA_ERROS_CATEGORIA).length > 0) return
      setErroCategoria(mensagemDeRegraDaApi(erro) ?? 'Não foi possível cadastrar a categoria. Tente novamente.')
    }
  }

  const errosMedicamento = formMedicamento.formState.errors
  const errosCategoria = formCategoria.formState.errors
  const semCategorias = categorias?.length === 0

  return (
    <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <div className="card-header">
        <h3>Cadastrar medicamento</h3>
      </div>
      <div className="card-body">
        <form onSubmit={(event) => void formMedicamento.handleSubmit(salvarMedicamento)(event)} noValidate>
          {erroMedicamento && (
            <div className="alert danger" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
              <span className="bullet" />
              <div className="alert-content">{erroMedicamento}</div>
            </div>
          )}
          {mensagem && (
            <div className="alert success" role="status" style={{ marginBottom: 'var(--space-3)' }}>
              <span className="bullet" />
              <div className="alert-content">{mensagem}</div>
            </div>
          )}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="med-nome">
                Nome <span className="req">*</span>
              </label>
              <input
                id="med-nome"
                className={`input${errosMedicamento.nome ? ' error' : ''}`} aria-invalid={errosMedicamento.nome ? true : undefined} aria-describedby={errosMedicamento.nome ? 'med-nome-erro' : undefined}
                type="text"
                placeholder="Ex: Amoxicilina 250mg"
                {...formMedicamento.register('nome')}
              />
              {errosMedicamento.nome && <span className="err" id="med-nome-erro">{errosMedicamento.nome.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="med-categoria">
                Categoria farmacológica <span className="req">*</span>
              </label>
              <select
                id="med-categoria"
                className={`select${errosMedicamento.categoriaId ? ' error' : ''}`} aria-invalid={errosMedicamento.categoriaId ? true : undefined} aria-describedby={errosMedicamento.categoriaId ? 'med-categoria-erro' : undefined}
                {...formMedicamento.register('categoriaId')}
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
              {errosMedicamento.categoriaId && <span className="err" id="med-categoria-erro">{errosMedicamento.categoriaId.message}</span>}
              {semCategorias && <span className="hint">Cadastre a primeira categoria abaixo.</span>}
            </div>
          </div>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
            <button type="submit" className="btn btn-primary" disabled={criarMedicamento.isPending}>
              <Icon name="plus" size={14} />
              {criarMedicamento.isPending ? 'Salvando…' : 'Cadastrar medicamento'}
            </button>
          </div>
        </form>

        <form
          onSubmit={(event) => void formCategoria.handleSubmit(salvarCategoria)(event)}
          noValidate
          style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}
        >
          {erroCategoria && (
            <div className="alert danger" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
              <span className="bullet" />
              <div className="alert-content">{erroCategoria}</div>
            </div>
          )}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cat-nome">Nova categoria farmacológica</label>
              <input
                id="cat-nome"
                className={`input${errosCategoria.nome ? ' error' : ''}`} aria-invalid={errosCategoria.nome ? true : undefined} aria-describedby={errosCategoria.nome ? 'cat-nome-erro' : undefined}
                type="text"
                placeholder="Ex: Antibiótico"
                {...formCategoria.register('nome')}
              />
              {errosCategoria.nome && <span className="err" id="cat-nome-erro">{errosCategoria.nome.message}</span>}
            </div>
            <div className="field" style={{ alignSelf: 'end' }}>
              <button type="submit" className="btn btn-outline" disabled={criarCategoria.isPending}>
                {criarCategoria.isPending ? 'Salvando…' : 'Adicionar categoria'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
