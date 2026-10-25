import { useFormContext } from 'react-hook-form'
import { useCatalogosProcessoQuery } from '../hooks/useProcessos'
import type { ProcessoFormValues } from '../schemas/processoFormSchema'

// Etapa 1 do processo sanitário, depois do vínculo: abertura, doença,
// laboratório e os números GAL/SINAN.
export function CamposDadosProcesso() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProcessoFormValues>()
  const { data: catalogos } = useCatalogosProcessoQuery()

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="proc-data-abertura">
          Data de abertura <span className="req">*</span>
        </label>
        <input id="proc-data-abertura" className={`input${errors.dataAbertura ? ' error' : ''}`} type="date" {...register('dataAbertura')} />
        {errors.dataAbertura && <span className="err">{errors.dataAbertura.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="proc-doenca">
          Tipo de doença investigada <span className="req">*</span>
        </label>
        <select id="proc-doenca" className={`select${errors.doenca ? ' error' : ''}`} {...register('doenca')}>
          <option value="" disabled>
            Selecione
          </option>
          {catalogos?.doencas.map((opcao) => (
            <option key={opcao.codigo} value={opcao.codigo}>
              {opcao.nome}
            </option>
          ))}
        </select>
        {errors.doenca && <span className="err">{errors.doenca.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="proc-laboratorio">
          Laboratório de destino <span className="req">*</span>
        </label>
        <select id="proc-laboratorio" className={`select${errors.laboratorio ? ' error' : ''}`} {...register('laboratorio')}>
          <option value="" disabled>
            Selecione
          </option>
          {catalogos?.laboratorios.map((opcao) => (
            <option key={opcao.codigo} value={opcao.codigo}>
              {opcao.nome}
            </option>
          ))}
        </select>
        {errors.laboratorio && <span className="err">{errors.laboratorio.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="proc-gal">Nº GAL</label>
        <input
          id="proc-gal"
          className={`input mono${errors.galNumero ? ' error' : ''}`}
          type="text"
          maxLength={40}
          placeholder="Protocolo no GAL (opcional)"
          {...register('galNumero')}
        />
        {errors.galNumero ? (
          <span className="err">{errors.galNumero.message}</span>
        ) : (
          <span className="hint">Registro manual; sem integração com o sistema estadual.</span>
        )}
      </div>
      <div className="field">
        <label htmlFor="proc-sinan">Nº SINAN</label>
        <input
          id="proc-sinan"
          className={`input mono${errors.sinanNumero ? ' error' : ''}`}
          type="text"
          maxLength={40}
          placeholder="Notificação no SINAN (opcional)"
          {...register('sinanNumero')}
        />
        {errors.sinanNumero && <span className="err">{errors.sinanNumero.message}</span>}
      </div>
      <div className="field full">
        <label htmlFor="proc-observacoes">Observações</label>
        <textarea id="proc-observacoes" className="textarea" {...register('observacoes')} />
      </div>
    </div>
  )
}
