import { useState, type KeyboardEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '@/components/layout/Icon'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { diasCivisAteHoje, formatarDataBR } from '@/lib/datas'
import { AbaExames } from './AbaExames'
import { AbaHistorico } from './AbaHistorico'
import { AbaMedicamentos } from './AbaMedicamentos'
import { AbaProcedimentos } from './AbaProcedimentos'
import { AbaVacinas } from './AbaVacinas'
import { AnexosAnimal } from './AnexosAnimal'
import './FichaAnimal.css'
import { badgeDeEspecie, badgeDeStatus } from '../utils/statusBadge'
import { useAnimalQuery } from '../hooks/useAnimais'
import { formatarPorte, formatarSexo } from '../utils/rotulosAnimal'

type TabKey = 'historico' | 'vacinas' | 'procedimentos' | 'medicamentos' | 'exames'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'historico', label: 'Histórico' },
  { key: 'vacinas', label: 'Vacinas' },
  { key: 'procedimentos', label: 'Procedimentos/Cirurgias' },
  { key: 'medicamentos', label: 'Medicamentos' },
  { key: 'exames', label: 'Exames' },
]

// Nascimento e castração são LocalDate: `new Date('AAAA-MM-DD')` mostraria o
// dia anterior em São Paulo (ver lib/datas.ts).
const formatarData = formatarDataBR

// atualizadoEm é LocalDateTime de Itu: conta dias civis em Itu (ontem às 23h
// é "há 1 dia" às 8h de hoje), sem `new Date(iso)`, que dependeria do fuso do
// navegador.
function formatarRelativo(iso: string): string {
  const dias = diasCivisAteHoje(iso)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'há 1 dia'
  return `há ${dias} dias`
}

