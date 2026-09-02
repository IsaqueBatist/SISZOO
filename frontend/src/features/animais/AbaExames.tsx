import { Icon } from '../../components/layout/Icon'

// Placeholder: não existe nenhuma camada de backend para Exame ainda (sem
// entidade, migration, DTO ou controller — ver "feedback de backend" do PR
// de T22). Decisão confirmada: mostrar essa aba como indisponível nesta
// entrega, em vez de simular dados ou omitir a aba por completo.
export function AbaExames() {
  return (
    <div className="empty">
      <span className="ico">
        <Icon name="clipboard" size={28} />
      </span>
      <h3>Exames laboratoriais estarão disponíveis em uma versão futura do sistema</h3>
      <p>Este módulo ainda não foi implementado no backend do SISZOO.</p>
    </div>
  )
}
