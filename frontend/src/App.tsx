import { Toasts } from '@/components/toast/Toasts'
import { AuthProvider } from '@/features/auth/hooks/AuthContext'
import { AppRoutes } from './routes/AppRoutes'

// Os avisos ficam na raiz, e não dentro do Layout: /login e /trocar-senha
// estão fora do Layout, e tanto o guarda de rota quanto o aviso de
// inatividade podem disparar ali.
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toasts />
    </AuthProvider>
  )
}

export default App
