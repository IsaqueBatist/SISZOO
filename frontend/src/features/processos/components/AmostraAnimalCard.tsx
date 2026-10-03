import { useState } from 'react'
import { Controller, type Control, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from 'react-hook-form'
import { Icon } from '@/components/layout/Icon'
import { PELAGEM_OPCOES, SEXO_OPCOES } from '@/features/animais/schemas/animalFormSchema'
import { useAnimaisQuery, useCatalogosAnimaisQuery } from '@/features/animais/hooks/useAnimais'
import type { ProcessoFormValues } from '../schemas/processoFormSchema'
import { MATERIAL_BIOLOGICO_OPCOES, SINTOMA_OPCOES, STATUS_CLINICO_OPCOES, TIPO_ABRIGO_OPCOES } from '../utils/processosCatalogos'
import type { Sintoma } from '../types/processos.types'

const TAMANHO_BUSCA_ANIMAL = 8

// Tipo mínimo do erro de uma amostra — evita lidar com a distribuição de
// FieldErrors sobre a união discriminada (RHF/TS não distribui bem tipos
// mapeados sobre union em arrays). Sem `any`: cada campo acessado é tipado
// explicitamente.
export interface AmostraErros {
  sexo?: { message?: string }
  statusClinico?: { message?: string }
  tipoAbrigo?: { message?: string }
  dataColeta?: { message?: string }
  materialBiologico?: { message?: string }
  animalId?: { message?: string }
  especieId?: { message?: string }
  nivelContato?: { message?: string }
  agrediuHumano?: { message?: string }
}

function paraNumeroOuIndefinido(valor: unknown): number | undefined {
  if (typeof valor === 'number') return Number.isNaN(valor) ? undefined : valor
  if (typeof valor !== 'string') return undefined
  const limpo = valor.trim()
  return limpo === '' ? undefined : Number(limpo)
}

interface AmostraAnimalCardProps {
  index: number
  numero: number
  control: Control<ProcessoFormValues>
  register: UseFormRegister<ProcessoFormValues>
  setValue: UseFormSetValue<ProcessoFormValues>
  watch: UseFormWatch<ProcessoFormValues>
  erros?: AmostraErros
  podeRemover: boolean
  onRemover: () => void
}

export function AmostraAnimalCard({ index, numero, control, register, setValue, watch, erros, podeRemover, onRemover }: AmostraAnimalCardProps) {
  const [buscaAnimal, setBuscaAnimal] = useState('')
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [animalSelecionadoNome, setAnimalSelecionadoNome] = useState('')

  const origem = watch(`amostras.${index}.origem`)
  const animalId = watch(`amostras.${index}.animalId` as `amostras.${number}.animalId`)
  const contatoHumano = watch(`amostras.${index}.contatoHumano`)

  const { data: catalogos } = useCatalogosAnimaisQuery()
  const { data: resultadoBusca } = useAnimaisQuery({ q: buscaAnimal || undefined, pagina: 0, tamanho: TAMANHO_BUSCA_ANIMAL })

  const prefixo = `amostras.${index}` as const

  function selecionarOrigem(novaOrigem: 'canil' | 'externo') {
    if (novaOrigem === origem) return
    // Troca de modo limpa os campos de identificação — o payload final
    // (montado em ProcessoForm) só envia os campos do modo atual de
    // qualquer forma, mas limpar aqui evita mostrar dado obsoleto na tela.
    setValue(`${prefixo}.origem`, novaOrigem, { shouldValidate: false })
    setValue(`${prefixo}.especieId`, '', { shouldValidate: false })
    setValue(`${prefixo}.sexo`, '' as never, { shouldValidate: false })
    setValue(`${prefixo}.raca`, '', { shouldValidate: false })
    setValue(`${prefixo}.coloracao`, '', { shouldValidate: false })
    setValue(`${prefixo}.pelagem`, '', { shouldValidate: false })
    setValue(`${prefixo}.idadeAprox`, '', { shouldValidate: false })
    setValue(`${prefixo}.pesoKg`, undefined, { shouldValidate: false })
    if (novaOrigem === 'externo') {
      setValue(`${prefixo}.animalId` as `amostras.${number}.animalId`, '', { shouldValidate: false })
    }
    setAnimalSelecionadoNome('')
    setBuscaAnimal('')
  }

  function selecionarAnimal(animal: {
    id: string
    nome: string
    microchip: string | null
    especieCodigo: string
    sexo: string
    raca: string | null
    coloracao: string | null
    pelagem: string | null
    idadeAprox: string | null
    pesoKg: number | null
  }) {
    setValue(`${prefixo}.animalId` as `amostras.${number}.animalId`, animal.id, { shouldValidate: true })
    setValue(`${prefixo}.especieId`, animal.especieCodigo, { shouldValidate: true })
    setValue(`${prefixo}.sexo`, animal.sexo as ProcessoFormValues['amostras'][number]['sexo'], { shouldValidate: true })
    setValue(`${prefixo}.raca`, animal.raca ?? '', { shouldValidate: false })
    setValue(`${prefixo}.coloracao`, animal.coloracao ?? '', { shouldValidate: false })
    setValue(`${prefixo}.pelagem`, animal.pelagem ?? '', { shouldValidate: false })
    setValue(`${prefixo}.idadeAprox`, animal.idadeAprox ?? '', { shouldValidate: false })
    setValue(`${prefixo}.pesoKg`, animal.pesoKg ?? undefined, { shouldValidate: false })
    setAnimalSelecionadoNome(`${animal.nome}${animal.microchip ? ` · ${animal.microchip}` : ''}`)
    setMostrarSugestoes(false)
    setBuscaAnimal('')
  }

  function trocarAnimal() {
    setValue(`${prefixo}.animalId` as `amostras.${number}.animalId`, '', { shouldValidate: false })
    setAnimalSelecionadoNome('')
  }

  return (
    <div className="animal-amostra-mini">
      <div className="am-head-mini">
        <span className="title">
          <span className="num-circle">{numero}</span>
          Animal amostrado {numero}
        </span>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          <div className="source-toggle" role="tablist" aria-label="Origem do animal">
            <button type="button" className={origem === 'canil' ? 'active' : ''} onClick={() => selecionarOrigem('canil')}>
              Já cadastrado
            </button>
            <button type="button" className={origem === 'externo' ? 'active' : ''} onClick={() => selecionarOrigem('externo')}>
              Novo animal
            </button>
          </div>
          {podeRemover && (
            <button type="button" className="btn btn-ghost btn-sm btn-icon-only" aria-label={`Remover animal ${numero}`} onClick={onRemover}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {origem === 'canil' ? (
        <div>
          {animalId ? (
            <div className="selected-animal-card">
              <span className="sa-avatar">
                <Icon name="paw" size={22} />
              </span>
              <div className="sa-info">
                <div className="name">{animalSelecionadoNome || 'Animal selecionado'}</div>
                <div className="meta">
                  {watch(`${prefixo}.especieId`)} · {watch(`${prefixo}.sexo`)}
                  {watch(`${prefixo}.raca`) ? ` · ${watch(`${prefixo}.raca`)}` : ''}
                </div>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={trocarAnimal}>
                ← Trocar animal
              </button>
            </div>
          ) : (
            <div className="animal-search-wrap">
              <input
                className={`input${erros?.animalId ? ' error' : ''}`}
                type="search"
                placeholder="Buscar por nome ou microchip..."
                value={buscaAnimal}
                onChange={(event) => {
                  setBuscaAnimal(event.target.value)
                  setMostrarSugestoes(true)
                }}
                onFocus={() => setMostrarSugestoes(true)}
                aria-label={`Buscar animal do canil para o animal amostrado ${numero}`}
              />
              {mostrarSugestoes && (resultadoBusca?.itens.length ?? 0) > 0 && (
                <div className="animal-suggestions show">
                  {resultadoBusca!.itens.map((animal) => (
                    <div key={animal.id} className="sug" onClick={() => selecionarAnimal(animal)}>
                      <span className="name">{animal.nome}</span>
                      <span className="chip">{animal.microchip ?? 'sem microchip'}</span>
                      <span className="meta">
                        {animal.especieNome} · {animal.sexo}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {erros?.animalId && <span className="err">{erros.animalId.message}</span>}
            </div>
          )}
        </div>
      ) : (
        <div className="form-grid">
          <div className="field">
            <label htmlFor={`${prefixo}-especie`}>
              Espécie <span className="req">*</span>
            </label>
            <select
              id={`${prefixo}-especie`}
              className={`select${erros?.especieId ? ' error' : ''}`}
              defaultValue=""
              {...register(`${prefixo}.especieId`)}
            >
              <option value="" disabled>
                Selecione
              </option>
              {catalogos?.especies.map((especie) => (
                <option key={especie.codigo} value={especie.codigo}>
                  {especie.nome}
                </option>
              ))}
            </select>
            {erros?.especieId && <span className="err">{erros.especieId.message}</span>}
          </div>
          <div className="field">
            <label htmlFor={`${prefixo}-sexo`}>
              Sexo <span className="req">*</span>
            </label>
            <select id={`${prefixo}-sexo`} className={`select${erros?.sexo ? ' error' : ''}`} defaultValue="" {...register(`${prefixo}.sexo`)}>
              <option value="" disabled>
                Selecione
              </option>
              {SEXO_OPCOES.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.label}
                </option>
              ))}
            </select>
            {erros?.sexo && <span className="err">{erros.sexo.message}</span>}
          </div>
          <div className="field">
            <label htmlFor={`${prefixo}-raca`}>Raça</label>
            <input id={`${prefixo}-raca`} className="input" type="text" {...register(`${prefixo}.raca`)} />
          </div>
          <div className="field">
            <label htmlFor={`${prefixo}-coloracao`}>Coloração</label>
            <input id={`${prefixo}-coloracao`} className="input" type="text" {...register(`${prefixo}.coloracao`)} />
          </div>
          <div className="field">
            <label htmlFor={`${prefixo}-pelagem`}>Pelagem</label>
            <select id={`${prefixo}-pelagem`} className="select" defaultValue="" {...register(`${prefixo}.pelagem`)}>
              <option value="">—</option>
              {PELAGEM_OPCOES.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${prefixo}-idade`}>Idade aprox.</label>
            <input id={`${prefixo}-idade`} className="input" type="text" {...register(`${prefixo}.idadeAprox`)} />
          </div>
          <div className="field">
            <label htmlFor={`${prefixo}-peso`}>Peso (kg)</label>
            <input
              id={`${prefixo}-peso`}
              className="input"
              type="number"
              step="0.1"
              {...register(`${prefixo}.pesoKg`, { setValueAs: paraNumeroOuIndefinido })}
            />
          </div>
        </div>
      )}

      <div className="form-grid" style={{ marginTop: 14 }}>
        <div className="field">
          <label htmlFor={`${prefixo}-data-coleta`}>
            Data de coleta <span className="req">*</span>
          </label>
          <input
            id={`${prefixo}-data-coleta`}
            className={`input${erros?.dataColeta ? ' error' : ''}`}
            type="date"
            {...register(`${prefixo}.dataColeta`)}
          />
          {erros?.dataColeta && <span className="err">{erros.dataColeta.message}</span>}
        </div>
        <div className="field">
          <label htmlFor={`${prefixo}-material`}>
            Material biológico <span className="req">*</span>
          </label>
          <select
            id={`${prefixo}-material`}
            className={`select${erros?.materialBiologico ? ' error' : ''}`}
            defaultValue=""
            {...register(`${prefixo}.materialBiologico`)}
          >
            <option value="" disabled>
              Selecione
            </option>
            {MATERIAL_BIOLOGICO_OPCOES.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.label}
              </option>
            ))}
          </select>
          {erros?.materialBiologico && <span className="err">{erros.materialBiologico.message}</span>}
        </div>
        <div className="field">
          <label htmlFor={`${prefixo}-status-clinico`}>
            Status clínico <span className="req">*</span>
          </label>
          <select
            id={`${prefixo}-status-clinico`}
            className={`select${erros?.statusClinico ? ' error' : ''}`}
            defaultValue=""
            {...register(`${prefixo}.statusClinico`)}
          >
            <option value="" disabled>
              Selecione
            </option>
            {STATUS_CLINICO_OPCOES.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.label}
              </option>
            ))}
          </select>
          {erros?.statusClinico && <span className="err">{erros.statusClinico.message}</span>}
        </div>
        <div className="field">
          <label htmlFor={`${prefixo}-tipo-abrigo`}>
            Tipo de abrigo <span className="req">*</span>
          </label>
          <select
            id={`${prefixo}-tipo-abrigo`}
            className={`select${erros?.tipoAbrigo ? ' error' : ''}`}
            defaultValue=""
            {...register(`${prefixo}.tipoAbrigo`)}
          >
            <option value="" disabled>
              Selecione
            </option>
            {TIPO_ABRIGO_OPCOES.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.label}
              </option>
            ))}
          </select>
          {erros?.tipoAbrigo && <span className="err">{erros.tipoAbrigo.message}</span>}
        </div>
        <div className="field full">
          <label htmlFor={`${prefixo}-alt-comportamental`}>Alteração comportamental</label>
          <textarea id={`${prefixo}-alt-comportamental`} className="textarea" {...register(`${prefixo}.alteracaoComportamental`)} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label className="hint" style={{ display: 'block', marginBottom: 6 }}>
          Sinais e sintomas observados
        </label>
        <Controller
          name={`${prefixo}.sintomas`}
          control={control}
          render={({ field }) => (
            <div className="checkbox-grid" role="group" aria-label={`Sintomas do animal amostrado ${numero}`}>
              {SINTOMA_OPCOES.map((opcao) => {
                const valorAtual = (field.value ?? []) as Sintoma[]
                const marcado = valorAtual.includes(opcao.valor)
                return (
                  <label key={opcao.valor} className={marcado ? 'checked' : ''}>
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={(event) =>
                        field.onChange(event.target.checked ? [...valorAtual, opcao.valor] : valorAtual.filter((s) => s !== opcao.valor))
                      }
                    />
                    {opcao.label}
                  </label>
                )
              })}
            </div>
          )}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="switch-row">
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Munícipe teve contato físico com o animal</span>
          <Controller
            name={`${prefixo}.contatoHumano`}
            control={control}
            render={({ field }) => (
              <label className="switch">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => {
                    field.onChange(event.target.checked)
                    if (!event.target.checked) {
                      setValue(`${prefixo}.nivelContato`, undefined, { shouldValidate: false })
                      setValue(`${prefixo}.agrediuHumano`, undefined, { shouldValidate: false })
                    }
                  }}
                  aria-label="Contato humano-animal"
                />
                <span className="slider" />
              </label>
            )}
          />
        </div>

        {contatoHumano && (
          <>
            {/* RN4: contato humano em qualquer amostra marca o processo inteiro
                como urgente — aviso replicado do padrão de docs/prototipo/processo.html. */}
            <div className="urgency-banner" role="alert" style={{ marginTop: 10 }}>
              <span className="ub-ico">
                <Icon name="alert" size={22} />
              </span>
              <div>
                <h3>ATENÇÃO — CONTATO HUMANO-ANIMAL</h3>
                <p>Este processo será marcado como urgente. Resultado laboratorial será obrigatório antes de encerrar.</p>
              </div>
            </div>

            <div className="am-flags">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="alert" size={14} />
                <strong>Nível de contato:</strong>
              </span>
              <Controller
                name={`${prefixo}.nivelContato`}
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2" role="radiogroup" aria-label="Nível de contato">
                    {(['direta', 'indireta'] as const).map((valor) => (
                      <label key={valor} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="radio" checked={field.value === valor} onChange={() => field.onChange(valor)} />
                        {valor === 'direta' ? 'Direta' : 'Indireta'}
                      </label>
                    ))}
                  </div>
                )}
              />
              {erros?.nivelContato && <span className="err">{erros.nivelContato.message}</span>}

              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong>Animal agrediu o munícipe?</strong>
              </span>
              <Controller
                name={`${prefixo}.agrediuHumano`}
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2" role="radiogroup" aria-label="Animal agrediu o munícipe">
                    {[
                      { valor: true, label: 'Sim' },
                      { valor: false, label: 'Não' },
                    ].map((opcao) => (
                      <label key={String(opcao.valor)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="radio" checked={field.value === opcao.valor} onChange={() => field.onChange(opcao.valor)} />
                        {opcao.label}
                      </label>
                    ))}
                  </div>
                )}
              />
              {erros?.agrediuHumano && <span className="err">{erros.agrediuHumano.message}</span>}
            </div>
          </>
        )}
      </div>

      <div className="field full" style={{ marginTop: 14 }}>
        <label htmlFor={`${prefixo}-observacoes`}>Observações</label>
        <textarea id={`${prefixo}-observacoes`} className="textarea" {...register(`${prefixo}.observacoes`)} />
      </div>
    </div>
  )
}
