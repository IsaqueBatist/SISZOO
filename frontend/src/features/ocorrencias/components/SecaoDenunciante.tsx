import { useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { Switch } from '@/components/Switch'
import { aplicarMascaraAoDigitar, formatarCep, formatarCpf, formatarTelefone } from '@/lib/mascaras'
import { buscarEnderecoPorCep } from '@/lib/viaCep'
import type { OcorrenciaFormValues } from '../schemas/ocorrenciaFormSchema'
import { DENUNCIANTE_VAZIO } from '../utils/ocorrenciaFormMapeamento'

interface SecaoDenuncianteProps {
  // Sigilosa sem permissão: o denunciante não aparece nem é editável (D10).
  mascarado: boolean
  podeAlterarSigilo: boolean
  // Só no cadastro: a edição não marca anonimato (D32, anônima só vira identificada).
  mostrarAnonimo: boolean
  podeIdentificar: boolean
  // Marcar o sigilo tira os anexos já guardados do disco (T42).
  onSigilosaMarcada: () => void
}

// Card 3 do formulário de ocorrência: sigilo, anonimato e dados do denunciante.
export function SecaoDenunciante({
  mascarado,
  podeAlterarSigilo,
  mostrarAnonimo,
  podeIdentificar,
  onSigilosaMarcada,
}: SecaoDenuncianteProps) {
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<OcorrenciaFormValues>()
  const [sigilosa, anonima] = useWatch({ control, name: ['sigilosa', 'anonima'] })
  const [buscandoCep, setBuscandoCep] = useState(false)

  // Não dispara em ocorrência sigilosa: dado do denunciante não pode ir a um
  // serviço de terceiro (ViaCEP) nesse caso. Só preenche endereço/bairro se
  // ainda estiverem vazios — nunca sobrescreve o que o usuário já digitou.
  async function aoMudarCep(valorDigitado: string) {
    if (getValues('sigilosa')) return
    const digitos = valorDigitado.replace(/\D/g, '')
    if (digitos.length !== 8) return

    setBuscandoCep(true)
    const endereco = await buscarEnderecoPorCep(valorDigitado)
    setBuscandoCep(false)
    if (!endereco) return

    if (!getValues('denunciante.endereco')) setValue('denunciante.endereco', endereco.logradouro)
    if (!getValues('denunciante.bairroResidencial')) setValue('denunciante.bairroResidencial', endereco.bairro)
  }

  // Em denúncia anônima não há dado do denunciante a guardar nem a enviar.
  function aoMudarAnonima(marcada: boolean, onChange: (valor: boolean) => void) {
    onChange(marcada)
    if (marcada) {
      setValue('sigilosa', false)
      setValue('denunciante', { ...DENUNCIANTE_VAZIO })
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>3. Dados do Denunciante</h3>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <div className="switch-row">
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Ocorrência sigilosa</span>
            <Controller
              name="sigilosa"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  disabled={anonima || !podeAlterarSigilo}
                  onChange={(marcada) => {
                    field.onChange(marcada)
                    if (marcada) onSigilosaMarcada()
                  }}
                  aria-label="Ocorrência sigilosa"
                />
              )}
            />
          </div>
          {mostrarAnonimo && (
            <div className="switch-row">
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Denunciante anônimo</span>
              <Controller
                name="anonima"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    disabled={sigilosa}
                    onChange={(marcada) => aoMudarAnonima(marcada, field.onChange)}
                    aria-label="Denunciante anônimo"
                  />
                )}
              />
            </div>
          )}
        </div>
      </div>
      <div className="card-body">
        {errors.anonima && (
          <span className="err" style={{ display: 'block', marginBottom: 12 }}>
            {errors.anonima.message}
          </span>
        )}
        {sigilosa && (
          <div className="alert warning" role="alert" style={{ marginBottom: 12 }}>
            <span className="bullet" />
            <div className="alert-content">
              Os dados do denunciante só serão exibidos a Administradores e Agentes Sanitários.
            </div>
          </div>
        )}
        {mascarado ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Sigiloso: os dados do denunciante só podem ser vistos e alterados por Administradores e Agentes
            Sanitários.
          </p>
        ) : anonima ? (
          <div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Denúncia anônima: nenhum dado do denunciante é registrado.
            </p>
            {podeIdentificar && (
              // D32: só o caminho anônima -> identificada existe na interface.
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ marginTop: 8 }}
                onClick={() => setValue('anonima', false, { shouldDirty: true })}
              >
                Identificar denunciante
              </button>
            )}
          </div>
        ) : (
          <div className="form-grid">
            <div className="field">
              <label htmlFor="den-nome">
                Nome completo {!sigilosa && <span className="req">*</span>}
              </label>
              <input
                id="den-nome"
                className={`input${errors.denunciante?.nome ? ' error' : ''}`}
                type="text"
                {...register('denunciante.nome')}
              />
              {errors.denunciante?.nome && <span className="err">{errors.denunciante.nome.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="den-cpf">CPF</label>
              <input
                id="den-cpf"
                className="input mono"
                type="text"
                placeholder="000.000.000-00"
                {...register('denunciante.cpf', { onChange: aplicarMascaraAoDigitar(formatarCpf) })}
              />
              {errors.denunciante?.cpf && <span className="err">{errors.denunciante.cpf.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="den-telefone">Telefone</label>
              <input
                id="den-telefone"
                className="input mono"
                type="text"
                placeholder="(11) 90000-0000"
                {...register('denunciante.telefone', { onChange: aplicarMascaraAoDigitar(formatarTelefone) })}
              />
              {errors.denunciante?.telefone && <span className="err">{errors.denunciante.telefone.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="den-email">E-mail</label>
              <input id="den-email" className="input" type="email" placeholder="exemplo@email.com" {...register('denunciante.email')} />
              {errors.denunciante?.email && <span className="err">{errors.denunciante.email.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="den-cep">CEP</label>
              <input
                id="den-cep"
                className="input mono"
                type="text"
                placeholder="00000-000"
                {...register('denunciante.cep', {
                  onChange: (evento) => {
                    aplicarMascaraAoDigitar(formatarCep)(evento)
                    void aoMudarCep(evento.target.value)
                  },
                })}
              />
              {errors.denunciante?.cep && <span className="err">{errors.denunciante.cep.message}</span>}
              {buscandoCep && <span className="subtitle">Buscando CEP…</span>}
            </div>
            <div className="field">
              <label htmlFor="den-endereco">Endereço residencial</label>
              <input id="den-endereco" className="input" type="text" placeholder="Logradouro, número" {...register('denunciante.endereco')} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
