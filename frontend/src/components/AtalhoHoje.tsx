import { hojeEmItu } from '@/lib/datas'

interface AtalhoHojeProps {
  onEscolher: (hoje: string) => void
}

// Data de um fato (aplicação, coleta, laudo) não vem preenchida: quem digita
// depois do fato poderia aceitar "hoje" sem perceber. Um clique resolve o caso
// comum, e a data do registro continua sendo gravada pelo servidor.
export function AtalhoHoje({ onEscolher }: AtalhoHojeProps) {
  return (
    <button type="button" className="atalho-data" aria-label="Preencher com a data de hoje" onClick={() => onEscolher(hojeEmItu())}>
      Hoje
    </button>
  )
}
