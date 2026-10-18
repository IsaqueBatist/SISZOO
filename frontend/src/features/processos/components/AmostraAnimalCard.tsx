import { useState } from 'react'
import { Controller, type Control, type Path, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from 'react-hook-form'
import { Icon } from '@/components/layout/Icon'
import { PELAGEM_OPCOES, SEXO_OPCOES } from '@/features/animais/schemas/animalFormSchema'
import { useAnimaisQuery, useCatalogosAnimaisQuery } from '@/features/animais/hooks/useAnimais'
import type { Animal } from '@/features/animais/types/animais.types'
import type { ProcessoFormValues } from '../schemas/processoFormSchema'
import { useCatalogosProcessoQuery } from '../hooks/useProcessos'
import { MATERIAL_BIOLOGICO_OPCOES, NIVEL_CONTATO_OPCOES, STATUS_CLINICO_OPCOES, TIPO_ABRIGO_OPCOES } from '../utils/processosCatalogos'

const TAMANHO_BUSCA_ANIMAL = 8

// Tipo mínimo do erro de uma amostra — o RHF não distribui bem FieldErrors
// sobre a união discriminada em arrays.
export interface AmostraErros {
  sexo?: { message?: string }
  statusClinico?: { message?: string }
  tipoAbrigo?: { message?: string }
  dataColeta?: { message?: string }
  materialBiologico?: { message?: string }
  animalId?: { message?: string }
  especie?: { message?: string }
  nivelContato?: { message?: string }
  agrediuHumano?: { message?: string }
  sintomas?: { message?: string }
  pesoKg?: { message?: string }
}

function paraNumeroOuIndefinido(valor: unknown): number | undefined {
  if (typeof valor === 'number') return Number.isNaN(valor) ? undefined : valor
  if (typeof valor !== 'string') return undefined
  const limpo = valor.trim()
  return limpo === '' ? undefined : Number(limpo)
}

// Texto do animal escolhido no cartão e na revisão: a identificação gravada
// na amostra é copiada da ficha pelo servidor (DH-5), não por aqui.
function descricaoDoAnimal(animal: Animal): string {
  return [animal.nome, animal.especieNome, animal.microchip ?? 'sem microchip'].join(' · ')
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

  // Os campos de cada modalidade só existem numa das variantes da união; o
  // caminho é montado aqui e o tipo é afrouxado de propósito.
  const campo = (nome: string) => `amostras.${index}.${nome}` as Path<ProcessoFormValues>
  const definir = (nome: string, valor: unknown, validar = false) => setValue(campo(nome), valor as never, { shouldValidate: validar })

  const amostra = watch(`amostras.${index}`) as ProcessoFormValues['amostras'][number]
  const origem = amostra.origem
  const animalId = amostra.origem === 'canil' ? amostra.animalId : ''
  const animalDescricao = amostra.origem === 'canil' ? amostra.animalDescricao : ''

  const { data: catalogosAnimais } = useCatalogosAnimaisQuery()
  const { data: catalogosProcesso } = useCatalogosProcessoQuery()
  const { data: resultadoBusca } = useAnimaisQuery({ q: buscaAnimal || undefined, pagina: 0, tamanho: TAMANHO_BUSCA_ANIMAL })

  function selecionarOrigem(novaOrigem: 'canil' | 'externo') {
    if (novaOrigem === origem) return
    // Troca de modo descarta os dados do modo anterior: o payload só leva os
    // campos da modalidade atual (ProcessoForm), e a tela não mostra resto.
    definir('origem', novaOrigem)
    if (novaOrigem === 'canil') {
      definir('animalId', '')
      definir('animalDescricao', '')
    } else {
      for (const nome of ['especie', 'sexo', 'raca', 'coloracao', 'pelagem', 'idadeAprox']) definir(nome, '')
      definir('pesoKg', undefined)
    }
    setBuscaAnimal('')
  }

  function selecionarAnimal(animal: Animal) {
    definir('animalId', animal.id, true)
    definir('animalDescricao', descricaoDoAnimal(animal))
    setMostrarSugestoes(false)
    setBuscaAnimal('')
  }

  function trocarAnimal() {
    definir('animalId', '')
    definir('animalDescricao', '')
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
              Animal de campo
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
                <div className="name">{animalDescricao || 'Animal selecionado'}</div>
                <div className="meta">Espécie, sexo, raça, pelagem, idade e peso são copiados da ficha ao registrar.</div>
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
            <label htmlFor={`amostra-${index}-especie`}>
              Espécie <span className="req">*</span>
            </label>
            <select id={`amostra-${index}-especie`} className={`select${erros?.especie ? ' error' : ''}`} defaultValue="" {...register(campo('especie'))}>
              <option value="" disabled>
                Selecione
              </option>
              {catalogosAnimais?.especies.map((especie) => (
                <option key={especie.codigo} value={especie.codigo}>
                  {especie.nome}
                </option>
              ))}
            </select>
            {erros?.especie && <span className="err">{erros.especie.message}</span>}
          </div>
          <div className="field">
            <label htmlFor={`amostra-${index}-sexo`}>
              Sexo <span className="req">*</span>
            </label>
            <select id={`amostra-${index}-sexo`} className={`select${erros?.sexo ? ' error' : ''}`} defaultValue="" {...register(campo('sexo'))}>
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
            <label htmlFor={`amostra-${index}-raca`}>Raça</label>
            <input id={`amostra-${index}-raca`} className="input" type="text" {...register(campo('raca'))} />
          </div>
          <div className="field">
            <label htmlFor={`amostra-${index}-coloracao`}>Coloração</label>
            <input id={`amostra-${index}-coloracao`} className="input" type="text" {...register(campo('coloracao'))} />
          </div>
          <div className="field">
            <label htmlFor={`amostra-${index}-pelagem`}>Pelagem</label>
            <select id={`amostra-${index}-pelagem`} className="select" defaultValue="" {...register(campo('pelagem'))}>
              <option value="">—</option>
              {PELAGEM_OPCOES.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`amostra-${index}-idade`}>Idade aprox.</label>
            <input id={`amostra-${index}-idade`} className="input" type="text" {...register(campo('idadeAprox'))} />
          </div>
          <div className="field">
            <label htmlFor={`amostra-${index}-peso`}>Peso (kg)</label>
            <input
              id={`amostra-${index}-peso`}
              className={`input${erros?.pesoKg ? ' error' : ''}`}
              type="number"
              step="0.01"
              {...register(campo('pesoKg'), { setValueAs: paraNumeroOuIndefinido })}
            />
            {erros?.pesoKg && <span className="err">{erros.pesoKg.message}</span>}
          </div>
        </div>
      )}

      <div className="form-grid" style={{ marginTop: 14 }}>
        <div className="field">
          <label htmlFor={`amostra-${index}-data-coleta`}>
            Data de coleta <span className="req">*</span>
          </label>
          <input
            id={`amostra-${index}-data-coleta`}
            className={`input${erros?.dataColeta ? ' error' : ''}`}
            type="date"
            {...register(campo('dataColeta'))}
          />
          {erros?.dataColeta && <span className="err">{erros.dataColeta.message}</span>}
        </div>
        <div className="field">
          <label htmlFor={`amostra-${index}-material`}>
            Material biológico <span className="req">*</span>
          </label>
          <select
            id={`amostra-${index}-material`}
            className={`select${erros?.materialBiologico ? ' error' : ''}`}
            defaultValue=""
            {...register(campo('materialBiologico'))}
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
          <label htmlFor={`amostra-${index}-status-clinico`}>
            Status clínico <span className="req">*</span>
          </label>
          <select
            id={`amostra-${index}-status-clinico`}
            className={`select${erros?.statusClinico ? ' error' : ''}`}
            defaultValue=""
            {...register(campo('statusClinico'), {
              // T29-3: sintomas só em amostra sintomática — sair de
              // SINTOMATICO descarta os já marcados.
              onChange: (event) => {
                if (event.target.value !== 'SINTOMATICO') definir('sintomas', [])
              },
            })}
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
          <label htmlFor={`amostra-${index}-tipo-abrigo`}>
            Tipo de abrigo <span className="req">*</span>
          </label>
          <select
            id={`amostra-${index}-tipo-abrigo`}
            className={`select${erros?.tipoAbrigo ? ' error' : ''}`}
            defaultValue=""
            {...register(campo('tipoAbrigo'))}
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
          <label htmlFor={`amostra-${index}-alt-comportamental`}>Alteração comportamental</label>
          <textarea id={`amostra-${index}-alt-comportamental`} className="textarea" {...register(campo('alteracaoComportamental'))} />
        </div>
      </div>

      {amostra.statusClinico === 'SINTOMATICO' ? (
        <div style={{ marginTop: 14 }}>
          <label className="hint" style={{ display: 'block', marginBottom: 6 }}>
            Sinais e sintomas observados
          </label>
          <Controller
            name={campo('sintomas')}
            control={control}
            render={({ field }) => {
              const valorAtual = (field.value ?? []) as string[]
              return (
                <div className="checkbox-grid" role="group" aria-label={`Sintomas do animal amostrado ${numero}`}>
                  {(catalogosProcesso?.sintomas ?? []).map((sintoma) => {
                    const marcado = valorAtual.includes(sintoma.codigo)
                    return (
                      <label key={sintoma.codigo} className={marcado ? 'checked' : ''}>
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={(event) =>
                            field.onChange(
                              event.target.checked ? [...valorAtual, sintoma.codigo] : valorAtual.filter((s) => s !== sintoma.codigo),
                            )
                          }
                        />
                        {sintoma.nome}
                      </label>
                    )
                  })}
                </div>
              )
            }}
          />
          {erros?.sintomas && <span className="err">{erros.sintomas.message}</span>}
        </div>
      ) : (
        <p className="hint" style={{ marginTop: 14 }}>
          Sinais e sintomas são registrados apenas em amostra com status clínico sintomático.
        </p>
      )}

      <div style={{ marginTop: 14 }}>
        <div className="switch-row">
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Munícipe teve contato físico com o animal</span>
          <Controller
            name={campo('contatoHumano')}
            control={control}
            render={({ field }) => (
              <label className="switch">
                <input
                  type="checkbox"
                  checked={Boolean(field.value)}
                  onChange={(event) => {
                    field.onChange(event.target.checked)
                    if (!event.target.checked) {
                      definir('nivelContato', undefined)
                      definir('agrediuHumano', undefined)
                    }
                  }}
                  aria-label="Contato humano-animal"
                />
                <span className="slider" />
              </label>
            )}
          />
        </div>

        {amostra.contatoHumano && (
          <>
            {/* DER regra 18: contato humano em qualquer amostra marca o processo como urgente. */}
            <div className="urgency-banner" role="alert" style={{ marginTop: 10 }}>
              <span className="ub-ico">
                <Icon name="alert" size={22} />
              </span>
              <div>
                <h3>ATENÇÃO — CONTATO HUMANO-ANIMAL</h3>
                <p>Este processo será marcado como urgente.</p>
              </div>
            </div>

            <div className="am-flags">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="alert" size={14} />
                <strong>Nível de contato:</strong>
              </span>
              <Controller
                name={campo('nivelContato')}
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2" role="radiogroup" aria-label="Nível de contato">
                    {NIVEL_CONTATO_OPCOES.map((opcao) => (
                      <label key={opcao.valor} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="radio" checked={field.value === opcao.valor} onChange={() => field.onChange(opcao.valor)} />
                        {opcao.label}
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
                name={campo('agrediuHumano')}
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
        <label htmlFor={`amostra-${index}-observacoes`}>Observações</label>
        <textarea id={`amostra-${index}-observacoes`} className="textarea" {...register(campo('observacoes'))} />
      </div>
    </div>
  )
}
