// D40: lista, detalhe e wizard de processos seguem sobre o mock em memória até
// a task de processos. O aviso deixa explícito na tela que esses dados são
// fictícios e não se misturam com as ocorrências reais.
export function AvisoDemonstracao() {
  return (
    <div className="alert warning" role="note" aria-label="Dados de demonstração">
      <span className="bullet" />
      <div className="alert-content">
        Dados de demonstração: o módulo de processos ainda não está integrado. Os processos e as ocorrências
        exibidos nesta área são fictícios.
      </div>
    </div>
  )
}
