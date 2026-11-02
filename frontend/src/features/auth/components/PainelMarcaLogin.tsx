import { Icon } from '@/components/layout/Icon'

export function PainelMarcaLogin() {
  return (
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
        <p className="login-marca">Sistema de Gestão do Centro de Controle de Zoonoses</p>
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
  )
}
