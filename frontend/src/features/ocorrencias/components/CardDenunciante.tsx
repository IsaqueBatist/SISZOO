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
              <span className="dado-rotulo">Nome</span>
              <div>{valorCampo(denunciante.nome, mascarado)}</div>
            </div>
            <div className="field">
              <span className="dado-rotulo">CPF</span>
              <div>{valorCampo(denunciante.cpf, mascarado)}</div>
            </div>
            <div className="field">
              <span className="dado-rotulo">Telefone</span>
              <div>{valorCampo(denunciante.telefone, mascarado)}</div>
            </div>
            <div className="field">
              <span className="dado-rotulo">E-mail</span>
              <div>{valorCampo(denunciante.email, mascarado)}</div>
            </div>
            <div className="field full">
              <span className="dado-rotulo">Endereço residencial</span>
              <div>{valorEndereco(denunciante, mascarado)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
