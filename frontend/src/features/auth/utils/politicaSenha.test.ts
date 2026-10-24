import { describe, expect, it } from 'vitest'
import { MENSAGEM_CATEGORIAS, violacaoPoliticaSenha } from './politicaSenha'

// Mesmos casos de PoliticaSenhaTest (backend): as duas implementações têm de
// concordar.
const DONO = { email: 'erin.hagens@itu.sp.gov.br', nomeExibicao: 'Erin M. Hagens' }

describe('violacaoPoliticaSenha', () => {
  it.each(['Abcdefgh1', 'abcdefg1!', 'ABCDEFG1!', 'Abcdefgh!', 'Ação-Útil', 'Ωμέγα-Σύνολο', 'Пароль-Тест', '密码密码ab12'])(
    'aceita "%s" (3 ou mais categorias)',
    (senha) => {
      expect(violacaoPoliticaSenha(senha, DONO)).toBeNull()
    },
  )

  it.each(['abcdefgh', 'abcdefg1', 'ABCDEFG1', 'Abcdefgh', 'abcdefg€', 'abcd efgh', 'Senha\\Forte', '١٢٣٤٥٦٧٨abc'])(
    'recusa "%s" (menos de 3 categorias)',
    (senha) => {
      expect(violacaoPoliticaSenha(senha, DONO)).toBe(MENSAGEM_CATEGORIAS)
    },
  )

  it('conta todos os símbolos da lista da política', () => {
    for (const simbolo of `'-!"#$%&()*,./:;?@[]^_\`{|}~+<=>`) {
      expect(violacaoPoliticaSenha(`abcdefg1${simbolo}`, DONO)).toBeNull()
    }
  })

  it('recusa a parte local do e-mail inteira, sem diferenciar maiúsculas', () => {
    expect(violacaoPoliticaSenha('X1!ERIN.HAGENS', DONO)).toMatch(/nome da conta/)
  })

  it('ignora nome da conta com menos de 3 caracteres', () => {
    expect(violacaoPoliticaSenha('Xy1!xyZw', { email: 'xy@itu.sp.gov.br', nomeExibicao: 'Ana Lu' })).toBeNull()
  })

  it('exemplo da política: "Erin M. Hagens" recusa erin e hagens; M é ignorado; substrings não contam', () => {
    expect(violacaoPoliticaSenha('Senha-erin-1', DONO)).toMatch(/nome do usuário/)
    expect(violacaoPoliticaSenha('HAGENS2026!', DONO)).toMatch(/nome do usuário/)
    expect(violacaoPoliticaSenha('Mm-Forte-2026', DONO)).toBeNull()
    expect(violacaoPoliticaSenha('Eri-Hag-2026', DONO)).toBeNull()
  })

  it('divide o nome em vírgula, ponto, hífen, sublinhado, espaço, cerquilha e tab', () => {
    const dono = { email: 'x.y@itu.sp.gov.br', nomeExibicao: 'Ana,Beatriz.Carla-Diana_Elisa#Fabia\tGlauce Silva' }
    for (const parte of ['ana', 'beatriz', 'carla', 'diana', 'elisa', 'fabia', 'glauce', 'silva']) {
      expect(violacaoPoliticaSenha(`X9!${parte}`, dono)).toMatch(/nome do usuário/)
    }
  })

  it('checa parte do nome com acento sem diferenciar maiúsculas', () => {
    expect(violacaoPoliticaSenha('JOÃO-2026!', { email: 'j.silva@itu.sp.gov.br', nomeExibicao: 'João Silva' })).toMatch(
      /nome do usuário/,
    )
  })
})
