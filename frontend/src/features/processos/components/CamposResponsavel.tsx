import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { aplicarMascaraAoDigitar, formatarCep, formatarCpf, formatarTelefone } from '@/lib/mascaras'
import { buscarEnderecoPorCep } from '@/lib/viaCep'
import type { ProcessoFormValues } from '../schemas/processoFormSchema'

// Etapa 2 do processo sanitário: o responsável / munícipe.
export function CamposResponsavel() {
  const {
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<ProcessoFormValues>()
  const [buscandoCep, setBuscandoCep] = useState(false)

  // Diferente do denunciante de ocorrência sigilosa, o responsável de
  // processo não tem esse conceito de sigilo — sempre pode disparar o
  // ViaCEP. Só preenche endereço/bairro se ainda estiverem vazios.
  async function aoMudarCep(valorDigitado: string) {
    const digitos = valorDigitado.replace(/\D/g, '')
    if (digitos.length !== 8) return

    setBuscandoCep(true)
    const endereco = await buscarEnderecoPorCep(valorDigitado)
    setBuscandoCep(false)
    if (!endereco) return

    if (!getValues('responsavel.endereco')) setValue('responsavel.endereco', endereco.logradouro)
    if (!getValues('responsavel.bairroResidencial')) setValue('responsavel.bairroResidencial', endereco.bairro)
  }

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="resp-nome">
          Nome <span className="req">*</span>
        </label>
        <input id="resp-nome" className={`input${errors.responsavel?.nome ? ' error' : ''}`} type="text" {...register('responsavel.nome')} />
        {errors.responsavel?.nome && <span className="err">{errors.responsavel.nome.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="resp-cpf">CPF</label>
        <input
          id="resp-cpf"
          className="input mono"
          type="text"
          placeholder="000.000.000-00"
          {...register('responsavel.cpf', { onChange: aplicarMascaraAoDigitar(formatarCpf) })}
        />
        {errors.responsavel?.cpf && <span className="err">{errors.responsavel.cpf.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="resp-telefone">Telefone</label>
        <input
          id="resp-telefone"
          className="input mono"
          type="text"
          placeholder="(11) 90000-0000"
          {...register('responsavel.telefone', { onChange: aplicarMascaraAoDigitar(formatarTelefone) })}
        />
        {errors.responsavel?.telefone && <span className="err">{errors.responsavel.telefone.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="resp-email">E-mail</label>
        <input id="resp-email" className="input" type="email" {...register('responsavel.email')} />
        {errors.responsavel?.email && <span className="err">{errors.responsavel.email.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="resp-cep">CEP</label>
        <input
          id="resp-cep"
          className="input mono"
          type="text"
          placeholder="00000-000"
          {...register('responsavel.cep', {
            onChange: (evento) => {
              aplicarMascaraAoDigitar(formatarCep)(evento)
              void aoMudarCep(evento.target.value)
            },
          })}
        />
        {errors.responsavel?.cep && <span className="err">{errors.responsavel.cep.message}</span>}
        {buscandoCep && <span className="subtitle">Buscando CEP…</span>}
      </div>
      <div className="field full">
        <label htmlFor="resp-endereco">Endereço</label>
        <input id="resp-endereco" className="input" type="text" {...register('responsavel.endereco')} />
        {errors.responsavel?.endereco && <span className="err">{errors.responsavel.endereco.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="resp-bairro-res">Bairro residencial</label>
        <input id="resp-bairro-res" className="input" type="text" {...register('responsavel.bairroResidencial')} />
        {errors.responsavel?.bairroResidencial && <span className="err">{errors.responsavel.bairroResidencial.message}</span>}
      </div>
      <div className="field">
        <label htmlFor="resp-bairro-oco">Bairro da ocorrência</label>
        <input
          id="resp-bairro-oco"
          className="input"
          type="text"
          placeholder="Local onde o animal estava"
          {...register('responsavel.bairroOcorrencia')}
        />
        {errors.responsavel?.bairroOcorrencia && <span className="err">{errors.responsavel.bairroOcorrencia.message}</span>}
      </div>
    </div>
  )
}
