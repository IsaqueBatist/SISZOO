import { useMemo, useState } from 'react'
import { Icon } from '@/components/layout/Icon'
import { ResumoCatalogo } from '@/components/ResumoCatalogo'
import { toast } from '@/components/toast/toast'
import type { Medicamento } from '@/features/animais/types/historico.types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import { useFiltrosLista } from '@/lib/useFiltrosLista'
import {
  useCategoriasFarmacologicasQuery,
  useDesativarMedicamentoMutation,
  useMedicamentosQuery,
} from '../hooks/useMedicamentos'
import { MedicamentoFormModal } from './MedicamentoFormModal'

type FiltroSituacao = 'ativos' | 'inativos' | 'todos'

// Busca, categoria e situação sobrevivem a abrir um medicamento e voltar
// (sessionStorage), como nas outras listas.
const FILTROS_PADRAO = { busca: '', categoriaId: '', situacao: 'ativos' }

const LINHAS_SKELETON = [0, 1, 2, 3]
const COLUNAS_TABELA = 4

// Catálogo usado pelo registro de prescrição (modal "Registrar medicamento" da
// ficha do animal). Leitura: GESTAO_ANIMAIS:leitura (os três perfis). Cadastro
// e edição: GESTAO_ANIMAIS:escrita (Administrador e Veterinária). Desativar
// exige :exclusao, que só o Administrador tem.
//
// Não há seed: o CCZ cadastra as categorias e os medicamentos reais.
export function Medicamentos() {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet'
  const podeDesativar = roleKey === 'admin'

  const { filtros, definirFiltros, limparFiltros, filtrosAtivos } = useFiltrosLista('medicamentos', FILTROS_PADRAO)
  const { busca, categoriaId } = filtros
  const situacao = filtros.situacao as FiltroSituacao
  // `undefined` = fechado; `'novo'` = cadastro; um medicamento = edição.
  const [emEdicao, setEmEdicao] = useState<Medicamento | 'novo' | undefined>(undefined)

  // Catálogo inteiro numa consulta, filtrado em memória: a faixa de resumo
  // precisa do conjunto completo, e o backend já tem os filtros para quem
  // precisar deles (o select da prescrição usa `ativo=true`).
  const { data: medicamentos, isLoading, isError } = useMedicamentosQuery()
  const { data: categorias } = useCategoriasFarmacologicasQuery()

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return (medicamentos ?? []).filter((medicamento) => {
      if (situacao === 'ativos' && !medicamento.ativo) return false
      if (situacao === 'inativos' && medicamento.ativo) return false
      if (categoriaId !== '' && medicamento.categoriaId !== categoriaId) return false
      return termo === '' || medicamento.nome.toLowerCase().includes(termo)
    })
  }, [medicamentos, busca, situacao, categoriaId])

  const total = medicamentos?.length ?? 0
  const ativos = (medicamentos ?? []).filter((medicamento) => medicamento.ativo).length
  const categoriasEmUso = new Set((medicamentos ?? []).filter((m) => m.ativo).map((m) => m.categoriaId)).size

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>
            Medicamentos {medicamentos && <span className="counter">{total} no catálogo</span>}
          </h1>
          <p className="subtitle">Catálogo usado na prescrição de medicamentos da ficha do animal.</p>
        </div>
        {podeEscrever && (
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={() => setEmEdicao('novo')}>
              <Icon name="plus" size={14} />
              Cadastrar medicamento
            </button>
          </div>
        )}
      </div>

      {!isError && (
        <ResumoCatalogo
          itens={[
            { id: 'total', valor: total, rotulo: 'No catálogo', descricao: 'Medicamentos cadastrados' },
            { id: 'ativos', valor: ativos, rotulo: 'Ativos', descricao: 'Oferecidos na prescrição' },
            { id: 'inativos', valor: total - ativos, rotulo: 'Inativos', descricao: 'Fora da prescrição' },
            {
              id: 'categorias',
              valor: categoriasEmUso,
              rotulo: 'Categorias em uso',
              descricao: `De ${categorias?.length ?? 0} cadastradas`,
            },
          ]}
        />
      )}

      <div className="filter-bar">
        <div className="search-input">
          <Icon name="search" size={14} />
          <input
            type="search"
            placeholder="Buscar por nome do medicamento..."
            aria-label="Buscar por nome do medicamento"
            value={busca}
            onChange={(evento) => definirFiltros({ busca: evento.target.value })}
          />
        </div>
        <select
          className="filter-select"
          aria-label="Filtrar por categoria"
          value={categoriaId}
          onChange={(evento) => definirFiltros({ categoriaId: evento.target.value })}
        >
          <option value="">Categoria: Todas</option>
          {categorias?.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          aria-label="Filtrar por situação"
          value={situacao}
          onChange={(evento) => definirFiltros({ situacao: evento.target.value })}
        >
          <option value="ativos">Situação: Ativos</option>
          <option value="inativos">Situação: Inativos</option>
          <option value="todos">Situação: Todos</option>
        </select>
        {filtrosAtivos && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={limparFiltros}>
            Limpar filtros
          </button>
        )}
      </div>

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar os medicamentos. Tente novamente.</div>
        </div>
      )}

      {!isError && (isLoading || filtrados.length > 0) && (
        <div className="table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Categoria</th>
                  <th>Situação</th>
                  {(podeEscrever || podeDesativar) && <th style={{ width: 160 }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? LINHAS_SKELETON.map((linha) => (
                      <tr key={linha}>
                        {Array.from({ length: COLUNAS_TABELA }).map((_, coluna) => (
                          <td key={coluna}>
                            <span className="skel" style={{ display: 'block', height: 14, borderRadius: 4 }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtrados.map((medicamento) => (
                      <LinhaMedicamento
                        key={medicamento.id}
                        medicamento={medicamento}
                        podeEscrever={podeEscrever}
                        podeDesativar={podeDesativar}
                        onEditar={() => setEmEdicao(medicamento)}
                      />
                    ))}
              </tbody>
            </table>
          </div>
          {!isLoading && (
            <div className="table-footer">
              <span>
                Mostrando <strong>{filtrados.length}</strong> de <strong>{total}</strong>{' '}
                {total === 1 ? 'medicamento' : 'medicamentos'}
              </span>
            </div>
          )}
        </div>
      )}

      {!isLoading && !isError && filtrados.length === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="pill" size={28} />
          </span>
          {total === 0 ? (
            <>
              <h3>Nenhum medicamento cadastrado</h3>
              <p>
                {podeEscrever
                  ? 'Cadastre o primeiro medicamento para que ele apareça na prescrição.'
                  : 'Peça a um administrador ou veterinário para cadastrar.'}
              </p>
            </>
          ) : (
            <>
              <h3>Nenhum medicamento encontrado</h3>
              <p>Nenhum medicamento corresponde à busca ou aos filtros escolhidos.</p>
            </>
          )}
        </div>
      )}

      {emEdicao && (
        <MedicamentoFormModal
          medicamento={emEdicao === 'novo' ? undefined : emEdicao}
          onFechar={() => setEmEdicao(undefined)}
        />
      )}
    </>
  )
}

function LinhaMedicamento({
  medicamento,
  podeEscrever,
  podeDesativar,
  onEditar,
}: {
  medicamento: Medicamento
  podeEscrever: boolean
  podeDesativar: boolean
  onEditar: () => void
}) {
  const desativar = useDesativarMedicamentoMutation()

  function handleDesativar() {
    // Diferente da vacina, aqui NÃO há volta: AtualizarMedicamentoRequest não
    // tem campo `ativo` e não existe endpoint de reativação. A confirmação
    // precisa dizer isso, senão o usuário supõe simetria com vacinas.
    const confirmado = window.confirm(
      `Desativar o medicamento ${medicamento.nome}?\n\n` +
        '· As prescrições já lançadas continuam como estão.\n' +
        '· Ele some do catálogo da prescrição e não poderá ser usado em novos registros.\n\n' +
        'Atenção: não há como reativar um medicamento. Para voltar a usá-lo, seria preciso cadastrá-lo de novo.',
    )
    if (!confirmado) return
    desativar.mutate(medicamento.id, {
      onSuccess: () => toast.sucesso(`${medicamento.nome} desativado.`),
      onError: (erro) =>
        toast.erro('Não foi possível desativar o medicamento', mensagemDeRegraDaApi(erro) ?? 'Tente novamente.'),
    })
  }

  return (
    <tr>
      <td>{medicamento.nome}</td>
      <td>{medicamento.categoriaNome}</td>
      <td>
        <span className={`badge ${medicamento.ativo ? 'badge-available' : 'badge-deceased'}`}>
          {medicamento.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      {(podeEscrever || podeDesativar) && (
        <td>
          <div className="flex gap-1">
            {podeEscrever && medicamento.ativo && (
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-icon-only"
                title={`Editar ${medicamento.nome}`}
                aria-label={`Editar ${medicamento.nome}`}
                onClick={onEditar}
              >
                <Icon name="edit" size={14} />
              </button>
            )}
            {podeDesativar && medicamento.ativo && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleDesativar}
                disabled={desativar.isPending}
              >
                Desativar
              </button>
            )}
            {!medicamento.ativo && <span className="muted">Sem reativação</span>}
          </div>
        </td>
      )}
    </tr>
  )
}
