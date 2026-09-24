import type { Denunciante } from './ocorrencias.types'

interface CardDenuncianteProps {
  sigilosa: boolean
  denunciante: Denunciante | null
}

// O backend é quem decide mascarar (DER.md §3.4: campos pessoais vêm `null`
// quando `sigilosa = true` e o perfil autenticado não é admin) — aqui só
// interpretamos o que já chegou: campo nulo numa ocorrência sigilosa vira o
// placeholder "Sigiloso"; campo nulo numa ocorrência não sigilosa é só um
// dado ausente ("—"). O componente nunca decide sozinho quem pode ver.
function valorCampo(valor: string | null, sigilosa: boolean): string {
  if (valor !== null) return valor
  return sigilosa ? 'Sigiloso' : '—'
}

// Endereço residencial combina 3 campos (endereco/bairroResidencial/cep) —
// se todos vierem null, mostra um único "Sigiloso"/"—" em vez de repetir o
// placeholder 3 vezes separado por "·".
function valorEndereco(denunciante: Denunciante, sigilosa: boolean): string {
  const partes = [denunciante.endereco, denunciante.bairroResidencial, denunciante.cep].filter(
    (parte): parte is string => parte !== null,
  )
  if (partes.length === 0) return sigilosa ? 'Sigiloso' : '—'
  return partes.join(' · ')
}

export function CardDenunciante({ sigilosa, denunciante }: CardDenuncianteProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Denunciante</h3>
      </div>
      <div className="card-body">
        {denunciante === null ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Nenhum denunciante registrado para esta ocorrência.
          </p>
        ) : (
          <div className="form-grid">
            <div className="field">
              <label>Nome</label>
              <div>{valorCampo(denunciante.nome, sigilosa)}</div>
            </div>
            <div className="field">
              <label>CPF</label>
              <div className="mono">{valorCampo(denunciante.cpf, sigilosa)}</div>
            </div>
            <div className="field">
              <label>Telefone</label>
              <div className="mono">{valorCampo(denunciante.telefone, sigilosa)}</div>
            </div>
            <div className="field">
              <label>E-mail</label>
              <div>{valorCampo(denunciante.email, sigilosa)}</div>
            </div>
            <div className="field full">
              <label>Endereço residencial</label>
              <div>{valorEndereco(denunciante, sigilosa)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
