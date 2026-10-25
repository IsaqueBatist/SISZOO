import { describe, expect, it } from 'vitest'
import { labelModulo, moduloDaEntidade } from './moduloDaEntidade'

describe('moduloDaEntidade', () => {
  it.each([
    ['usuario', 'USUARIOS_ACESSO'],
    ['preferencia_usuario', 'USUARIOS_ACESSO'],
    ['vacinacao', 'GESTAO_ANIMAIS'],
    ['procedimento', 'GESTAO_ANIMAIS'],
    ['prescricao', 'GESTAO_ANIMAIS'],
    ['ocorrencia', 'OCORRENCIAS_DENUNCIAS'],
    ['anexo_ocorrencia', 'OCORRENCIAS_DENUNCIAS'],
    ['movimentacao_ocorrencia', 'OCORRENCIAS_DENUNCIAS'],
    ['processo_sanitario', 'PROCESSOS_SANITARIOS'],
  ] as const)('mapeia a entidade "%s" para o módulo %s', (entidade, moduloEsperado) => {
    expect(moduloDaEntidade(entidade)).toBe(moduloEsperado)
  })

  it('cai em OUTRO para uma entidade não mapeada', () => {
    expect(moduloDaEntidade('entidade_desconhecida')).toBe('OUTRO')
  })
})

describe('labelModulo', () => {
  it('devolve um rótulo em português para cada módulo', () => {
    expect(labelModulo('USUARIOS_ACESSO')).toBe('Usuários e Acesso')
    expect(labelModulo('GESTAO_ANIMAIS')).toBe('Gestão de Animais')
    expect(labelModulo('OCORRENCIAS_DENUNCIAS')).toBe('Ocorrências e Denúncias')
    expect(labelModulo('PROCESSOS_SANITARIOS')).toBe('Processos Sanitários')
    expect(labelModulo('RELATORIOS')).toBe('Relatórios')
    expect(labelModulo('OUTRO')).toBe('Outros')
  })
})
