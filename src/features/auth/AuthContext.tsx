import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { authApi, type User } from './authApi'
import { AuthContext, type AuthState } from './authContextValue'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi.csrf().then(authApi.me).then(setUser).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    login: async (email, password) => {
      await authApi.csrf()
      const loggedInUser = await authApi.login(email, password)
      setUser(loggedInUser)
      return loggedInUser
    },
    logout: async () => {
      await authApi.logout().finally(() => setUser(null))
    },
  }), [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
