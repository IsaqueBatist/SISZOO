import { ToastProvider } from '@/components/toast/ToastProvider'
import { AuthProvider } from '@/features/auth/hooks/AuthContext'
import { AppRoutes } from './routes/AppRoutes'

// ToastProvider por fora do AuthProvider, de propósito: cobre /login e
// /trocar-senha (que ficam fora do Layout) e deixa o próprio AuthProvider
// poder avisar o usuário no futuro — um "sua sessão expirou" no tratamento do
// 401. O inverso tornaria isso impossível.
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
