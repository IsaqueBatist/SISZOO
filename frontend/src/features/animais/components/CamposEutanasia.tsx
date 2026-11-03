import { useFormContext } from 'react-hook-form'
import { formatarDataHoraBR } from '@/lib/datas'
import { semEspacos } from '@/lib/texto'
import type { AnimalFormUiValues } from '../schemas/animalFormSchema'
import type { Animal } from '../types/animais.types'

export type LaudoRegistrado = Pick<
  Animal,
  | 'laudoEutanasia'
  | 'laudoEutanasiaResponsavelNome'
  | 'laudoEutanasiaCrmv'
  | 'laudoEutanasiaMetodo'
  | 'laudoEutanasiaInsensibilizacaoPrevia'
  | 'laudoEutanasiaRegistradoEm'
>

interface CamposEutanasiaProps {
  registrado: LaudoRegistrado | null
}

const AVISO_RESPONSABILIDADE = 'O sistema registra o laudo; a decisão técnica é do veterinário responsável.'

export function CamposEutanasia({ registrado }: CamposEutanasiaProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AnimalFormUiValues>()

  if (registrado?.laudoEutanasia) {
    return (
      <div className="field full">
        <p className="hint">O laudo de eutanásia já foi registrado e não pode ser alterado.</p>
        <div className="kv-list">
          <LaudoEutanasiaRegistrado laudo={registrado} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="field full">
        <label htmlFor="laudoEutanasia">
          Laudo de eutanásia <span className="req">*</span>
        </label>
        <textarea
          id="laudoEutanasia"
          className={`input${errors.laudoEutanasia ? ' error' : ''}`}
          aria-invalid={errors.laudoEutanasia ? true : undefined}
          aria-describedby={errors.laudoEutanasia ? 'laudoEutanasia-erro' : 'laudoEutanasia-dica'}
          rows={4}
          maxLength={4000}
          placeholder="Justificativa do responsável técnico (Lei nº 14.228/2021, art. 2º, § 1º)"
          {...register('laudoEutanasia', { setValueAs: semEspacos })}
        />
        {errors.laudoEutanasia ? (
          <span className="err" id="laudoEutanasia-erro">{errors.laudoEutanasia.message}</span>
        ) : (
          <span className="hint" id="laudoEutanasia-dica">
            {AVISO_RESPONSABILIDADE} Depois de salvo, o laudo não pode ser alterado.
          </span>
        )}
      </div>
      <div className="field">
        <label htmlFor="metodoEutanasia">
          Método <span className="req">*</span>
        </label>
        <input
          id="metodoEutanasia"
          className={`input${errors.metodoEutanasia ? ' error' : ''}`}
          aria-invalid={errors.metodoEutanasia ? true : undefined}
          aria-describedby={errors.metodoEutanasia ? 'metodoEutanasia-erro' : undefined}
          maxLength={120}
          placeholder="Método empregado"
          {...register('metodoEutanasia', { setValueAs: semEspacos })}
        />
        {errors.metodoEutanasia && (
          <span className="err" id="metodoEutanasia-erro">{errors.metodoEutanasia.message}</span>
        )}
      </div>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend>
          Insensibilização prévia <span className="req">*</span>
        </legend>
        <label className="check">
          <input
            type="checkbox"
            aria-invalid={errors.insensibilizacaoPrevia ? true : undefined}
            aria-describedby={errors.insensibilizacaoPrevia ? 'insensibilizacaoPrevia-erro' : undefined}
            {...register('insensibilizacaoPrevia')}
          />
          O animal foi insensibilizado antes do procedimento
        </label>
        {errors.insensibilizacaoPrevia && (
          <span className="err" id="insensibilizacaoPrevia-erro">{errors.insensibilizacaoPrevia.message}</span>
        )}
      </fieldset>
    </>
  )
}

export function LaudoEutanasiaRegistrado({ laudo }: { laudo: LaudoRegistrado }) {
  return (
    <>
      <div className="kv-row">
        <span className="k">Laudo de eutanásia</span>
        <span className="v">{laudo.laudoEutanasia ?? '— (não informado)'}</span>
      </div>
      <div className="kv-row">
        <span className="k">Veterinário responsável</span>
        <span className="v">{laudo.laudoEutanasiaResponsavelNome ?? '— (não registrado)'}</span>
      </div>
      <div className="kv-row">
        <span className="k">CRMV</span>
        <span className="v mono">{laudo.laudoEutanasiaCrmv ?? '—'}</span>
      </div>
      <div className="kv-row">
        <span className="k">Método</span>
        <span className="v">{laudo.laudoEutanasiaMetodo ?? '—'}</span>
      </div>
      <div className="kv-row">
        <span className="k">Insensibilização prévia</span>
        <span className="v">
          {laudo.laudoEutanasiaInsensibilizacaoPrevia == null
            ? '—'
            : laudo.laudoEutanasiaInsensibilizacaoPrevia
              ? 'Sim'
              : 'Não'}
        </span>
      </div>
      <div className="kv-row">
        <span className="k">Registrado em</span>
        <span className="v">{formatarDataHoraBR(laudo.laudoEutanasiaRegistradoEm)}</span>
      </div>
    </>
  )
}
