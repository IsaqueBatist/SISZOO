import type { ReactNode } from 'react'
import { Modal } from './Modal'

interface ModalConfirmacaoProps {
  titulo: string
  children: ReactNode
  rotuloConfirmar: string
  // Ação que tira acesso ou registro de circulação: o botão usa a cor de perigo.
  perigo?: boolean
  processando?: boolean
  onConfirmar: () => void
  onFechar: () => void
}

// Confirmação de ação de risco. Substitui window.confirm: o texto segue o tema,
// o botão diz o que vai acontecer e o foco fica no diálogo.
export function ModalConfirmacao({ titulo, children, rotuloConfirmar, perigo, processando, onConfirmar, onFechar }: ModalConfirmacaoProps) {
  return (
    <Modal titulo={titulo} onFechar={onFechar}>
      <div className="modal-body">{children}</div>
      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onFechar} disabled={processando}>
          Cancelar
        </button>
        <button type="button" className={`btn ${perigo ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirmar} disabled={processando}>
          {processando ? 'Aguarde…' : rotuloConfirmar}
        </button>
      </div>
    </Modal>
  )
}
