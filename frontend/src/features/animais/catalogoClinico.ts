// FIXME(T22): hardcode temporário do catálogo de Vacina/TipoProcedimento —
// o backend não tem GET /api/vacinas nem GET /api/tipos-procedimento hoje
// (só resolve por código internamente, dentro do POST). Copiado literalmente
// do seed em backend/src/main/resources/db/migration/V5__schema_clinico_catalogos.sql.
// Protegido por catalogoClinico.test.ts, que falha o CI se esse seed mudar
// sem este arquivo ser atualizado junto. Ver seção "feedback de backend" do
// PR de T22 — item pendente: expor esses catálogos por endpoint real.
import type { CatalogoItem } from './animais.types'

export const VACINAS: CatalogoItem[] = [
  { codigo: 'antirrabica', nome: 'Antirrábica' },
  { codigo: 'v10', nome: 'V10' },
  { codigo: 'v8', nome: 'V8' },
  { codigo: 'v4_felinos', nome: 'V4 (felinos)' },
  { codigo: 'giardia', nome: 'Giárdia' },
  { codigo: 'gripe_canina', nome: 'Gripe canina' },
  { codigo: 'felv', nome: 'FeLV' },
  { codigo: 'leishmaniose', nome: 'Leishmaniose' },
]

export const TIPOS_PROCEDIMENTO: CatalogoItem[] = [
  { codigo: 'atendimento_clinico', nome: 'Atendimento clínico' },
  { codigo: 'castracao', nome: 'Castração' },
  { codigo: 'cirurgia_maior', nome: 'Cirurgia maior' },
  { codigo: 'vacinacao', nome: 'Vacinação' },
]
