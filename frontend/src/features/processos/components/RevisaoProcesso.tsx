import { Icon } from '@/components/layout/Icon'
import { useCatalogosAnimaisQuery } from '@/features/animais/hooks/useAnimais'
import { formatarDataBR } from '@/lib/datas'
import { SEXO_OPCOES } from '@/features/animais/schemas/animalFormSchema'
import { formatarProtocoloOcorrencia } from '@/features/ocorrencias/utils/protocolo'
import type { ProcessoFormValues } from '../schemas/processoFormSchema'
import type { CatalogosProcesso } from '../types/processos.types'
import { labelDe, MATERIAL_BIOLOGICO_OPCOES, NIVEL_CONTATO_OPCOES, STATUS_CLINICO_OPCOES, TIPO_ABRIGO_OPCOES } from '../utils/processosCatalogos'
import { nomeNoCatalogo } from '@/lib/catalogos'

interface RevisaoProcessoProps {
  valores: ProcessoFormValues
  catalogos: CatalogosProcesso | undefined
  onEditar: (etapa: 2 | 3) => void
}

export function RevisaoProcesso({ valores, catalogos, onEditar }: RevisaoProcessoProps) {
  const urgente = valores.amostras.some((amostra) => amostra.contatoHumano)
  const ocorrencia = valores.ocorrenciaResumo
  const { data: catalogosAnimais } = useCatalogosAnimaisQuery()

  return (
    <div className="col gap-4">
      <div className="card">
        <div className="card-header">
          <h3>Dados do processo</h3>
        </div>
        <div className="card-body">
          {urgente && (
            <p style={{ marginBottom: 'var(--space-3)' }}>
              <span className="badge badge-urgent">
                <Icon name="alert" size={12} /> Urgente
              </span>
            </p>
          )}
          <div className="kv-list">
            <div className="field">
              <span className="dado-rotulo">Vínculo com ocorrência</span>
              <div>
                {valores.vinculoDecisao === 'vinculado' && ocorrencia
                  ? `${formatarProtocoloOcorrencia(ocorrencia.protocolo)} — ${ocorrencia.tipoOcorrenciaNome}`
                  : 'Sem vínculo'}
              </div>
            </div>
            <div className="field">
              <span className="dado-rotulo">Data de abertura</span>
              <div>{formatarDataBR(valores.dataAbertura)}</div>
            </div>
            <div className="field">
              <span className="dado-rotulo">Doença investigada</span>
              <div>{nomeNoCatalogo(catalogos?.doencas, valores.doenca)}</div>
            </div>
            <div className="field">
              <span className="dado-rotulo">Laboratório de destino</span>
              <div>{nomeNoCatalogo(catalogos?.laboratorios, valores.laboratorio)}</div>
            </div>
            <div className="field">
              <span className="dado-rotulo">Nº GAL</span>
              <div className="mono">{valores.galNumero || '—'}</div>
            </div>
            <div className="field">
              <span className="dado-rotulo">Nº SINAN</span>
              <div className="mono">{valores.sinanNumero || '—'}</div>
            </div>
            {valores.observacoes?.trim() && (
              <div className="field full">
                <span className="dado-rotulo">Observações</span>
                <div>{valores.observacoes}</div>
              </div>
            )}
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
              <span className="dado-rotulo">Nome</span>
              <div>{valores.responsavel.nome}</div>
            </div>
            <div className="field">
              <span className="dado-rotulo">CPF</span>
              <div className="mono">{valores.responsavel.cpf || '—'}</div>
            </div>
            <div className="field">
              <span className="dado-rotulo">Telefone</span>
              <div className="mono">{valores.responsavel.telefone || '—'}</div>
            </div>
            <div className="field">
              <span className="dado-rotulo">E-mail</span>
              <div>{valores.responsavel.email || '—'}</div>
            </div>
            <div className="field full">
              <span className="dado-rotulo">Endereço</span>
              <div>
                {valores.responsavel.endereco || '—'}
                {valores.responsavel.bairroResidencial ? ` · ${valores.responsavel.bairroResidencial}` : ''}
              </div>
            </div>
            <div className="field">
              <span className="dado-rotulo">Bairro da ocorrência</span>
              <div>{valores.responsavel.bairroOcorrencia || '—'}</div>
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
                  {amostra.origem === 'canil' ? 'Animal do canil' : 'Animal de campo'}
                </span>
                {amostra.contatoHumano && <span className="badge badge-urgent">Contato humano</span>}
              </div>
              <div className="kv-list">
                <div className="field">
                  <span className="dado-rotulo">Identificação</span>
                  <div>
                    {amostra.origem === 'canil'
                      ? `${amostra.animalDescricao || '—'} (dados da ficha)`
                      : `${nomeNoCatalogo(catalogosAnimais?.especies, amostra.especie)} · ${labelDe(SEXO_OPCOES, amostra.sexo)}`}
                  </div>
                </div>
                <div className="field">
                  <span className="dado-rotulo">Status clínico</span>
                  <div>{labelDe(STATUS_CLINICO_OPCOES, amostra.statusClinico)}</div>
                </div>
                <div className="field">
                  <span className="dado-rotulo">Tipo de abrigo</span>
                  <div>{labelDe(TIPO_ABRIGO_OPCOES, amostra.tipoAbrigo)}</div>
                </div>
                <div className="field">
                  <span className="dado-rotulo">Material biológico</span>
                  <div>{labelDe(MATERIAL_BIOLOGICO_OPCOES, amostra.materialBiologico)}</div>
                </div>
                <div className="field">
                  <span className="dado-rotulo">Data de coleta</span>
                  <div>{formatarDataBR(amostra.dataColeta)}</div>
                </div>
                <div className="field">
                  <span className="dado-rotulo">Contato</span>
                  <div>
                    {amostra.contatoHumano === null
                      ? 'Não informado'
                      : amostra.contatoHumano
                        ? `${labelDe(NIVEL_CONTATO_OPCOES, amostra.nivelContato)}${amostra.agrediuHumano ? ' · agrediu o munícipe' : ''}`
                        : 'Sem contato'}
                  </div>
                </div>
                {amostra.alteracaoComportamental?.trim() && (
                  <div className="field full">
                    <span className="dado-rotulo">Alteração comportamental</span>
                    <div>{amostra.alteracaoComportamental}</div>
                  </div>
                )}
                {amostra.observacoes?.trim() && (
                  <div className="field full">
                    <span className="dado-rotulo">Observações</span>
                    <div>{amostra.observacoes}</div>
                  </div>
                )}
                <div className="field full">
                  <span className="dado-rotulo">Sintomas</span>
                  <div>
                    {amostra.statusClinico === 'SINTOMATICO' && amostra.sintomas.length
                      ? amostra.sintomas.map((codigo) => nomeNoCatalogo(catalogos?.sintomas, codigo)).join(', ')
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
