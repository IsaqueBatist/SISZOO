import { Toasts } from '@/components/toast/Toasts'
import { AuthProvider } from '@/features/auth/hooks/AuthContext'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toasts />
    </AuthProvider>
  )
}

export default App
