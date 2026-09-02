/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TIPOS_PROCEDIMENTO, VACINAS } from './catalogoClinico'

// Salvaguarda contra a divergência silenciosa do hardcode (ver FIXME em
// catalogoClinico.ts): lê o seed real do backend e falha o CI se alguém
// alterar `V5__schema_clinico_catalogos.sql` sem atualizar este arquivo.
const CAMINHO_SEED = resolve(
  __dirname,
  '../../../../backend/src/main/resources/db/migration/V5__schema_clinico_catalogos.sql',
)

interface ParItem {
  codigo: string
  nome: string
}

function extrairSeed(sql: string, tabela: string): ParItem[] {
  const inicio = sql.indexOf(`INSERT INTO ${tabela} (codigo, nome`)
  if (inicio === -1) {
    throw new Error(`Não encontrei "INSERT INTO ${tabela}" no seed — o SQL mudou de formato?`)
  }
  const fim = sql.indexOf(';', inicio)
  const bloco = sql.slice(inicio, fim === -1 ? undefined : fim)
  const pares: ParItem[] = []
  const regexLinha = /\('([^']+)',\s*'([^']+)'(?:,\s*\d+)?\)/g
  let m: RegExpExecArray | null
  while ((m = regexLinha.exec(bloco)) !== null) {
    pares.push({ codigo: m[1], nome: m[2] })
  }
  return pares
}

function ordenarPorCodigo(itens: ParItem[]): ParItem[] {
  return [...itens].sort((a, b) => a.codigo.localeCompare(b.codigo))
}

describe('catalogoClinico (hardcode vs. seed do backend)', () => {
  const sql = readFileSync(CAMINHO_SEED, 'utf-8')

  it('VACINAS bate com o INSERT INTO vacina do seed', () => {
    const doSeed = extrairSeed(sql, 'vacina')
    const doFrontend = VACINAS.map((v) => ({ codigo: v.codigo, nome: v.nome }))
    expect(ordenarPorCodigo(doFrontend)).toEqual(ordenarPorCodigo(doSeed))
  })

  it('TIPOS_PROCEDIMENTO bate com o INSERT INTO tipo_procedimento do seed', () => {
    const doSeed = extrairSeed(sql, 'tipo_procedimento')
    const doFrontend = TIPOS_PROCEDIMENTO.map((t) => ({ codigo: t.codigo, nome: t.nome }))
    expect(ordenarPorCodigo(doFrontend)).toEqual(ordenarPorCodigo(doSeed))
  })
})
