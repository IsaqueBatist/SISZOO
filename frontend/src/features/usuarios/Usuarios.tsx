import { useMemo, useState } from 'react'
import { Icon } from '../../components/layout/Icon'
import { ROLES, roleKeyFromCargos } from '../../lib/nav'
import { useAlterarStatusUsuarioMutation, useUsuariosQuery } from './useUsuarios'
import { PERFIS_USUARIO, type PerfilUsuario, type UsuarioListItem } from './usuarios.types'
import { CriarUsuarioModal } from './CriarUsuarioModal'
import './Usuarios.css'

type FiltroStatus = 'Todos' | 'Ativos' | 'Inativos'

const FUSO_ITU = 'America/Sao_Paulo'

function formatarData(iso: string | null, comHora = false): string {
  if (!iso) return '—'
  const data = new Date(iso)
  const opcoes: Intl.DateTimeFormatOptions = comHora
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: FUSO_ITU }
    : { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO_ITU }
  return new Intl.DateTimeFormat('pt-BR', opcoes).format(data)
}

function iniciais(nome: string, sobrenome: string): string {
  return `${nome[0] ?? ''}${sobrenome[0] ?? ''}`.toUpperCase()
}

function corAvatar(seed: string): string {
  const hue = Math.abs([...seed].reduce((acumulado, char) => acumulado + char.charCodeAt(0), 0)) % 360
  return `hsl(${hue}, 35%, 50%)`
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
  const { data: usuarios, isLoading, isError } = useUsuariosQuery()
  const alterarStatus = useAlterarStatusUsuarioMutation()
  const [modalAberto, setModalAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [perfilFiltro, setPerfilFiltro] = useState<PerfilUsuario | 'Todos'>('Todos')
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>('Todos')

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

  function handleAlterarStatus(usuario: UsuarioListItem) {
    const acao = usuario.ativo ? 'desativar' : 'reativar'
    const confirmado = window.confirm(
      `Tem certeza que deseja ${acao} o usuário ${usuario.nome} ${usuario.sobrenome}?`,
    )
    if (!confirmado) return
    alterarStatus.mutate({ id: usuario.id, ativo: !usuario.ativo })
  }

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>
            Usuários do Sistema <span className="counter">{usuarios?.length ?? 0} usuários</span>
          </h1>
          <p className="subtitle">Gerencie acessos e perfis · Apenas Administradores podem criar e desativar usuários</p>
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
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={perfilFiltro}
          onChange={(event) => setPerfilFiltro(event.target.value as PerfilUsuario | 'Todos')}
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
          value={statusFiltro}
          onChange={(event) => setStatusFiltro(event.target.value as FiltroStatus)}
        >
          <option value="Todos">Status: Todos</option>
          <option value="Ativos">Ativos</option>
          <option value="Inativos">Inativos</option>
        </select>
      </div>

      {isLoading && <p className="subtitle">Carregando usuários…</p>}

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar os usuários. Tente novamente.</div>
        </div>
      )}

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
                  <th style={{ width: 90 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => {
                  const roleKey = roleKeyFromCargos(usuario.cargos)
                  const role = ROLES[roleKey]
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
                            className="btn btn-ghost btn-sm btn-icon-only"
                            disabled
                            title="Edição de usuário — disponível em tarefa futura"
                            aria-label="Edição de usuário — disponível em tarefa futura"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleAlterarStatus(usuario)}
                          >
                            {usuario.ativo ? 'Desativar' : 'Reativar'}
                          </button>
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
    </>
  )
}
