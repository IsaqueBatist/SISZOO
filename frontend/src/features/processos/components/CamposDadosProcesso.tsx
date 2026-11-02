import { useFormContext } from 'react-hook-form'
import { useCatalogosProcessoQuery } from '../hooks/useProcessos'
import type { ProcessoFormValues } from '../schemas/processoFormSchema'

interface CamposDadosProcessoProps {
  edicao?: { doencaBloqueada: boolean }
}

export function CamposDadosProcesso({ edicao }: CamposDadosProcessoProps) {
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
        <input id="proc-data-abertura" className={`input${errors.dataAbertura ? ' error' : ''}`} aria-invalid={errors.dataAbertura ? true : undefined} aria-describedby={errors.dataAbertura ? 'proc-data-abertura-erro' : undefined} type="date" disabled={Boolean(edicao)} {...register('dataAbertura')} />
        {edicao && <span className="hint">A data de abertura não muda depois do registro.</span>}
        {errors.dataAbertura && <span className="err" id="proc-data-abertura-erro">{errors.dataAbertura.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="proc-doenca">
          Tipo de doença investigada <span className="req">*</span>
        </label>
        <select id="proc-doenca" className={`select${errors.doenca ? ' error' : ''}`} aria-invalid={errors.doenca ? true : undefined} aria-describedby={errors.doenca ? 'proc-doenca-erro' : undefined} disabled={edicao?.doencaBloqueada} {...register('doenca')}>
          <option value="" disabled>
            Selecione
          </option>
          {catalogos?.doencas.map((opcao) => (
            <option key={opcao.codigo} value={opcao.codigo}>
              {opcao.nome}
            </option>
          ))}
        </select>
        {errors.doenca && <span className="err" id="proc-doenca-erro">{errors.doenca.message}</span>}
        {edicao?.doencaBloqueada && <span className="hint">A doença não muda depois de lançado o resultado.</span>}
      </div>
      <div className="field">
        <label htmlFor="proc-laboratorio">
          Laboratório de destino <span className="req">*</span>
        </label>
        <select id="proc-laboratorio" className={`select${errors.laboratorio ? ' error' : ''}`} aria-invalid={errors.laboratorio ? true : undefined} aria-describedby={errors.laboratorio ? 'proc-laboratorio-erro' : undefined} {...register('laboratorio')}>
          <option value="" disabled>
            Selecione
          </option>
          {catalogos?.laboratorios.map((opcao) => (
            <option key={opcao.codigo} value={opcao.codigo}>
              {opcao.nome}
            </option>
          ))}
        </select>
        {errors.laboratorio && <span className="err" id="proc-laboratorio-erro">{errors.laboratorio.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="proc-gal">Nº GAL</label>
        <input
          id="proc-gal"
          className={`input mono${errors.galNumero ? ' error' : ''}`} aria-invalid={errors.galNumero ? true : undefined} aria-describedby={errors.galNumero ? 'proc-gal-erro' : undefined}
          type="text"
          maxLength={40}
          placeholder="Protocolo no GAL (opcional)"
          {...register('galNumero')}
        />
        {errors.galNumero ? (
          <span className="err" id="proc-gal-erro">{errors.galNumero.message}</span>
        ) : (
          <span className="hint">Registro manual; sem integração com o sistema estadual.</span>
        )}
      </div>
      <div className="field">
        <label htmlFor="proc-sinan">Nº SINAN</label>
        <input
          id="proc-sinan"
          className={`input mono${errors.sinanNumero ? ' error' : ''}`} aria-invalid={errors.sinanNumero ? true : undefined} aria-describedby={errors.sinanNumero ? 'proc-sinan-erro' : undefined}
          type="text"
          maxLength={40}
          placeholder="Notificação no SINAN (opcional)"
          {...register('sinanNumero')}
        />
        {errors.sinanNumero && <span className="err" id="proc-sinan-erro">{errors.sinanNumero.message}</span>}
      </div>
      <div className="field full">
        <label htmlFor="proc-observacoes">Observações</label>
        <textarea id="proc-observacoes" className="textarea" {...register('observacoes')} />
      </div>
    </div>
  )
}
