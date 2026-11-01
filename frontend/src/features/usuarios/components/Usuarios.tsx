import { useMemo, useState } from 'react'
import { ModalConfirmacao } from '@/components/ModalConfirmacao'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Icon } from '@/components/layout/Icon'
import { avisar } from '@/lib/avisos'
import { formatarDataBR, formatarDataHoraBR } from '@/lib/datas'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import { useFiltrosLista } from '@/lib/useFiltrosLista'
import { ROLES, roleKeyFromCargos } from '@/lib/nav'
import { useAlterarStatusUsuarioMutation, useUsuariosQuery } from '../hooks/useUsuarios'
import { PERFIS_USUARIO, type PerfilUsuario, type UsuarioListItem } from '../types/usuarios.types'
import { CriarUsuarioModal } from './CriarUsuarioModal'
import { EditarUsuarioModal } from './EditarUsuarioModal'
import { RedefinirSenhaModal } from './RedefinirSenhaModal'
import './Usuarios.css'

type FiltroStatus = 'Todos' | 'Ativos' | 'Inativos'

const FILTROS_PADRAO = { busca: '', perfil: 'Todos', status: 'Todos' }

// ultimoAcesso e criadoEm são LocalDateTime sem fuso, já no horário de Itu:
// `new Date(iso)` os leria no fuso do navegador (ver lib/datas.ts).
function formatarData(iso: string | null, comHora = false): string {
  return comHora ? formatarDataHoraBR(iso) : formatarDataBR(iso)
}

function iniciais(nome: string, sobrenome: string): string {
  return `${nome[0] ?? ''}${sobrenome[0] ?? ''}`.toUpperCase()
}

function corAvatar(seed: string): string {
  const hue = Math.abs([...seed].reduce((acumulado, char) => acumulado + char.charCodeAt(0), 0)) % 360
  return `hsl(${hue}, 35%, 34%)`
}

function contarPorPerfil(usuarios: UsuarioListItem[] | undefined): Record<PerfilUsuario, number> {
  const contagem: Record<PerfilUsuario, number> = {
    Administrador: 0,
    Veterinário: 0,
    'Agente Sanitário': 0,
  }
  for (const usuario of usuarios ?? []) {
    for (const cargo of usuario.cargos) {
      if (cargo in contagem) contagem[cargo as PerfilUsuario] += 1
    }
  }
  return contagem
}

