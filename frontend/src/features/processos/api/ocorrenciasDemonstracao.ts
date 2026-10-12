import type { RoleKey } from '@/lib/nav'
import type { OcorrenciaParaVinculo } from '../types/processos.types'

// DEMONSTRAÇÃO (D40): o módulo de processos ainda não tem backend completo, e
// as telas de processos continuam sobre o mock em memória. Para não misturar
// processos fictícios com ocorrências reais, o mock de processos tem as
// próprias ocorrências fictícias — antes ele lia e alterava o mock da feature
// de ocorrências, que agora conversa com a API real. Ids e protocolos são os
// do antigo seed de ocorrências, que os testes de processos já usam.

interface OcorrenciaDemonstracao extends OcorrenciaParaVinculo {
  processoVinculado: { id: string; protocolo: string } | null
}

function seed(): OcorrenciaDemonstracao[] {
  return [
    {
      id: 'h5000000-0000-0000-0000-000000000001',
      protocolo: '089/2026',
      tipoOcorrencia: 'zoonose',
      bairro: 'Vila Esperança',
      statusOcorrencia: 'aberta',
      sigilosa: false,
      denunciante: { nome: 'Maria Souza Oliveira' },
      processoVinculado: null,
    },
    {
      id: 'h5000000-0000-0000-0000-000000000002',
      protocolo: '090/2026',
      tipoOcorrencia: 'irregular',
      bairro: 'Jardim Bela Vista',
      statusOcorrencia: 'aberta',
      sigilosa: true,
      denunciante: { nome: 'João Pereira Lima' },
      processoVinculado: null,
    },
    {
      id: 'h5000000-0000-0000-0000-000000000004',
      protocolo: '092/2026',
      tipoOcorrencia: 'zoonose',
      bairro: 'Centro',
      statusOcorrencia: 'em_atendimento',
      sigilosa: false,
      denunciante: { nome: 'Carla Mendes' },
      processoVinculado: { id: 'h7000000-0000-0000-0000-000000000001', protocolo: '045/2026' },
    },
    {
      id: 'h5000000-0000-0000-0000-000000000005',
      protocolo: '070/2026',
      tipoOcorrencia: 'agressivo',
      bairro: 'Parque das Flores',
      statusOcorrencia: 'encerrada',
      sigilosa: false,
      denunciante: { nome: 'Escola Municipal Parque das Flores' },
      processoVinculado: null,
    },
    {
      id: 'h5000000-0000-0000-0000-000000000006',
      protocolo: '095/2026',
      tipoOcorrencia: 'zoonose',
      bairro: 'Jardim Bela Vista',
      statusOcorrencia: 'em_atendimento',
      sigilosa: true,
      denunciante: { nome: 'Renata Costa Almeida' },
      processoVinculado: { id: 'p1000000-0000-0000-0000-000000000005', protocolo: '005/2026' },
    },
  ]
}

let ocorrencias: OcorrenciaDemonstracao[] = seed()

export function resetOcorrenciasDemonstracao() {
  ocorrencias = seed()
}

// Sigilo: nome do denunciante só para admin, mascarado ANTES de qualquer
// busca (senão a busca pelo nome real confirmaria a identidade).
function paraVinculo(ocorrencia: OcorrenciaDemonstracao, roleKey: RoleKey): OcorrenciaParaVinculo {
  const mascarar = ocorrencia.sigilosa && roleKey !== 'admin'
  return {
    id: ocorrencia.id,
    protocolo: ocorrencia.protocolo,
    tipoOcorrencia: ocorrencia.tipoOcorrencia,
    bairro: ocorrencia.bairro,
    statusOcorrencia: ocorrencia.statusOcorrencia,
    sigilosa: ocorrencia.sigilosa,
    denunciante: ocorrencia.denunciante ? { nome: mascarar ? null : ocorrencia.denunciante.nome } : null,
  }
}

export function buscarOcorrenciaDemonstracao(
  id: string,
  roleKey: RoleKey,
): (OcorrenciaParaVinculo & { processoVinculado: { id: string; protocolo: string } | null }) | null {
  const encontrada = ocorrencias.find((item) => item.id === id)
  return encontrada ? { ...paraVinculo(encontrada, roleKey), processoVinculado: encontrada.processoVinculado } : null
}

// Só as que ainda não têm processo: cardinalidade 0..1 do vínculo.
export function listarOcorrenciasDisponiveisDemonstracao(q: string | undefined, roleKey: RoleKey): OcorrenciaParaVinculo[] {
  const termo = q?.trim().toLowerCase()
  return ocorrencias
    .filter((item) => !item.processoVinculado)
    .map((item) => paraVinculo(item, roleKey))
    .filter(
      (item) =>
        !termo ||
        item.protocolo.toLowerCase().includes(termo) ||
        item.bairro.toLowerCase().includes(termo) ||
        (item.denunciante?.nome ?? '').toLowerCase().includes(termo),
    )
}

export function marcarVinculoDemonstracao(ocorrenciaId: string, processo: { id: string; protocolo: string }): void {
  ocorrencias = ocorrencias.map((item) => (item.id === ocorrenciaId ? { ...item, processoVinculado: processo } : item))
}
