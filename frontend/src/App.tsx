import { AuthProvider } from '@/features/auth/hooks/AuthContext'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
