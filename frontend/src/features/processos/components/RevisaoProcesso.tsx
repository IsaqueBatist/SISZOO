import { labelDeTipo } from '@/features/ocorrencias/utils/statusBadge'
import type { ProcessoFormValues } from '../schemas/processoFormSchema'
import { labelDeDoenca, labelDeLaboratorio, MATERIAL_BIOLOGICO_OPCOES, SINTOMA_OPCOES, STATUS_CLINICO_OPCOES, TIPO_ABRIGO_OPCOES } from '../utils/processosCatalogos'
import type { OcorrenciaParaVinculo } from '../types/processos.types'

function labelDe<T extends string>(opcoes: { valor: T; label: string }[], valor: T | undefined): string {
  if (!valor) return '—'
  return opcoes.find((opcao) => opcao.valor === valor)?.label ?? valor
}

interface RevisaoProcessoProps {
  valores: ProcessoFormValues
  ocorrenciaVinculada: OcorrenciaParaVinculo | null
  onEditar: (etapa: 2 | 3) => void
}

// Etapa 4 — somente leitura. Sem link de edição para a etapa 1 (RN2: o
// vínculo é imutável depois de definido).
export function RevisaoProcesso({ valores, ocorrenciaVinculada, onEditar }: RevisaoProcessoProps) {
  const urgente = valores.amostras.some((amostra) => amostra.contatoHumano)

  return (
    <div className="col gap-4">
      <div className="card">
        <div className="card-header">
          <h3>Dados do processo</h3>
        </div>
        <div className="card-body">
          {urgente && <span className="badge badge-urgent" style={{ marginBottom: 10, display: 'inline-block' }}>🚨 URGENTE</span>}
          <div className="kv-list">
            <div className="field">
              <label>Vínculo com ocorrência</label>
              <div>
                {valores.vinculoDecisao === 'vinculado' && ocorrenciaVinculada
                  ? `${ocorrenciaVinculada.protocolo} — ${labelDeTipo(ocorrenciaVinculada.tipoOcorrencia)}`
                  : 'Sem vínculo'}
              </div>
            </div>
            <div className="field">
              <label>Data de abertura</label>
              <div>{valores.dataAbertura}</div>
            </div>
            <div className="field">
              <label>Doença investigada</label>
              <div>{labelDeDoenca(valores.doenca)}</div>
            </div>
            <div className="field">
              <label>Laboratório de destino</label>
              <div>{labelDeLaboratorio(valores.laboratorio)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Responsável / munícipe</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEditar(2)}>
            Editar
          </button>
        </div>
        <div className="card-body">
          <div className="kv-list">
            <div className="field">
              <label>Nome</label>
              <div>{valores.responsavel.nome}</div>
            </div>
            <div className="field">
              <label>CPF</label>
              <div className="mono">{valores.responsavel.cpf || '—'}</div>
            </div>
            <div className="field">
              <label>Telefone</label>
              <div className="mono">{valores.responsavel.telefone || '—'}</div>
            </div>
            <div className="field">
              <label>E-mail</label>
              <div>{valores.responsavel.email || '—'}</div>
            </div>
            <div className="field full">
              <label>Endereço</label>
              <div>
                {valores.responsavel.endereco || '—'}
                {valores.responsavel.bairroResidencial ? ` · ${valores.responsavel.bairroResidencial}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Amostras ({valores.amostras.length})</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEditar(3)}>
            Editar
          </button>
        </div>
        <div className="card-body col gap-3">
          {valores.amostras.map((amostra, indice) => (
            <div key={indice} className="animal-amostra-mini">
              <div className="am-head-mini">
                <span className="title">
                  <span className="num-circle">{indice + 1}</span>
                  {amostra.origem === 'canil' ? 'Animal do canil' : 'Animal externo'}
                </span>
                {amostra.contatoHumano && <span className="badge badge-urgent">Contato humano</span>}
              </div>
              <div className="kv-list">
                <div className="field">
                  <label>Espécie / sexo</label>
                  <div>
                    {amostra.especieId} · {amostra.sexo}
                  </div>
                </div>
                <div className="field">
                  <label>Status clínico</label>
                  <div>{labelDe(STATUS_CLINICO_OPCOES, amostra.statusClinico)}</div>
                </div>
                <div className="field">
                  <label>Tipo de abrigo</label>
                  <div>{labelDe(TIPO_ABRIGO_OPCOES, amostra.tipoAbrigo)}</div>
                </div>
                <div className="field">
                  <label>Material biológico</label>
                  <div>{labelDe(MATERIAL_BIOLOGICO_OPCOES, amostra.materialBiologico)}</div>
                </div>
                <div className="field">
                  <label>Data de coleta</label>
                  <div>{amostra.dataColeta}</div>
                </div>
                <div className="field full">
                  <label>Sintomas</label>
                  <div>{amostra.sintomas.length ? amostra.sintomas.map((s) => labelDe(SINTOMA_OPCOES, s)).join(', ') : '—'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
