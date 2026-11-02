import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { Switch } from '@/components/Switch'
import { aplicarMascaraAoDigitar, formatarCpf, formatarTelefone } from '@/lib/mascaras'
import type { OcorrenciaFormValues } from '../schemas/ocorrenciaFormSchema'

export function SecaoDenunciado() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<OcorrenciaFormValues>()
  const denunciadoAtivo = useWatch({ control, name: 'denunciadoAtivo' })

  return (
    <div className="card">
      <div className="card-header">
        <h3>4. Existe Denunciado?</h3>
        <div className="switch-row">
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Sim, há um responsável identificado</span>
          <Controller
            name="denunciadoAtivo"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} aria-label="Existe denunciado identificado" />
            )}
          />
        </div>
      </div>
      <div className="card-body">
        {denunciadoAtivo ? (
          <div className="form-grid">
            <div className="field">
              <label htmlFor="dcd-nome">Nome</label>
              <input id="dcd-nome" className="input" type="text" {...register('denunciado.nome')} />
            </div>
            <div className="field">
              <label htmlFor="dcd-cpf">CPF</label>
              <input
                id="dcd-cpf"
                className={`input mono${errors.denunciado?.cpf ? ' error' : ''}`}
                aria-invalid={errors.denunciado?.cpf ? true : undefined}
                aria-describedby={errors.denunciado?.cpf ? 'dcd-cpf-erro' : undefined}
                type="text"
                placeholder="000.000.000-00"
                {...register('denunciado.cpf', { onChange: aplicarMascaraAoDigitar(formatarCpf) })}
              />
              {errors.denunciado?.cpf && <span className="err" id="dcd-cpf-erro">{errors.denunciado.cpf.message}</span>}
            </div>
            <div className="field full">
              <label htmlFor="dcd-endereco">Endereço</label>
              <input
                id="dcd-endereco"
                className="input"
                type="text"
                placeholder="Logradouro, número, bairro"
                {...register('denunciado.endereco')}
              />
            </div>
            <div className="field">
              <label htmlFor="dcd-telefone">Telefone</label>
              <input
                id="dcd-telefone"
                className={`input mono${errors.denunciado?.telefone ? ' error' : ''}`}
                aria-invalid={errors.denunciado?.telefone ? true : undefined}
                aria-describedby={errors.denunciado?.telefone ? 'dcd-telefone-erro' : undefined}
                type="text"
                placeholder="(11) 90000-0000"
                {...register('denunciado.telefone', { onChange: aplicarMascaraAoDigitar(formatarTelefone) })}
              />
              {errors.denunciado?.telefone && <span className="err" id="dcd-telefone-erro">{errors.denunciado.telefone.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="dcd-observacoes">Observações</label>
              <input id="dcd-observacoes" className="input" type="text" {...register('denunciado.observacoes')} />
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Ative o seletor acima para informar dados do denunciado.
          </p>
        )}
      </div>
    </div>
  )
}
