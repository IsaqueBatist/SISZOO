import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROLES, ROLE_STORAGE_KEY, type RoleKey } from '../../lib/nav'
import { Icon } from '../../components/layout/Icon'
import './Login.css'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('stephanie.lima@itu.sp.gov.br')
  const [senha, setSenha] = useState('senha-de-exemplo')
  const [senhaVisivel, setSenhaVisivel] = useState(false)

  function entrarComo(roleKey: RoleKey) {
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, roleKey)
    } catch {
      /* localStorage indisponível */
    }
    navigate('/dashboard')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    entrarComo('vet')
  }

  return (
    <div className="login-shell">
      <section className="login-brand">
        <div className="paws">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#fff" opacity={0.06} style={{ top: 80, left: 60 }}>
            <circle cx="6" cy="9" r="2" />
            <circle cx="10" cy="5" r="2" />
            <circle cx="14" cy="5" r="2" />
            <circle cx="18" cy="9" r="2" />
            <path d="M12 11c-3 0-5 2.5-5 5 0 2 1.5 3 3 3 1 0 1.5-.5 2-.5s1 .5 2 .5c1.5 0 3-1 3-3 0-2.5-2-5-5-5z" />
          </svg>
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="#fff"
            opacity={0.05}
            style={{ bottom: 100, right: 40, transform: 'rotate(20deg)' }}
          >
            <circle cx="6" cy="9" r="2" />
            <circle cx="10" cy="5" r="2" />
            <circle cx="14" cy="5" r="2" />
            <circle cx="18" cy="9" r="2" />
            <path d="M12 11c-3 0-5 2.5-5 5 0 2 1.5 3 3 3 1 0 1.5-.5 2-.5s1 .5 2 .5c1.5 0 3-1 3-3 0-2.5-2-5-5-5z" />
          </svg>
        </div>
        <div className="head">
          <div className="wm">
            <span className="mark">
              <Icon name="paw" size={22} />
            </span>
            SISZOO
          </div>
          <div className="tagline">CCZ Itu</div>
        </div>
        <div className="center">
          <h1>Sistema de Gestão do Centro de Controle de Zoonoses</h1>
          <p>
            Plataforma unificada para gestão de animais, ocorrências, investigações sanitárias e
            relatórios da Prefeitura Municipal de Itu.
          </p>
        </div>
        <div className="footer">
          <span>Prefeitura Municipal de Itu</span>
          <span>v 1.2.0 · 2026</span>
        </div>
      </section>

      <section className="login-form-area">
        <form className="login-card" onSubmit={handleSubmit}>
          <div>
            <h2>Bem-vinda ao SISZOO</h2>
            <p className="lead">Faça login com suas credenciais institucionais.</p>
          </div>

          <div className="field">
            <label htmlFor="email">
              E-mail institucional <span className="req">*</span>
            </label>
            <div className="input-with-icon">
              <span className="ico">
                <Icon name="mail" size={16} />
              </span>
              <input
                id="email"
                className="input"
                type="email"
                placeholder="nome.sobrenome@itu.sp.gov.br"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="senha">
              Senha <span className="req">*</span>
            </label>
            <div className="input-with-icon">
              <span className="ico">
                <Icon name="lock" size={16} />
              </span>
              <input
                id="senha"
                className="input"
                type={senhaVisivel ? 'text' : 'password'}
                placeholder="••••••••"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
              />
              <button
                type="button"
                className="right-btn"
                title="Mostrar senha"
                onClick={() => setSenhaVisivel((value) => !value)}
              >
                <Icon name="eye" size={16} />
              </button>
            </div>
          </div>

          <div className="actions-row">
            <label className="check">
              <input type="checkbox" /> Manter conectado
            </label>
            <a href="#esqueci-senha" onClick={(event) => event.preventDefault()}>
              Esqueci minha senha
            </a>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block">
            Entrar
          </button>

          <div className="role-hints">
            <div className="hint-title">Acesso de demonstração — clique para entrar</div>
            {(Object.entries(ROLES) as [RoleKey, (typeof ROLES)[RoleKey]][]).map(([key, role]) => (
              <button
                type="button"
                key={key}
                className="hint-row"
                onClick={() => entrarComo(key)}
              >
                <span className={`badge ${role.badgeCls}`}>{role.short}</span>
                <span className="email">{role.email}</span>
              </button>
            ))}
          </div>

          <div className="login-foot">
            SISZOO <span className="version">v 1.2.0</span> · © 2026 Prefeitura Municipal de Itu
          </div>
        </form>
      </section>
    </div>
  )
}
