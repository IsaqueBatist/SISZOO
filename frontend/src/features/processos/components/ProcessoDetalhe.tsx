import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '@/components/layout/Icon'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { SEXO_OPCOES, PELAGEM_OPCOES } from '@/features/animais/schemas/animalFormSchema'
import { formatarData } from '@/features/ocorrencias/utils/datas'
import { formatarProtocoloOcorrencia, formatarProtocoloProcesso } from '@/features/ocorrencias/utils/protocolo'
import { mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'
import { CardResultadoProcesso } from './CardResultadoProcesso'
import { CardStatusProcesso } from './CardStatusProcesso'
import { SeletorOcorrencia, type OcorrenciaParaVinculo } from './SeletorOcorrencia'
import type { AmostraAnimal, Processo } from '../types/processos.types'
import { labelDe, MATERIAL_BIOLOGICO_OPCOES, NIVEL_CONTATO_OPCOES, STATUS_CLINICO_OPCOES, TIPO_ABRIGO_OPCOES } from '../utils/processosCatalogos'
import { badgeDeStatusProcesso, classeDeDoenca } from '../utils/statusBadge'
import { useProcessoQuery, useVincularOcorrenciaMutation } from '../hooks/useProcessos'

function Campo({ rotulo, valor, mono, full }: { rotulo: string; valor: string | null | undefined; mono?: boolean; full?: boolean }) {
  return (
    <div className={`field${full ? ' full' : ''}`}>
      <label>{rotulo}</label>
      <div className={mono ? 'mono' : undefined}>{valor || '—'}</div>
    </div>
  )
}

// A identificação exibida é a gravada na amostra (snapshot, DH-5), não a ficha
// atual do animal; o link leva à ficha só como referência.
function CardAmostra({ amostra, indice }: { amostra: AmostraAnimal; indice: number }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Amostra {indice + 1}</h3>
        {amostra.animalId ? (
          <Link to={`/animais/${amostra.animalId}`} className="btn btn-outline btn-sm">
            Ver ficha do animal
          </Link>
        ) : (
          <span className="badge badge-neutral">Animal de campo</span>
        )}
      </div>
      <div className="card-body">
        <div className="form-grid">
          <Campo rotulo="Espécie" valor={amostra.especie.nome} />
          <Campo rotulo="Sexo" valor={labelDe(SEXO_OPCOES, amostra.sexo)} />
          <Campo rotulo="Raça" valor={amostra.raca} />
          <Campo rotulo="Coloração" valor={amostra.coloracao} />
          <Campo rotulo="Pelagem" valor={amostra.pelagem ? labelDe(PELAGEM_OPCOES, amostra.pelagem) : null} />
          <Campo rotulo="Idade aprox." valor={amostra.idadeAprox} />
          <Campo rotulo="Peso (kg)" valor={amostra.pesoKg == null ? null : amostra.pesoKg.toFixed(2)} mono />
          <Campo rotulo="Status clínico" valor={labelDe(STATUS_CLINICO_OPCOES, amostra.statusClinico)} />
          <Campo rotulo="Tipo de abrigo" valor={labelDe(TIPO_ABRIGO_OPCOES, amostra.tipoAbrigo)} />
          <Campo rotulo="Data da coleta" valor={formatarData(amostra.dataColeta)} mono />
          <Campo rotulo="Material biológico" valor={labelDe(MATERIAL_BIOLOGICO_OPCOES, amostra.materialBiologico)} />
          <Campo rotulo="Alteração comportamental" valor={amostra.alteracaoComportamental} full />
          <Campo
            rotulo="Sinais e sintomas"
            valor={amostra.sintomas.map((sintoma) => sintoma.nome).join(', ')}
            full
          />
          <Campo rotulo="Observações" valor={amostra.observacoes} full />
        </div>
        {amostra.contatoHumano ? (
          <div className="alert danger" style={{ marginTop: 'var(--space-3)' }}>
            <span className="bullet" />
            <div className="alert-content">
              <strong>Contato humano-animal confirmado</strong> — contato {labelDe(NIVEL_CONTATO_OPCOES, amostra.nivelContato).toLowerCase()}.
              {amostra.agrediuHumano ? ' O animal agrediu o munícipe.' : ' O animal não agrediu o munícipe.'}
            </div>
          </div>
        ) : (
          <p style={{ marginTop: 'var(--space-3)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Sem contato humano-animal registrado nesta amostra.
          </p>
        )}
      </div>
    </div>
  )
}

// Vínculo posterior (emenda 2026-10-03): só enquanto o processo não tem
// ocorrência, e só para quem escreve em ocorrências (D33 — Admin e Agente).
// Componente próprio porque a mutation precisa do processo já carregado.
function CardVincularOcorrencia({ processo }: { processo: Processo }) {
  const [aberto, setAberto] = useState(false)
  const [erro, setErro] = useState<string | undefined>(undefined)
  const mutation = useVincularOcorrenciaMutation(processo.id)

  async function handleSelecionar(ocorrencia: OcorrenciaParaVinculo) {
    setErro(undefined)
    try {
      await mutation.mutateAsync(ocorrencia.id)
      setAberto(false)
    } catch (falha) {
      setErro(mensagemDeRegraDaApi(falha) ?? 'Não foi possível vincular a ocorrência. Tente novamente.')
    }
  }

  if (!aberto) {
    return (
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAberto(true)}>
        Vincular uma ocorrência já cadastrada
      </button>
    )
  }

  return (
    <SeletorOcorrencia
      vinculoDecisao=""
      ocorrenciaId={null}
      travado={false}
      ocorrenciaVinculada={null}
      erro={erro}
      onSelecionar={(ocorrencia) => void handleSelecionar(ocorrencia)}
      onPular={() => {
        setAberto(false)
        setErro(undefined)
      }}
      textoAjuda="Busque e selecione a ocorrência que deve ser vinculada a este processo. O vínculo não pode ser desfeito depois."
      textoBotaoPular="Cancelar"
    />
  )
}

function Voltar() {
  return (
    <Link to="/processos" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
      ← Voltar para Processos
    </Link>
  )
}

export function ProcessoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const { roleKey } = useAuth()
  // PROCESSOS_SANITARIOS:escrita (V3): os três cargos.
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet' || roleKey === 'agente'
  // OCORRENCIAS_DENUNCIAS (V11/D33): só Admin e Agente leem e vinculam.
  const acessaOcorrencias = roleKey === 'admin' || roleKey === 'agente'
  const { data: processo, isLoading, isError, error } = useProcessoQuery(id)

  if (isLoading) {
    return <p>Carregando processo…</p>
  }

  if (isError || !processo) {
    const naoEncontrado = statusHttpDoErro(error) === 404
    return (
      <>
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">
            {naoEncontrado ? 'Processo sanitário não encontrado.' : 'Não foi possível carregar este processo sanitário. Tente novamente.'}
          </div>
        </div>
        <Voltar />
      </>
    )
  }

  const statusBadge = badgeDeStatusProcesso(processo.statusProcesso)
  const responsavel = processo.responsavel

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <Voltar />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <span className={`badge badge-disease ${classeDeDoenca(processo.doenca.codigo)}`}>{processo.doenca.nome}</span>
            <span className={`badge ${statusBadge.classe}`}>{statusBadge.label}</span>
            {processo.urgente && (
              <span className="badge badge-urgent">
                <Icon name="alert" size={12} /> Urgente
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: 'var(--font-mono)', letterSpacing: 0 }}>Processo {formatarProtocoloProcesso(processo.protocolo)}</h1>
          <p className="subtitle">
            {processo.laboratorio.nome} · Aberto em {formatarData(processo.dataAbertura)}
          </p>
        </div>
      </div>

      {processo.urgente && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">
            <strong>Atenção — contato humano-animal confirmado.</strong> Ao menos uma amostra deste processo registrou contato
            humano-animal.
          </div>
        </div>
      )}

      <div className="det-grid">
        <div className="col gap-4">
          <div className="card">
            <div className="card-header">
              <h3>Dados do Processo</h3>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <Campo rotulo="Protocolo" valor={formatarProtocoloProcesso(processo.protocolo)} mono />
                <Campo rotulo="CID" valor={processo.cid} mono />
                <Campo rotulo="Doença investigada" valor={processo.doenca.nome} />
                <Campo rotulo="Laboratório de destino" valor={processo.laboratorio.nome} />
                <Campo rotulo="Nº GAL" valor={processo.galNumero ?? null} mono />
                <Campo rotulo="Nº SINAN" valor={processo.sinanNumero ?? null} mono />
                <Campo rotulo="Data de abertura" valor={formatarData(processo.dataAbertura)} mono />
                <Campo rotulo="Observações" valor={processo.observacoes} full />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Ocorrência Vinculada</h3>
            </div>
            <div className="card-body">
              {processo.ocorrenciaId ? (
                <div className="col gap-2">
                  <div>
                    <span className="mono" style={{ fontWeight: 600 }}>
                      {processo.ocorrenciaProtocolo ? formatarProtocoloOcorrencia(processo.ocorrenciaProtocolo) : '—'}
                    </span>
                    {acessaOcorrencias && (
                      <Link to={`/ocorrencias/${processo.ocorrenciaId}`} className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }}>
                        Ver ocorrência
                      </Link>
                    )}
                  </div>
                  <p className="hint">O vínculo com a ocorrência não pode ser alterado.</p>
                </div>
              ) : (
                <div className="col gap-2">
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Este processo não está vinculado a nenhuma ocorrência.</p>
                  {acessaOcorrencias && <CardVincularOcorrencia processo={processo} />}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Responsável / Munícipe</h3>
            </div>
            <div className="card-body">
              {responsavel ? (
                <div className="form-grid">
                  <Campo rotulo="Nome" valor={responsavel.nome} />
                  <Campo rotulo="CPF" valor={responsavel.cpf} mono />
                  <Campo rotulo="Telefone" valor={responsavel.telefone} mono />
                  <Campo rotulo="E-mail" valor={responsavel.email} />
                  <Campo rotulo="CEP" valor={responsavel.cep} mono />
                  <Campo rotulo="Endereço" valor={responsavel.endereco} full />
                  <Campo rotulo="Bairro residencial" valor={responsavel.bairroResidencial} />
                  <Campo rotulo="Bairro da ocorrência" valor={responsavel.bairroOcorrencia} />
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Responsável não informado.</p>
              )}
            </div>
          </div>

          {processo.amostras.map((amostra, indice) => (
            <CardAmostra key={amostra.id} amostra={amostra} indice={indice} />
          ))}
        </div>

        <div className="col gap-4">
          <CardStatusProcesso processo={processo} podeEscrever={podeEscrever} />

          <CardResultadoProcesso processo={processo} podeEscrever={podeEscrever} />
        </div>
      </div>
    </>
  )
}
