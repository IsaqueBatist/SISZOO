import type { AnexosPendentesOcorrencia } from '../storage/rascunhoOcorrenciaStorage'
import type { FalhaEnvioAnexo } from '../hooks/useAnexosPendentes'
import { formatarProtocoloOcorrencia } from '../utils/protocolo'

interface AvisoAnexosPendentesProps {
  pendencia: AnexosPendentesOcorrencia
  falhas: FalhaEnvioAnexo[]
  reenvioInutil: boolean
  enviando: boolean
  onReenviar: () => void
  onDescartar: () => void
}

// Aviso do D15 — aparece no cadastro e no detalhe da ocorrência dona dos
// anexos. "Descartar" só esquece os arquivos locais; a ocorrência continua.
// Recusa definitiva (422/413) não tem conserto reenviando: o aviso diz isso e,
// quando nada mais pode subir, "Descartar" vira a única ação.
export function AvisoAnexosPendentes({
  pendencia,
  falhas,
  reenvioInutil,
  enviando,
  onReenviar,
  onDescartar,
}: AvisoAnexosPendentesProps) {
  const temRecusaDefinitiva = falhas.some((falha) => falha.definitiva)
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
        {temRecusaDefinitiva && (
          <p style={{ margin: '6px 0 0' }}>
            O servidor recusou {reenvioInutil ? 'os arquivos acima' : 'parte dos arquivos'} e reenviar não vai resolver.
            Use "Descartar" para liberar o registro: a ocorrência continua registrada, só sem esses anexos.
          </p>
        )}
        <div className="flex gap-2" style={{ marginTop: 8 }}>
          {!reenvioInutil && (
            <button type="button" className="btn btn-sm btn-primary" onClick={onReenviar} disabled={enviando}>
              {enviando ? 'Enviando…' : 'Reenviar'}
            </button>
          )}
          <button
            type="button"
            className={`btn btn-sm ${reenvioInutil ? 'btn-primary' : 'btn-ghost'}`}
            onClick={onDescartar}
            disabled={enviando}
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  )
}
