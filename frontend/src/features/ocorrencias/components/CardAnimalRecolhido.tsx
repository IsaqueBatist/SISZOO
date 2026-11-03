import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import { podeAcessar } from '@/lib/nav'
import type { Animal } from '@/features/animais/types/animais.types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { BuscaAnimalCanil } from '@/features/processos/components/BuscaAnimalCanil'
import '@/features/processos/components/ProcessoForm.css'
import type { Ocorrencia } from '../types/ocorrencias.types'
import { useVincularAnimalMutation } from '../hooks/useOcorrencias'

interface CardAnimalRecolhidoProps {
  ocorrencia: Ocorrencia
  podeVincular: boolean
}

export function CardAnimalRecolhido({ ocorrencia, podeVincular }: CardAnimalRecolhidoProps) {
  const [selecionado, setSelecionado] = useState<Animal | null>(null)
  const [trocando, setTrocando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const vincular = useVincularAnimalMutation(ocorrencia.id)
  const { roleKey } = useAuth()
  const podeVerFichaAnimal = podeAcessar(roleKey, 'animais')
  const vinculado = ocorrencia.animalVinculado
  const encerrada = ocorrencia.statusOcorrencia === 'ENCERRADA'
  const podeEscolher = podeVincular && (!vinculado || (!encerrada && trocando))

  async function confirmar() {
    if (!selecionado) return
    setErro(null)
    try {
      await vincular.mutateAsync(selecionado.id)
      setSelecionado(null)
      setTrocando(false)
    } catch (falha) {
      setErro(mensagemDeRegraDaApi(falha) ?? 'Não foi possível vincular o animal. Tente novamente.')
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Animal recolhido</h3>
      </div>
      <div className="card-body">
        {vinculado ? (
          <div className="kv-list">
            <div className="kv-row">
              <span className="k">Animal</span>
              <span className="v">
                {podeVerFichaAnimal ? <Link to={`/animais/${vinculado.id}`}>{vinculado.nome}</Link> : vinculado.nome}
              </span>
            </div>
            <div className="kv-row">
              <span className="k">Microchip</span>
              <span className="v mono">{vinculado.microchip ?? '—'}</span>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
            Nenhum animal recolhido vinculado a esta ocorrência.
          </p>
        )}

        {podeVincular && vinculado && !encerrada && !trocando && (
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setTrocando(true)}>
            Trocar animal
          </button>
        )}

        {podeEscolher && (
          <div style={{ marginTop: 8 }}>
            {encerrada && (
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Depois do encerramento, o animal pode ser vinculado uma única vez e não poderá ser trocado.
              </p>
            )}
            <BuscaAnimalCanil rotulo="Buscar animal recolhido por nome ou microchip" onSelecionar={setSelecionado} />
            {selecionado && (
              <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13 }}>
                  <strong>{selecionado.nome}</strong>{' '}
                  <span className="mono">{selecionado.microchip ?? 'sem microchip'}</span>
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={vincular.isPending}
                  aria-busy={vincular.isPending || undefined}
                  onClick={() => void confirmar()}
                >
                  {vincular.isPending ? 'Vinculando…' : 'Vincular animal'}
                </button>
              </div>
            )}
            {trocando && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setTrocando(false)
                  setSelecionado(null)
                  setErro(null)
                }}
              >
                Cancelar troca
              </button>
            )}
          </div>
        )}

        {erro && (
          <div className="alert danger" role="alert" style={{ marginTop: 8 }}>
            <div className="alert-content">{erro}</div>
          </div>
        )}
      </div>
    </div>
  )
}
