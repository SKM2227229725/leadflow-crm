import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/services'
import { tokenStore } from '../api/client'

const AuthContext = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!tokenStore.get())

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // Restore the session after a browser refresh.
  useEffect(() => {
    if (!tokenStore.get()) return
    authApi.me().then(setUser).catch(() => tokenStore.clear()).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    window.addEventListener('leadflow:logout', logout)
    return () => window.removeEventListener('leadflow:logout', logout)
  }, [logout])

  const value = useMemo(() => {
    const handleAuth = ({ user: u, tokens }) => {
      tokenStore.set(tokens)
      setUser(u)
    }
    return {
      user,
      loading,
      logout,
      login: async (body) => handleAuth(await authApi.login(body)),
      register: async (body) => handleAuth(await authApi.register(body)),
    }
  }, [user, loading, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
