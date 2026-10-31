import { hojeEmItu } from '@/lib/datas'
import { useFormContext } from 'react-hook-form'
import type { OcorrenciaFormValues } from '../schemas/ocorrenciaFormSchema'
import { useSugestoesBairroQuery } from '../hooks/useSugestoesBairro'

// Card 2 do formulário de ocorrência: quando, onde e o que aconteceu.
export function SecaoDadosOcorrencia() {
  const {
    register,
    formState: { errors },
  } = useFormContext<OcorrenciaFormValues>()

  // Sugestão de preenchimento (datalist nativo) com bairros já usados em
  // ocorrências existentes — reduz grafias divergentes do mesmo bairro sem
  // travar o campo (continua texto livre) nem exigir catálogo no backend.
  // Falha ao carregar não afeta o formulário: o campo segue editável.
  const { data: bairrosConhecidos } = useSugestoesBairroQuery()

  return (
    <div className="card">
      <div className="card-header">
        <h3>2. Dados da Ocorrência</h3>
      </div>
      <div className="card-body">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="oc-data">
              Data de abertura <span className="req">*</span>
            </label>
            <input
              id="oc-data"
              className={`input${errors.dataAbertura ? ' error' : ''}`} aria-invalid={errors.dataAbertura ? true : undefined} aria-describedby={errors.dataAbertura ? 'oc-data-erro' : undefined}
              type="date"
              max={hojeEmItu()}
              {...register('dataAbertura')}
            />
            {errors.dataAbertura && <span className="err" id="oc-data-erro">{errors.dataAbertura.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="oc-hora">Hora aproximada</label>
            <input id="oc-hora" className="input" type="time" {...register('horaAbertura')} />
          </div>
          <div className="field full">
            <label htmlFor="oc-endereco">
              Endereço da ocorrência <span className="req">*</span>
            </label>
            <input
              id="oc-endereco"
              className={`input${errors.endereco ? ' error' : ''}`} aria-invalid={errors.endereco ? true : undefined} aria-describedby={errors.endereco ? 'oc-endereco-erro' : undefined}
              type="text"
              placeholder="Logradouro, número, complemento"
              {...register('endereco')}
            />
            {errors.endereco && <span className="err" id="oc-endereco-erro">{errors.endereco.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="oc-bairro">
              Bairro <span className="req">*</span>
            </label>
            <input
              id="oc-bairro"
              className={`input${errors.bairro ? ' error' : ''}`} aria-invalid={errors.bairro ? true : undefined} aria-describedby={errors.bairro ? 'oc-bairro-erro' : undefined}
              type="text"
              placeholder="Ex: Vila Esperança"
              list="bairros-conhecidos"
              {...register('bairro')}
            />
            <datalist id="bairros-conhecidos">
              {(bairrosConhecidos ?? []).map((bairro) => (
                <option key={bairro} value={bairro} />
              ))}
            </datalist>
            {errors.bairro && <span className="err" id="oc-bairro-erro">{errors.bairro.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="oc-ponto-referencia">Ponto de referência</label>
            <input
              id="oc-ponto-referencia"
              className="input"
              type="text"
              placeholder="Ex: próximo à escola municipal"
              {...register('pontoReferencia')}
            />
          </div>
          <div className="field full">
            <label htmlFor="oc-descricao">
              Descrição da ocorrência <span className="req">*</span>
            </label>
            <textarea
              id="oc-descricao"
              className={`textarea${errors.descricao ? ' error' : ''}`} aria-invalid={errors.descricao ? true : undefined} aria-describedby={errors.descricao ? 'oc-descricao-erro' : undefined}
              placeholder="Descreva os fatos relatados pelo denunciante com clareza..."
              {...register('descricao')}
            />
            {errors.descricao && <span className="err" id="oc-descricao-erro">{errors.descricao.message}</span>}
          </div>
          <div className="field full">
            <label className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" {...register('urgente')} />
              Urgente (contato humano-animal)
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