export function Usuarios() {
  const { user } = useAuth()
  const { data: usuarios, isLoading, isError, refetch } = useUsuariosQuery()
  const alterarStatus = useAlterarStatusUsuarioMutation()
  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioEmConfirmacao, setUsuarioEmConfirmacao] = useState<UsuarioListItem | null>(null)
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<UsuarioListItem | null>(null)
  const [usuarioRedefinindoSenha, setUsuarioRedefinindoSenha] = useState<UsuarioListItem | null>(null)
  const { filtros, definirFiltros, limparFiltros, filtrosAtivos } = useFiltrosLista('usuarios', FILTROS_PADRAO)
  const { busca } = filtros
  const perfilFiltro = filtros.perfil as PerfilUsuario | 'Todos'
  const statusFiltro = filtros.status as FiltroStatus

  const usuariosFiltrados = useMemo(() => {
    if (!usuarios) return []
    const buscaNormalizada = busca.trim().toLowerCase()

    return usuarios.filter((usuario) => {
      const nomeCompleto = `${usuario.nome} ${usuario.sobrenome}`.toLowerCase()
      const combinaBusca =
        !buscaNormalizada ||
        nomeCompleto.includes(buscaNormalizada) ||
        usuario.email.toLowerCase().includes(buscaNormalizada)
      const combinaPerfil = perfilFiltro === 'Todos' || usuario.cargos.includes(perfilFiltro)
      const combinaStatus =
        statusFiltro === 'Todos' ||
        (statusFiltro === 'Ativos' && usuario.ativo) ||
        (statusFiltro === 'Inativos' && !usuario.ativo)

      return combinaBusca && combinaPerfil && combinaStatus
    })
  }, [usuarios, busca, perfilFiltro, statusFiltro])

  const contagemPorPerfil = contarPorPerfil(usuarios)

  async function confirmarAlteracaoDeStatus(usuario: UsuarioListItem) {
    const nome = `${usuario.nome} ${usuario.sobrenome}`
    try {
      await alterarStatus.mutateAsync({ id: usuario.id, ativo: !usuario.ativo })
      avisar(usuario.ativo ? `${nome} foi desativado(a).` : `${nome} foi reativado(a).`)
    } catch (erro) {
      avisar(mensagemDeRegraDaApi(erro) ?? `Não foi possível alterar o acesso de ${nome}. Nada foi mudado.`, 'erro')
    } finally {
      setUsuarioEmConfirmacao(null)
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>
            Usuários do Sistema <span className="counter">{usuarios?.length ?? 0} usuários</span>
          </h1>
          <p className="subtitle">Gerencie acessos e perfis · Apenas Administradores podem criar, editar e desativar usuários</p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={() => setModalAberto(true)}>
            <Icon name="plus" size={14} />
            Adicionar Usuário
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ gap: 'var(--space-3)' }}>
        {PERFIS_USUARIO.map((perfil) => {
          const roleKey = roleKeyFromCargos([perfil])
          const role = ROLES[roleKey]
          return (
            <div className="role-card" key={perfil}>
              <span className="num">{contagemPorPerfil[perfil]}</span>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {perfil} <span className={`badge ${role.badgeCls}`}>{role.short}</span>
                </h4>
                <p>{role.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="filter-bar">
        <div className="search-input">
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            aria-label="Buscar usuários"
            value={busca}
            onChange={(event) => definirFiltros({ busca: event.target.value })}
          />
        </div>
        <select
          className="filter-select"
          aria-label="Filtrar por perfil"
          value={perfilFiltro}
          onChange={(event) => definirFiltros({ perfil: event.target.value })}
        >
          <option value="Todos">Perfil: Todos</option>
          {PERFIS_USUARIO.map((perfil) => (
            <option key={perfil} value={perfil}>
              {perfil}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          aria-label="Filtrar por status"
          value={statusFiltro}
          onChange={(event) => definirFiltros({ status: event.target.value })}
        >
          <option value="Todos">Status: Todos</option>
          <option value="Ativos">Ativos</option>
          <option value="Inativos">Inativos</option>
        </select>
        {filtrosAtivos && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={limparFiltros}>
            Limpar filtros
          </button>
        )}
      </div>

      {isLoading && <p className="subtitle">Carregando usuários…</p>}

      {isError && <ErroComRetry mensagem="Não foi possível carregar os usuários." onTentarNovamente={() => void refetch()} />}

      {!isLoading && !isError && usuariosFiltrados.length === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="users" size={28} />
          </span>
          <h3>Nenhum usuário encontrado</h3>
          <p>Ajuste os filtros ou cadastre um novo usuário.</p>
        </div>
      )}

      {!isLoading && !isError && usuariosFiltrados.length > 0 && (
        <div className="table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Último acesso</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => {
                  const roleKey = roleKeyFromCargos(usuario.cargos)
                  const role = ROLES[roleKey]
                  const nomeCompleto = `${usuario.nome} ${usuario.sobrenome}`
                  // Na própria conta, senha e acesso têm outro caminho (o backend recusa).
                  const ehOProprioUsuario = usuario.id === user?.id
                  return (
                    <tr key={usuario.id}>
                      <td>
                        <div className="animal-cell">
                          <div
                            className="avatar-i"
                            style={{ background: corAvatar(`${usuario.nome} ${usuario.sobrenome}`) }}
                          >
                            {iniciais(usuario.nome, usuario.sobrenome)}
                          </div>
                          <div>
                            <div className="name">
                              {usuario.nome} {usuario.sobrenome}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${role.badgeCls}`}>{usuario.cargos.join(', ')}</span>
                      </td>
                      <td>
                        {usuario.ativo ? (
                          <span className="badge badge-available">
                            <span className="badge-dot" />
                            Ativo
                          </span>
                        ) : (
                          <span className="badge badge-deceased">
                            <span className="badge-dot" />
                            Inativo
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {formatarData(usuario.ultimoAcesso, true)}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                          {formatarData(usuario.criadoEm)}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            aria-label={`Editar ${nomeCompleto}`}
                            onClick={() => setUsuarioEmEdicao(usuario)}
                          >
                            Editar
                          </button>
                          {!ehOProprioUsuario && (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                aria-label={`Redefinir senha de ${nomeCompleto}`}
                                onClick={() => setUsuarioRedefinindoSenha(usuario)}
                              >
                                Redefinir senha
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setUsuarioEmConfirmacao(usuario)}
                              >
                                {usuario.ativo ? 'Desativar' : 'Reativar'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              Mostrando <strong>{usuariosFiltrados.length}</strong> de <strong>{usuarios?.length ?? 0}</strong> usuários
            </span>
          </div>
        </div>
      )}

      {modalAberto && <CriarUsuarioModal onFechar={() => setModalAberto(false)} />}

      {usuarioEmEdicao && (
        <EditarUsuarioModal
          usuario={usuarioEmEdicao}
          ehOProprioUsuario={usuarioEmEdicao.id === user?.id}
          onFechar={() => setUsuarioEmEdicao(null)}
        />
      )}

      {usuarioRedefinindoSenha && (
        <RedefinirSenhaModal usuario={usuarioRedefinindoSenha} onFechar={() => setUsuarioRedefinindoSenha(null)} />
      )}

      {usuarioEmConfirmacao && (
        <ModalConfirmacao
          titulo={usuarioEmConfirmacao.ativo ? 'Desativar usuário' : 'Reativar usuário'}
          rotuloConfirmar={usuarioEmConfirmacao.ativo ? 'Desativar' : 'Reativar'}
          perigo={usuarioEmConfirmacao.ativo}
          processando={alterarStatus.isPending}
          onConfirmar={() => void confirmarAlteracaoDeStatus(usuarioEmConfirmacao)}
          onFechar={() => setUsuarioEmConfirmacao(null)}
        >
          <p>
            {usuarioEmConfirmacao.ativo
              ? `${usuarioEmConfirmacao.nome} ${usuarioEmConfirmacao.sobrenome} perderá o acesso ao SISZOO. O histórico continua preservado.`
              : `${usuarioEmConfirmacao.nome} ${usuarioEmConfirmacao.sobrenome} voltará a acessar o SISZOO.`}
          </p>
        </ModalConfirmacao>
      )}
    </>
  )
}
