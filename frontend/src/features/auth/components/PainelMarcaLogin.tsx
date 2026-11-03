import { Icon } from '@/components/layout/Icon'

export function PainelMarcaLogin() {
  return (
    <section className="login-brand">
      <div className="head">
        <span className="mark">
          <Icon name="paw" size={18} />
        </span>
        <span className="wm">SISZOO</span>
      </div>
      <div className="center">
        <p className="login-marca">Sistema de Gestão do Centro de Controle de Zoonoses</p>
        <p>Animais sob custódia, ocorrências, processos sanitários e relatórios do CCZ de Itu.</p>
      </div>
      <div className="footer">
        <span>Prefeitura Municipal de Itu</span>
        <span>v 1.2.0</span>
      </div>
    </section>
  )
}
