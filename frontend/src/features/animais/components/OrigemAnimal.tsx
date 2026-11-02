import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOrigemDoAnimalQuery } from '@/features/ocorrencias/hooks/useOcorrencias'
import { formatarProtocoloOcorrencia } from '@/features/ocorrencias/utils/protocolo'
import { formatarDataBR } from '@/lib/datas'
import { podeAcessar } from '@/lib/nav'

export function OrigemAnimal({ animalId }: { animalId: string }) {
  const { roleKey } = useAuth()
  const { data, isLoading, isError } = useOrigemDoAnimalQuery(animalId)
  const linkOcorrencia = podeAcessar(roleKey, 'ocorrencias')
  const origens = data ?? []

  return (
    <>
      <div className="section-title">Origem</div>
      <div className="section-pad">
        {isLoading && <p className="hint">Carregando origem…</p>}
        {isError && <p className="hint">Não foi possível carregar a ocorrência de origem.</p>}
        {!isLoading && !isError && origens.length === 0 && (
          <p className="hint">Nenhuma ocorrência de origem vinculada.</p>
        )}
        {origens.length > 0 && (
          <div className="kv-list">
            {origens.map((origem) => {
              const protocolo = formatarProtocoloOcorrencia(origem.protocolo)
              return (
                <div className="kv-row" key={origem.ocorrenciaId}>
                  <span className="k">Ocorrência</span>
                  <span className="v">
                    {linkOcorrencia ? (
                      <Link to={`/ocorrencias/${origem.ocorrenciaId}`}>{protocolo}</Link>
                    ) : (
                      <span className="mono">{protocolo}</span>
                    )}
                    {!origem.sigilosa && origem.tipoOcorrenciaNome && (
                      <>
                        {' · '}
                        {origem.tipoOcorrenciaNome}
                        {origem.dataAbertura ? ` · ${formatarDataBR(origem.dataAbertura)}` : ''}
                      </>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
