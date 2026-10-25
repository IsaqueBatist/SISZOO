import { Controller, useFormContext } from 'react-hook-form'
import { RadioCards } from '@/components/RadioCards'
import { hojeEmItu } from '@/lib/datas'
import { useCatalogosAnimaisQuery } from '../hooks/useAnimais'
import { PELAGEM_OPCOES, PORTE_OPCOES, SEXO_OPCOES, type AnimalFormUiValues } from '../schemas/animalFormSchema'
import { paraNumeroOuIndefinido, semEspacos, semVazio } from '../utils/animalFormMapeamento'

interface CamposDadosBasicosProps {
  // Microchip já definido não muda mais (regra do backend replicada na UI).
  microchipTravado: boolean
}

// Etapa 1 do cadastro de animal: identificação e características.
export function CamposDadosBasicos({ microchipTravado }: CamposDadosBasicosProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<AnimalFormUiValues>()
  const { data: catalogos } = useCatalogosAnimaisQuery()

  return (
    <div className="form-grid">
      <div className="field full">
        <label htmlFor="nome">
          Nome do animal <span className="req">*</span>
        </label>
        <input id="nome" className={`input${errors.nome ? ' error' : ''}`} type="text" placeholder="Ex: Rex" {...register('nome')} />
        {errors.nome ? (
          <span className="err">{errors.nome.message}</span>
        ) : (
          <span className="hint">Use o nome de chamada do animal. Se desconhecido, use um apelido.</span>
        )}
      </div>

      <div className="field full">
        <label id="especie-label">
          Espécie <span className="req">*</span>
        </label>
        <Controller
          name="especie"
          control={control}
          render={({ field }) => (
            <RadioCards
              opcoes={(catalogos?.especies ?? []).map((item) => ({ valor: item.codigo, label: item.nome }))}
              valor={field.value}
              onChange={field.onChange}
              aria-labelledby="especie-label"
            />
          )}
        />
        {errors.especie && <span className="err">{errors.especie.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="microchip">Microchip</label>
        <input
          id="microchip"
          className={`input mono${errors.microchip ? ' error' : ''}`}
          type="text"
          placeholder="985121234567890"
          maxLength={15}
          disabled={microchipTravado}
          {...register('microchip', { setValueAs: semEspacos })}
        />
        {errors.microchip ? (
          <span className="err">{errors.microchip.message}</span>
        ) : (
          <span className="hint">
            {microchipTravado
              ? 'Microchip já definido: não pode mais ser alterado.'
              : '15 dígitos numéricos (ISO 11784). Ficha fica incompleta sem microchip.'}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="dataImplantacaoChip">Data de implantação do chip</label>
        <input
          id="dataImplantacaoChip"
          className={`input${errors.dataImplantacaoChip ? ' error' : ''}`}
          type="date"
          max={hojeEmItu()}
          {...register('dataImplantacaoChip', { setValueAs: semEspacos })}
        />
        {errors.dataImplantacaoChip ? (
          <span className="err">{errors.dataImplantacaoChip.message}</span>
        ) : (
          <span className="hint">Registrada quando o chip é implantado no CCZ (RN01). Exige microchip.</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="numeroMedalha">Número da medalha</label>
        <input
          id="numeroMedalha"
          className={`input mono${errors.numeroMedalha ? ' error' : ''}`}
          type="text"
          maxLength={30}
          placeholder="Ex.: M-0042"
          {...register('numeroMedalha', { setValueAs: semEspacos })}
        />
        {errors.numeroMedalha ? (
          <span className="err">{errors.numeroMedalha.message}</span>
        ) : (
          <span className="hint">Plaqueta de identificação; única quando informada.</span>
        )}
      </div>

      <div className="field">
        <label id="sexo-label">
          Sexo <span className="req">*</span>
        </label>
        <Controller
          name="sexo"
          control={control}
          render={({ field }) => (
            <RadioCards opcoes={SEXO_OPCOES} valor={field.value} onChange={field.onChange} colunas={3} aria-labelledby="sexo-label" />
          )}
        />
        {errors.sexo && <span className="err">{errors.sexo.message}</span>}
      </div>

      <div className="field">
        <label id="porte-label">Porte</label>
        <Controller
          name="porte"
          control={control}
          render={({ field }) => (
            <RadioCards opcoes={PORTE_OPCOES} valor={field.value} onChange={field.onChange} colunas={3} aria-labelledby="porte-label" />
          )}
        />
      </div>

      <div className="field">
        <label htmlFor="raca">Raça</label>
        <input
          id="raca"
          className="input"
          type="text"
          placeholder="Ex: SRD, Labrador, Poodle..."
          {...register('raca', { setValueAs: semEspacos })}
        />
      </div>
      <div className="field">
        <label htmlFor="dataNascimentoAprox">Data provável de nascimento</label>
        <input
          id="dataNascimentoAprox"
          className={`input${errors.dataNascimentoAprox ? ' error' : ''}`}
          type="date"
          max={hojeEmItu()}
          {...register('dataNascimentoAprox', { setValueAs: semVazio })}
        />
        {errors.dataNascimentoAprox && <span className="err">{errors.dataNascimentoAprox.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="pelagem">Pelagem</label>
        <select id="pelagem" className="select" {...register('pelagem', { setValueAs: semVazio })}>
          <option value="">Selecione…</option>
          {PELAGEM_OPCOES.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="coloracao">Cor / coloração</label>
        <input
          id="coloracao"
          className="input"
          type="text"
          placeholder="Ex: Caramelo, Preto e branco..."
          {...register('coloracao', { setValueAs: semEspacos })}
        />
      </div>

      <div className="field">
        <label htmlFor="idadeAprox">Idade aproximada</label>
        <input id="idadeAprox" className="input" type="text" placeholder="Ex: 2 anos" {...register('idadeAprox', { setValueAs: semEspacos })} />
      </div>
      <div className="field">
        <label htmlFor="pesoKg">Peso (kg)</label>
        <input
          id="pesoKg"
          className={`input${errors.pesoKg ? ' error' : ''}`}
          type="number"
          step="0.1"
          min="0"
          placeholder="Ex: 12.5"
          {...register('pesoKg', { setValueAs: paraNumeroOuIndefinido })}
        />
        {errors.pesoKg && <span className="err">{errors.pesoKg.message}</span>}
      </div>
    </div>
  )
}
