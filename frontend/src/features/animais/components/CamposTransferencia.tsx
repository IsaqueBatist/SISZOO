import { useFormContext } from 'react-hook-form'
import { formatarDataHoraBR, hojeEmItu } from '@/lib/datas'
import { semEspacos } from '@/lib/texto'
import type { AnimalFormUiValues } from '../schemas/animalFormSchema'
import type { Animal } from '../types/animais.types'
import { semVazio } from '../utils/animalFormMapeamento'
import { formatarTipoDestinoTransferencia, TIPOS_DESTINO_TRANSFERENCIA } from '../utils/rotulosAnimal'

export type TransferenciaRegistrada = Pick<
  Animal,
  'tipoDestinoTransferencia' | 'destinoTransferencia' | 'dataSaida' | 'documentoTransferencia'
>

interface CamposTransferenciaProps {
  registrada: TransferenciaRegistrada | null
}

export function CamposTransferencia({ registrada }: CamposTransferenciaProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AnimalFormUiValues>()

  const campoDocumento = registrada?.documentoTransferencia ? (
    <div className="field">
      <span className="k">Documento</span>
      <span className="v">{registrada.documentoTransferencia}</span>
    </div>
  ) : (
    <div className="field">
      <label htmlFor="documentoTransferencia">Documento</label>
      <input
        id="documentoTransferencia"
        className={`input${errors.documentoTransferencia ? ' error' : ''}`}
        aria-invalid={errors.documentoTransferencia ? true : undefined}
        aria-describedby={errors.documentoTransferencia ? 'documentoTransferencia-erro' : 'documentoTransferencia-dica'}
        maxLength={120}
        placeholder="Número do ofício ou nome do anexo"
        {...register('documentoTransferencia', { setValueAs: semEspacos })}
      />
      {errors.documentoTransferencia ? (
        <span className="err" id="documentoTransferencia-erro">{errors.documentoTransferencia.message}</span>
      ) : (
        <span className="hint" id="documentoTransferencia-dica">
          Opcional. O arquivo do ofício pode ser enviado nos anexos da ficha.
        </span>
      )}
    </div>
  )

  if (registrada?.dataSaida) {
    return (
      <div className="field full">
        <p className="hint">
          A transferência já foi registrada e não pode ser alterada. Se o documento ficou em branco, ele ainda pode ser
          informado.
        </p>
        <div className="kv-list">
          <div className="kv-row">
            <span className="k">Tipo de destino</span>
            <span className="v">{formatarTipoDestinoTransferencia(registrada.tipoDestinoTransferencia)}</span>
          </div>
          <div className="kv-row">
            <span className="k">Destino</span>
            <span className="v">{registrada.destinoTransferencia}</span>
          </div>
          <div className="kv-row">
            <span className="k">Saída</span>
            <span className="v">{formatarDataHoraBR(registrada.dataSaida)}</span>
          </div>
        </div>
        {campoDocumento}
      </div>
    )
  }

  return (
    <>
      <div className="field">
        <label htmlFor="tipoDestinoTransferencia">
          Tipo de destino <span className="req">*</span>
        </label>
        <select
          id="tipoDestinoTransferencia"
          className={`select${errors.tipoDestinoTransferencia ? ' error' : ''}`}
          aria-invalid={errors.tipoDestinoTransferencia ? true : undefined}
          aria-describedby={errors.tipoDestinoTransferencia ? 'tipoDestinoTransferencia-erro' : undefined}
          {...register('tipoDestinoTransferencia', { setValueAs: semVazio })}
        >
          <option value="">Selecione…</option>
          {TIPOS_DESTINO_TRANSFERENCIA.map((tipo) => (
            <option key={tipo.valor} value={tipo.valor}>
              {tipo.label}
            </option>
          ))}
        </select>
        {errors.tipoDestinoTransferencia && (
          <span className="err" id="tipoDestinoTransferencia-erro">{errors.tipoDestinoTransferencia.message}</span>
        )}
      </div>
      <div className="field">
        <label htmlFor="destinoTransferencia">
          Destino <span className="req">*</span>
        </label>
        <input
          id="destinoTransferencia"
          className={`input${errors.destinoTransferencia ? ' error' : ''}`}
          aria-invalid={errors.destinoTransferencia ? true : undefined}
          aria-describedby={errors.destinoTransferencia ? 'destinoTransferencia-erro' : undefined}
          maxLength={200}
          placeholder="Órgão ou entidade que recebe o animal"
          {...register('destinoTransferencia', { setValueAs: semEspacos })}
        />
        {errors.destinoTransferencia && (
          <span className="err" id="destinoTransferencia-erro">{errors.destinoTransferencia.message}</span>
        )}
      </div>
      <div className="field">
        <label htmlFor="dataSaida">
          Data e hora da saída <span className="req">*</span>
        </label>
        <input
          id="dataSaida"
          type="datetime-local"
          className={`input${errors.dataSaida ? ' error' : ''}`}
          aria-invalid={errors.dataSaida ? true : undefined}
          aria-describedby={errors.dataSaida ? 'dataSaida-erro' : undefined}
          max={`${hojeEmItu()}T23:59`}
          {...register('dataSaida', { setValueAs: semVazio })}
        />
        {errors.dataSaida && (
          <span className="err" id="dataSaida-erro">{errors.dataSaida.message}</span>
        )}
      </div>
      {campoDocumento}
    </>
  )
}
