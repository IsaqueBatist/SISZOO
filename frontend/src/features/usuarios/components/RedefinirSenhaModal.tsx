import { useState } from 'react'
import { ModalConfirmacao } from '@/components/ModalConfirmacao'
import { avisar } from '@/lib/avisos'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import { useRedefinirSenhaMutation } from '../hooks/useUsuarios'
import type { UsuarioListItem } from '../types/usuarios.types'
import { gerarSenhaTemporaria } from '../utils/senhaTemporaria'
import { SenhaTemporariaGerada } from './SenhaTemporariaGerada'

interface RedefinirSenhaModalProps {
  usuario: UsuarioListItem
  onFechar: () => void
}

// A senha atual nunca aparece. A nova é temporária: a pessoa troca ao entrar,
// pelo mesmo caminho do primeiro acesso.
export function RedefinirSenhaModal({ usuario, onFechar }: RedefinirSenhaModalProps) {
  const [senhaGerada, setSenhaGerada] = useState<string | null>(null)
  const mutation = useRedefinirSenhaMutation()
  const nome = `${usuario.nome} ${usuario.sobrenome}`

  async function confirmar() {
    const senhaTemporaria = gerarSenhaTemporaria()
    try {
      await mutation.mutateAsync({ id: usuario.id, senhaTemporaria })
      setSenhaGerada(senhaTemporaria)
    } catch (erro) {
      avisar(mensagemDeRegraDaApi(erro) ?? `Não foi possível redefinir a senha de ${nome}. Nada foi mudado.`, 'erro')
      onFechar()
    }
  }

  if (senhaGerada) {
    return <SenhaTemporariaGerada titulo="Senha redefinida" nome={nome} senha={senhaGerada} onFechar={onFechar} />
  }

  return (
    <ModalConfirmacao
      titulo="Redefinir senha"
      rotuloConfirmar="Redefinir senha"
      perigo
      processando={mutation.isPending}
      onConfirmar={() => void confirmar()}
      onFechar={onFechar}
    >
      <p>
        {nome} perderá a senha atual e será desconectado(a) do SISZOO. Você verá uma senha temporária para entregar, e a
        pessoa precisará trocá-la ao entrar.
      </p>
    </ModalConfirmacao>
  )
}
