import type { Denunciante } from '../types/ocorrencias.types'

interface CardDenuncianteProps {
  mascarado: boolean
  anonima: boolean
  denunciante: Denunciante | null
}

function valorCampo(valor: string | null, mascarado: boolean): string {
  if (valor !== null) return valor
  return mascarado ? 'Sigiloso' : '—'
}

function valorEndereco(denunciante: Denunciante, mascarado: boolean): string {
  const partes = [denunciante.endereco, denunciante.bairroResidencial, denunciante.cep].filter(
    (parte): parte is string => parte !== null,
  )
  if (partes.length === 0) return mascarado ? 'Sigiloso' : '—'
  return partes.join(' · ')
}

export function CardDenunciante({ mascarado, anonima, denunciante }: CardDenuncianteProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Denunciante</h3>
      </div>
      <div className="card-body">
        {anonima ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Denúncia anônima: ninguém sabe quem denunciou, e nenhum dado do denunciante é guardado.
          </p>
        ) : denunciante === null ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Nenhum denunciante registrado para esta ocorrência.
          </p>
        ) : (
          <div className="form-grid">
            <div className="field">
              <label>Nome</label>
              <div>{valorCampo(denunciante.nome, mascarado)}</div>
            </div>
            <div className="field">
              <label>CPF</label>
              <div className="mono">{valorCampo(denunciante.cpf, mascarado)}</div>
            </div>
            <div className="field">
              <label>Telefone</label>
              <div className="mono">{valorCampo(denunciante.telefone, mascarado)}</div>
            </div>
            <div className="field">
              <label>E-mail</label>
              <div>{valorCampo(denunciante.email, mascarado)}</div>
            </div>
            <div className="field full">
              <label>Endereço residencial</label>
              <div>{valorEndereco(denunciante, mascarado)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
