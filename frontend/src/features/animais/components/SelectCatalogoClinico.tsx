import type { UseFormRegisterReturn } from 'react-hook-form'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import type { CatalogoItem } from '../types/animais.types'

interface SelectCatalogoClinicoProps {
  id: string
  itens: CatalogoItem[] | undefined
  carregando: boolean
  comErro: boolean
  onTentarNovamente: () => void
  registro: UseFormRegisterReturn
  temErro: boolean
}

export function SelectCatalogoClinico({
  id,
  itens,
  carregando,
  comErro,
  onTentarNovamente,
  registro,
  temErro,
}: SelectCatalogoClinicoProps) {
  if (comErro) {
    return (
      <>
        <select id={id} className="select" disabled>
          <option>Indisponível</option>
        </select>
        <ErroComRetry mensagem="Não foi possível carregar as opções." onTentarNovamente={onTentarNovamente} />
      </>
    )
  }

  if (carregando || !itens) {
    return (
      <select id={id} className="select" disabled>
        <option>Carregando…</option>
      </select>
    )
  }

  if (itens.length === 0) {
    return (
      <>
        <select id={id} className="select" disabled>
          <option>—</option>
        </select>
        <span className="err">Nenhuma opção cadastrada.</span>
      </>
    )
  }

  return (
    <select id={id} className={`select${temErro ? ' error' : ''}`} aria-invalid={temErro ? true : undefined} {...registro}>
      <option value="" disabled>
        Selecione…
      </option>
      {itens.map((item) => (
        <option key={item.codigo} value={item.codigo}>
          {item.nome}
        </option>
      ))}
    </select>
  )
}
