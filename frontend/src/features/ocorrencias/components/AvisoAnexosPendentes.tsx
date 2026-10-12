import type { AnexosPendentesOcorrencia } from '../storage/rascunhoOcorrenciaStorage'
import type { FalhaEnvioAnexo } from '../hooks/useAnexosPendentes'
import { formatarProtocoloOcorrencia } from '../utils/protocolo'

interface AvisoAnexosPendentesProps {
  pendencia: AnexosPendentesOcorrencia
  falhas: FalhaEnvioAnexo[]
  enviando: boolean
  onReenviar: () => void
  onDescartar: () => void
}

// Aviso do D15 — aparece no cadastro e no detalhe da ocorrência dona dos
// anexos. "Descartar" só esquece os arquivos locais; a ocorrência continua.
export function AvisoAnexosPendentes({ pendencia, falhas, enviando, onReenviar, onDescartar }: AvisoAnexosPendentesProps) {
  return (
    <div className="alert warning" role="alert">
      <span className="bullet" />
      <div className="alert-content">
        Há anexos pendentes da ocorrência {formatarProtocoloOcorrencia(pendencia.protocolo)}
        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          {pendencia.anexos.map((arquivo, indice) => (
            <li key={`${arquivo.name}-${indice}`}>{arquivo.name}</li>
          ))}
        </ul>
        {falhas.length > 0 && (
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {falhas.map((falha, indice) => (
              <li key={`${falha.nome}-${indice}`}>
                {falha.nome}: {falha.mensagem}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-sm btn-primary" onClick={onReenviar} disabled={enviando}>
            {enviando ? 'Enviando…' : 'Reenviar'}
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onDescartar} disabled={enviando}>
            Descartar
          </button>
        </div>
      </div>
    </div>
  )
}
