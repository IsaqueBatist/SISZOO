import { useFormContext, useWatch } from 'react-hook-form'
import { formatarDataBR } from '@/lib/datas'
import { useBaiasAtivasQuery, useCatalogosAnimaisQuery } from '../hooks/useAnimais'
import { CASTRACAO_OPCOES, PELAGEM_OPCOES, PORTE_OPCOES, SEXO_OPCOES, type AnimalFormUiValues } from '../schemas/animalFormSchema'
import type { CatalogoItem } from '../types/animais.types'

function nomeCatalogo(itens: CatalogoItem[] | undefined, codigo: string): string {
  if (!codigo) return '—'
  return itens?.find((item) => item.codigo === codigo)?.nome ?? codigo
}

// Revisão dos dados antes de salvar (etapa 3): só leitura, ao vivo.
export function RevisaoAnimal() {
  const { control } = useFormContext<AnimalFormUiValues>()
  const valores = useWatch({ control })
  const { data: catalogos } = useCatalogosAnimaisQuery()
  const { data: baias } = useBaiasAtivasQuery()

  return (
    <div className="fieldset">
      <legend>Revisão dos dados</legend>
      <div className="review-grid">
        <div className="review-row">
          <span className="k">Nome</span>
          <span className="v">{valores.nome || '—'}</span>
        </div>
        <div className="review-row">
          <span className="k">Espécie</span>
          <span className="v">{nomeCatalogo(catalogos?.especies, valores.especie ?? '')}</span>
        </div>
        <div className="review-row">
          <span className="k">Microchip</span>
          <span className="v mono">{valores.microchip || '—'}</span>
        </div>
        <div className="review-row">
          <span className="k">Medalha</span>
          <span className="v mono">{valores.numeroMedalha || '—'}</span>
        </div>
        <div className="review-row">
          <span className="k">Implantação do chip</span>
          <span className="v">{valores.dataImplantacaoChip ? formatarDataBR(valores.dataImplantacaoChip) : '—'}</span>
        </div>
        <div className="review-row">
          <span className="k">Procedência</span>
          <span className="v">{valores.procedencia || '—'}</span>
        </div>
        <div className="review-row">
          <span className="k">Sexo</span>
          <span className="v">{SEXO_OPCOES.find((opcao) => opcao.valor === valores.sexo)?.label ?? '—'}</span>
        </div>
        <div className="review-row">
          <span className="k">Porte</span>
          <span className="v">{PORTE_OPCOES.find((opcao) => opcao.valor === valores.porte)?.label ?? '—'}</span>
        </div>
        <div className="review-row">
          <span className="k">Raça</span>
          <span className="v">{valores.raca || '—'}</span>
        </div>
        <div className="review-row">
          <span className="k">Nasc. aprox.</span>
          <span className="v">{formatarDataBR(valores.dataNascimentoAprox)}</span>
        </div>
        <div className="review-row">
          <span className="k">Pelagem · Cor</span>
          <span className="v">
            {PELAGEM_OPCOES.find((opcao) => opcao.valor === valores.pelagem)?.label ?? '—'} · {valores.coloracao || '—'}
          </span>
        </div>
        <div className="review-row">
          <span className="k">Motivo de entrada</span>
          <span className="v">{nomeCatalogo(catalogos?.motivosEntrada, valores.motivoEntrada ?? '')}</span>
        </div>
        <div className="review-row">
          <span className="k">Baia</span>
          <span className="v">{baias?.find((baia) => baia.id === valores.baiaId)?.nome ?? '—'}</span>
        </div>
        <div className="review-row">
          <span className="k">Status</span>
          <span className="v">{nomeCatalogo(catalogos?.status, valores.status ?? '')}</span>
        </div>
        <div className="review-row">
          <span className="k">Castração</span>
          <span className="v">{CASTRACAO_OPCOES.find((opcao) => opcao.valor === valores.castracaoOpcao)?.label}</span>
        </div>
        <div className="review-row" style={{ gridColumn: '1 / -1' }}>
          <span className="k">Observações</span>
          <span className="v">{valores.observacoes || '—'}</span>
        </div>
      </div>
    </div>
  )
}
