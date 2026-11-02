import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { RadioCards } from '@/components/RadioCards'
import { hojeEmItu } from '@/lib/datas'
import { useBaiasAtivasQuery, useCatalogosAnimaisQuery } from '../hooks/useAnimais'
import { animalCastrado, CASTRACAO_OPCOES, CONDICAO_OUTRAS, type AnimalFormUiValues } from '../schemas/animalFormSchema'
import { semVazio } from '../utils/animalFormMapeamento'
import { semEspacos } from '@/lib/texto'

interface CamposSaudeBaiaProps {
  baiaAtualId: string
}

export function CamposSaudeBaia({ baiaAtualId }: CamposSaudeBaiaProps) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<AnimalFormUiValues>()
  const [status, castracaoOpcao, condicoes] = useWatch({ control, name: ['status', 'castracaoOpcao', 'condicoes'] })
  const { data: catalogos } = useCatalogosAnimaisQuery()
  const { data: baias } = useBaiasAtivasQuery()

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="baiaId">Baia atual</label>
        <Controller
          control={control}
          name="baiaId"
          render={({ field }) => (
            <select
              id="baiaId"
              className="select"
              ref={field.ref}
              name={field.name}
              onBlur={field.onBlur}
              value={field.value ?? ''}
              onChange={(evento) => field.onChange(semVazio(evento.target.value))}
            >
              <option value="">Sem baia (em trânsito)</option>
              {field.value && !baias?.some((baia) => baia.id === field.value) && <option value={field.value}>Baia atual</option>}
              {baias?.map((baia) => (
                <option key={baia.id} value={baia.id} disabled={baia.superlotada && baia.id !== baiaAtualId}>
                  {baia.nome} — {baia.ocupacaoAtual}/{baia.capacidade}
                  {baia.superlotada ? ' (superlotada)' : ''}
                </option>
              ))}
            </select>
          )}
        />
      </div>
      <div className="field">
        <label htmlFor="status">
          Status <span className="req">*</span>
        </label>
        <select id="status" className={`select${errors.status ? ' error' : ''}`} aria-invalid={errors.status ? true : undefined} aria-describedby={errors.status ? 'status-erro' : undefined} {...register('status')}>
          <option value="" disabled>
            Selecione…
          </option>
          {catalogos?.status.map((item) => (
            <option key={item.codigo} value={item.codigo}>
              {item.nome}
            </option>
          ))}
        </select>
        {errors.status && <span className="err" id="status-erro">{errors.status.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="motivoEntrada">
          Motivo de entrada <span className="req">*</span>
        </label>
        <select id="motivoEntrada" className={`select${errors.motivoEntrada ? ' error' : ''}`} aria-invalid={errors.motivoEntrada ? true : undefined} aria-describedby={errors.motivoEntrada ? 'motivoEntrada-erro' : undefined} {...register('motivoEntrada')}>
          <option value="" disabled>
            Selecione…
          </option>
          {catalogos?.motivosEntrada.map((item) => (
            <option key={item.codigo} value={item.codigo}>
              {item.nome}
            </option>
          ))}
        </select>
        {errors.motivoEntrada && <span className="err" id="motivoEntrada-erro">{errors.motivoEntrada.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="dataEntrada">
          Data de entrada <span className="req">*</span>
        </label>
        <input
          id="dataEntrada"
          className={`input${errors.dataEntrada ? ' error' : ''}`} aria-invalid={errors.dataEntrada ? true : undefined} aria-describedby={errors.dataEntrada ? 'dataEntrada-erro' : undefined}
          type="date"
          max={hojeEmItu()}
          {...register('dataEntrada')}
        />
        {errors.dataEntrada && <span className="err" id="dataEntrada-erro">{errors.dataEntrada.message}</span>}
      </div>

      <div className="field full">
        <label id="castracao-label">Castração</label>
        <Controller
          name="castracaoOpcao"
          control={control}
          render={({ field }) => (
            <RadioCards
              opcoes={CASTRACAO_OPCOES}
              valor={field.value}
              onChange={(opcao) => {
                field.onChange(opcao)
                if (!animalCastrado(opcao)) setValue('dataEsterilizacao', undefined)
              }}
              aria-labelledby="castracao-label"
            />
          )}
        />
      </div>

      {animalCastrado(castracaoOpcao) && (
        <div className="field">
          <label htmlFor="dataEsterilizacao">Data da castração</label>
          <input
            id="dataEsterilizacao"
            className={`input${errors.dataEsterilizacao ? ' error' : ''}`} aria-invalid={errors.dataEsterilizacao ? true : undefined} aria-describedby={errors.dataEsterilizacao ? 'dataEsterilizacao-erro' : undefined}
            type="date"
            max={hojeEmItu()}
            {...register('dataEsterilizacao', { setValueAs: semVazio })}
          />
          {errors.dataEsterilizacao && <span className="err" id="dataEsterilizacao-erro">{errors.dataEsterilizacao.message}</span>}
        </div>
      )}

      <fieldset className="field full" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend>Condições de saúde pré-existentes</legend>
        <div className="check-list inline">
          {catalogos?.condicoesSaude.map((condicao) => (
            <label className="check" key={condicao.codigo}>
              <input type="checkbox" value={condicao.codigo} {...register('condicoes')} />
              {condicao.codigo === CONDICAO_OUTRAS ? 'Outras (descrever abaixo)' : condicao.nome}
            </label>
          ))}
        </div>
        <span className="hint">Epilepsia, agressividade e outras condições que a equipe precisa conhecer.</span>
      </fieldset>

      {condicoes?.includes(CONDICAO_OUTRAS) && (
        <div className="field full">
          <label htmlFor="condicoesOutras">
            Qual é a outra condição? <span className="req">*</span>
          </label>
          <input
            id="condicoesOutras"
            className={`input${errors.condicoesOutras ? ' error' : ''}`}
            aria-invalid={errors.condicoesOutras ? true : undefined}
            aria-describedby={errors.condicoesOutras ? 'condicoesOutras-erro' : undefined}
            type="text"
            maxLength={500}
            {...register('condicoesOutras', { setValueAs: semVazio })}
          />
          {errors.condicoesOutras && <span className="err" id="condicoesOutras-erro">{errors.condicoesOutras.message}</span>}
        </div>
      )}

      <div className="field full">
        <label htmlFor="observacoes">Observações gerais</label>
        <textarea
          id="observacoes"
          className="textarea"
          placeholder="Comportamento, características marcantes, histórico relevante..."
          {...register('observacoes', { setValueAs: semEspacos })}
        />
      </div>

      <div className="field">
        <label htmlFor="procedencia">Procedência</label>
        <input
          id="procedencia"
          className={`input${errors.procedencia ? ' error' : ''}`} aria-invalid={errors.procedencia ? true : undefined} aria-describedby={errors.procedencia ? 'procedencia-erro' : undefined}
          type="text"
          maxLength={200}
          placeholder="Ex.: Recolhido na Rua das Flores, Vila Progresso"
          {...register('procedencia', { setValueAs: semEspacos })}
        />
        {errors.procedencia ? (
          <span className="err" id="procedencia-erro">{errors.procedencia.message}</span>
        ) : (
          <span className="hint">Origem do animal na entrada (RF-A05), complementar ao motivo de entrada.</span>
        )}
      </div>

      {status === 'obito_eutanasia' && (
        <div className="field full">
          <label htmlFor="laudoEutanasia">
            Laudo de eutanásia <span className="req">*</span>
          </label>
          <textarea
            id="laudoEutanasia"
            className={`input${errors.laudoEutanasia ? ' error' : ''}`} aria-invalid={errors.laudoEutanasia ? true : undefined} aria-describedby={errors.laudoEutanasia ? 'laudoEutanasia-erro' : undefined}
            rows={4}
            maxLength={4000}
            placeholder="Justificativa do responsável técnico (Lei nº 14.228/2021, art. 2º, § 1º)"
            {...register('laudoEutanasia', { setValueAs: semEspacos })}
          />
          {errors.laudoEutanasia ? (
            <span className="err" id="laudoEutanasia-erro">{errors.laudoEutanasia.message}</span>
          ) : (
            <span className="hint">Obrigatório ao registrar o destino óbito por eutanásia.</span>
          )}
        </div>
      )}
    </div>
  )
}
