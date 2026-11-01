import { useState } from 'react'
import { Modal } from '@/components/Modal'

interface SenhaTemporariaGeradaProps {
  titulo: string
  nome: string
  senha: string
  onFechar: () => void
}

// Última tela depois de criar um usuário ou redefinir a senha: a senha aparece
// aqui uma vez e não volta em lugar nenhum.
export function SenhaTemporariaGerada({ titulo, nome, senha, onFechar }: SenhaTemporariaGeradaProps) {
  const [copiada, setCopiada] = useState(false)

  async function copiarSenha() {
    try {
      await navigator.clipboard.writeText(senha)
      setCopiada(true)
    } catch {
      // Sem acesso à área de transferência: a senha segue na tela para copiar à mão.
      setCopiada(false)
    }
  }

  return (
    <Modal titulo={titulo} onFechar={onFechar}>
      <div className="modal-body col gap-3">
        <p>
          Entregue esta senha temporária a <strong>{nome}</strong>. Ela será trocada no próximo acesso e não aparecerá
          de novo.
        </p>
        <div className="senha-temporaria">
          <code className="mono">{senha}</code>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void copiarSenha()}>
            {copiada ? 'Copiada' : 'Copiar'}
          </button>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-primary" onClick={onFechar}>
          Concluir
        </button>
      </div>
    </Modal>
  )
}
