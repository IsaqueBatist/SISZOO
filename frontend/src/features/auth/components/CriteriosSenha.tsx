import { Icon } from '@/components/layout/Icon'
import { avaliarSenha, CATEGORIAS_EXIGIDAS, TAMANHO_MINIMO_SENHA, type DonoDaSenha } from '../utils/politicaSenha'

interface CriteriosSenhaProps {
  senha: string
  // Sem dono (redefinição por link, em que a tela não sabe quem é o usuário),
  // só os critérios que não dependem dele aparecem; a API confere o resto.
  dono?: DonoDaSenha
}

type Estado = 'pendente' | 'ok' | 'falha'

// Lista dos critérios da política de senha (docs/decisoes/politica-senha.md),
// atualizada a cada tecla abaixo do campo. Antes de digitar, tudo fica neutro;
// depois, cada critério mostra se já foi atendido. As mesmas regras continuam
// no schema (envio) e no backend (fonte da verdade).
export function CriteriosSenha({ senha, dono }: CriteriosSenhaProps) {
  const avaliacao = avaliarSenha(senha, dono ?? { email: '', nomeExibicao: '' })
  const vazia = senha.length === 0
  const estado = (atendido: boolean): Estado => (vazia ? 'pendente' : atendido ? 'ok' : 'falha')

  const tipos = [
    { rotulo: 'Letra maiúscula', presente: avaliacao.categorias.maiuscula },
    { rotulo: 'Letra minúscula', presente: avaliacao.categorias.minuscula },
    { rotulo: 'Número', presente: avaliacao.categorias.digito },
    { rotulo: 'Símbolo (ex.: ! @ # $ % - _ ?)', presente: avaliacao.categorias.especial },
  ]

  return (
    <div className="criterios-senha" aria-live="polite">
      <p className="criterios-senha-titulo">A senha precisa:</p>
      <ul>
        <Criterio estado={estado(avaliacao.tamanhoMinimo)}>Ter ao menos {TAMANHO_MINIMO_SENHA} caracteres</Criterio>
        <Criterio estado={estado(avaliacao.categoriasSuficientes)}>
          Combinar ao menos {CATEGORIAS_EXIGIDAS} tipos de caractere
          {!vazia && (
            <span className="criterios-senha-contagem">
              {' '}
              ({avaliacao.totalCategorias} {avaliacao.totalCategorias === 1 ? 'tipo' : 'tipos'})
            </span>
          )}
          <ul className="criterios-senha-tipos">
            {tipos.map((tipo) => (
              <li key={tipo.rotulo} className={tipo.presente ? 'presente' : undefined}>
                <span className="criterios-senha-icone" aria-hidden="true">
                  <Icon name="check" size={12} />
                </span>
                {tipo.rotulo}
                <span className="visually-hidden">{tipo.presente ? ' (presente)' : ' (ausente)'}</span>
              </li>
            ))}
          </ul>
        </Criterio>
        {avaliacao.contaVerificavel && (
          <Criterio estado={estado(!avaliacao.contemConta)}>Não conter o nome da conta (o e-mail antes do @)</Criterio>
        )}
        {avaliacao.nomeVerificavel && (
          <Criterio estado={estado(!avaliacao.contemNome)}>Não conter partes do seu nome</Criterio>
        )}
      </ul>
      {!dono && <p className="hint">A senha também não pode conter seu nome nem o nome da conta; isso é conferido ao salvar.</p>}
    </div>
  )
}

function Criterio({ estado, children }: { estado: Estado; children: React.ReactNode }) {
  return (
    <li className={`criterio ${estado}`}>
      <span className="criterios-senha-icone" aria-hidden="true">
        <Icon name={estado === 'falha' ? 'x' : 'check'} size={14} />
      </span>
      <span className="criterio-texto">
        {children}
        {estado !== 'pendente' && (
          <span className="visually-hidden">{estado === 'ok' ? ' (atendido)' : ' (não atendido)'}</span>
        )}
      </span>
    </li>
  )
}
