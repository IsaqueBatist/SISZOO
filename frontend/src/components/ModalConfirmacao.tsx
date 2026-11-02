import type { ReactNode } from 'react'
import { Modal } from './Modal'

interface ModalConfirmacaoProps {
  titulo: string
  children: ReactNode
  rotuloConfirmar: string
  perigo?: boolean
  processando?: boolean
  onConfirmar: () => void
  onFechar: () => void
}

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