export function FichaAnimal() {
  const { id } = useParams<{ id: string }>()
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet'

  const { data: animal, isLoading, isError } = useAnimalQuery(id)
  const [tab, setTab] = useState<TabKey>('historico')
  const [refreshKey, setRefreshKey] = useState(0)

  function handleRegistroCriado() {
    setRefreshKey((atual) => atual + 1)
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, indiceAtual: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const proximoIndice =
      event.key === 'ArrowRight' ? (indiceAtual + 1) % TABS.length : (indiceAtual - 1 + TABS.length) % TABS.length
    const proximaTab = TABS[proximoIndice]
    setTab(proximaTab.key)
    document.getElementById(`tab-btn-${proximaTab.key}`)?.focus()
  }

  if (isLoading) {
    return <p>Carregando ficha do animal…</p>
  }

  if (isError || !animal || !id) {
    return (
      <>
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar este animal.</div>
        </div>
        <Link to="/animais" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          ← Voltar para Animais
        </Link>
      </>
    )
  }

  const especieBadge = badgeDeEspecie(animal.especieCodigo, animal.especieNome)
  const statusBadge = badgeDeStatus(animal.statusCodigo, animal.statusNome)

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <Link to="/animais" className="btn btn-ghost btn-sm">
              ← Voltar
            </Link>
            <span className={`badge ${especieBadge.classe}`}>{especieBadge.label}</span>
            <span className={`badge ${statusBadge.classe}`}>
              <span className="badge-dot" aria-hidden="true" style={{ background: 'currentColor' }} />
              {statusBadge.label}
            </span>
          </div>
          <h1>{animal.nome}</h1>
          <p className="subtitle">
            {/* fichaCompleta vem do backend (FichaCompletaService, DER §3.2); o protótipo só desenha o estado completo. */}
            {animal.fichaCompleta ? (
              'Ficha completa'
            ) : (
              <strong style={{ color: 'var(--color-warning)' }}>Ficha incompleta</strong>
            )}{' '}
            · No CCZ desde {formatarData(animal.dataEntrada)} · Última atualização {formatarRelativo(animal.atualizadoEm)}
          </p>
        </div>
        {podeEscrever && (
          <div className="actions">
            <Link to={`/animais/${animal.id}/editar`} className="btn btn-primary">
              <Icon name="edit" size={14} />
              Editar ficha
            </Link>
          </div>
        )}
      </div>

      <div className="ficha-grid">
        <div className="identity-card card" style={{ padding: 0 }}>
          <div className="id-photo">
            {animal.fotoUrl ? (
              <img
                src={animal.fotoUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Icon name="paw" size={64} />
              </div>
            )}
          </div>
          <div className="id-info">
            <div className="name-row">
              <div>
                <h2>{animal.nome}</h2>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {[animal.raca, animal.coloracao, animal.pelagem === 'curta' ? 'Pelagem curta' : animal.pelagem === 'longa' ? 'Pelagem longa' : null]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </div>
              </div>
            </div>
            <div className="kv-list">
              <div className="kv-row">
                <span className="k">Microchip</span>
                <span className="v mono">{animal.microchip ?? '—'}</span>
              </div>
              <div className="kv-row">
                <span className="k">Implantação do chip</span>
                <span className="v">{animal.dataImplantacaoChip ? formatarDataBR(animal.dataImplantacaoChip) : '—'}</span>
              </div>
              <div className="kv-row">
                <span className="k">Medalha</span>
                <span className="v mono">{animal.numeroMedalha ?? '—'}</span>
              </div>
              <div className="kv-row">
                <span className="k">Procedência</span>
                <span className="v">{animal.procedencia ?? '—'}</span>
              </div>
              {animal.statusCodigo === 'obito_eutanasia' && (
                <div className="kv-row">
                  <span className="k">Laudo de eutanásia</span>
                  <span className="v">{animal.laudoEutanasia ?? '— (não informado)'}</span>
                </div>
              )}
              <div className="kv-row">
                <span className="k">Espécie</span>
                <span className="v">{animal.especieNome}</span>
              </div>
              <div className="kv-row">
                <span className="k">Sexo</span>
                <span className="v">{formatarSexo(animal.sexo)}</span>
              </div>
              <div className="kv-row">
                <span className="k">Porte</span>
                <span className="v">{formatarPorte(animal.porte)}</span>
              </div>
              <div className="kv-row">
                <span className="k">Raça</span>
                <span className="v">{animal.raca ?? '—'}</span>
              </div>
              <div className="kv-row">
                <span className="k">Nasc. aprox.</span>
                <span className="v mono">{animal.dataNascimentoAprox ? formatarData(animal.dataNascimentoAprox) : animal.idadeAprox ?? '—'}</span>
              </div>
              <div className="kv-row">
                <span className="k">Baia atual</span>
                <span className="v">{animal.baiaNome ?? '—'}</span>
              </div>
              <div className="kv-row">
                <span className="k">Castrado</span>
                <span className="v">
                  {animal.esterilizado ? `Sim${animal.dataEsterilizacao ? ` (${formatarData(animal.dataEsterilizacao)})` : ''}` : 'Não'}
                </span>
              </div>
            </div>
          </div>

          <div className="section-title">Entrada</div>
          <div className="section-pad">
            <div className="kv-list">
              <div className="kv-row">
                <span className="k">Motivo</span>
                <span className="v">{animal.motivoEntradaNome}</span>
              </div>
              <div className="kv-row">
                <span className="k">Data</span>
                <span className="v mono">{formatarData(animal.dataEntrada)}</span>
              </div>
            </div>
          </div>

          {/* F2-007 / RF-A04: documentos e fotos do animal (Quadro 69). */}
          <AnexosAnimal animalId={id} podeEscrever={podeEscrever} />
        </div>

        <div className="right-panel">
          <div className="card layout-tabs">
            <div className="tabs" role="tablist" aria-label="Histórico veterinário">
              {TABS.map((item, indice) => (
                <button
                  key={item.key}
                  id={`tab-btn-${item.key}`}
                  role="tab"
                  aria-selected={tab === item.key}
                  aria-controls={`tab-${item.key}`}
                  tabIndex={tab === item.key ? 0 : -1}
                  className={`tab${tab === item.key ? ' active' : ''}`}
                  onClick={() => setTab(item.key)}
                  onKeyDown={(event) => handleTabKeyDown(event, indice)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {/* Só a aba ativa é montada: cada aba dispara sua própria query (e a
                timeline faz merge de 3), então montar as 5 de uma vez faria
                requisições desnecessárias para abas que o usuário nem abriu —
                contraria "evitar N+1"/leveza exigida pela infra. Diferente do
                protótipo estático (que mantém todas no DOM e só esconde via
                CSS), aqui cada troca de aba desmonta a anterior. */}
            <div className="tab-content">
              <div className="tab-pane active" id={`tab-${tab}`} role="tabpanel" aria-labelledby={`tab-btn-${tab}`}>
                {tab === 'historico' && <AbaHistorico animalId={id} animal={animal} refreshKey={refreshKey} />}
                {tab === 'vacinas' && <AbaVacinas animalId={id} onRegistroCriado={handleRegistroCriado} />}
                {tab === 'procedimentos' && (
                  <AbaProcedimentos animalId={id} onRegistroCriado={handleRegistroCriado} />
                )}
                {tab === 'medicamentos' && (
                  <AbaMedicamentos animalId={id} onRegistroCriado={handleRegistroCriado} />
                )}
                {tab === 'exames' && <AbaExames animalId={id} onRegistroCriado={handleRegistroCriado} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
