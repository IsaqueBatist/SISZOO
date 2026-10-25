import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { RadioCards } from '@/components/RadioCards'
import { hojeEmItu } from '@/lib/datas'
import { useBaiasAtivasQuery, useCatalogosAnimaisQuery } from '../hooks/useAnimais'
import { CASTRACAO_OPCOES, type AnimalFormUiValues } from '../schemas/animalFormSchema'
import { semEspacos, semVazio } from '../utils/animalFormMapeamento'

interface CamposSaudeBaiaProps {
  // Baia em que o animal já está (edição): continua selecionável mesmo
  // superlotada.
  baiaAtualId: string
}

// Etapa 2 do cadastro de animal: baia, situação, entrada e castração.
export function CamposSaudeBaia({ baiaAtualId }: CamposSaudeBaiaProps) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<AnimalFormUiValues>()
  const [status, castracaoOpcao] = useWatch({ control, name: ['status', 'castracaoOpcao'] })
  const { data: catalogos } = useCatalogosAnimaisQuery()
  const { data: baias } = useBaiasAtivasQuery()

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="baiaId">Baia atual</label>
        <select id="baiaId" className="select" {...register('baiaId', { setValueAs: semVazio })}>
          <option value="">Sem baia (em trânsito)</option>
          {baias?.map((baia) => (
            <option key={baia.id} value={baia.id} disabled={baia.superlotada && baia.id !== baiaAtualId}>
              {baia.nome} — {baia.ocupacaoAtual}/{baia.capacidade}
              {baia.superlotada ? ' (superlotada)' : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="status">
          Status <span className="req">*</span>
        </label>
        <select id="status" className={`select${errors.status ? ' error' : ''}`} {...register('status')}>
          <option value="" disabled>
            Selecione…
          </option>
          {catalogos?.status.map((item) => (
            <option key={item.codigo} value={item.codigo}>
              {item.nome}
            </option>
          ))}
        </select>
        {errors.status && <span className="err">{errors.status.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="motivoEntrada">
          Motivo de entrada <span className="req">*</span>
        </label>
        <select id="motivoEntrada" className={`select${errors.motivoEntrada ? ' error' : ''}`} {...register('motivoEntrada')}>
          <option value="" disabled>
            Selecione…
          </option>
          {catalogos?.motivosEntrada.map((item) => (
            <option key={item.codigo} value={item.codigo}>
              {item.nome}
            </option>
          ))}
        </select>
        {errors.motivoEntrada && <span className="err">{errors.motivoEntrada.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="dataEntrada">
          Data de entrada <span className="req">*</span>
        </label>
        <input
          id="dataEntrada"
          className={`input${errors.dataEntrada ? ' error' : ''}`}
          type="date"
          max={hojeEmItu()}
          {...register('dataEntrada')}
        />
        {errors.dataEntrada && <span className="err">{errors.dataEntrada.message}</span>}
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
                // O campo some da tela, mas o RHF guardaria o valor:
                // "não castrado" com data é recusado pelo backend.
                if (opcao === 'nao_castrado') setValue('dataEsterilizacao', undefined)
              }}
              colunas={3}
              aria-labelledby="castracao-label"
            />
          )}
        />
      </div>

      {castracaoOpcao !== 'nao_castrado' && (
        <div className="field">
          <label htmlFor="dataEsterilizacao">Data da castração</label>
          <input
            id="dataEsterilizacao"
            className={`input${errors.dataEsterilizacao ? ' error' : ''}`}
            type="date"
            max={hojeEmItu()}
            {...register('dataEsterilizacao', { setValueAs: semVazio })}
          />
          {errors.dataEsterilizacao && <span className="err">{errors.dataEsterilizacao.message}</span>}
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
          className={`input${errors.procedencia ? ' error' : ''}`}
          type="text"
          maxLength={200}
          placeholder="Ex.: Recolhido na Rua das Flores, Vila Progresso"
          {...register('procedencia', { setValueAs: semEspacos })}
        />
        {errors.procedencia ? (
          <span className="err">{errors.procedencia.message}</span>
        ) : (
          <span className="hint">Origem do animal na entrada (RF-A05), complementar ao motivo de entrada.</span>
        )}
      </div>

      {/* F2-008: o laudo só aparece (e só é exigido) quando o destino é eutanásia. */}
      {status === 'obito_eutanasia' && (
        <div className="field full">
          <label htmlFor="laudoEutanasia">
            Laudo de eutanásia <span className="req">*</span>
          </label>
          <textarea
            id="laudoEutanasia"
            className={`input${errors.laudoEutanasia ? ' error' : ''}`}
            rows={4}
            maxLength={4000}
            placeholder="Justificativa do responsável técnico (Lei nº 14.228/2021, art. 2º, § 1º)"
            {...register('laudoEutanasia', { setValueAs: semEspacos })}
          />
          {errors.laudoEutanasia ? (
            <span className="err">{errors.laudoEutanasia.message}</span>
          ) : (
            <span className="hint">Obrigatório ao registrar o destino óbito por eutanásia.</span>
          )}
        </div>
      )}
    </div>
  )
}
