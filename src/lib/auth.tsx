import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Rol = 'ciudadano' | 'operador' | 'admin'

export type Perfil = {
  id: string
  nombre: string
  telefono: string | null
  rol: Rol
}

type AuthContexto = {
  session: Session | null
  perfil: Perfil | null
  cargando: boolean
  esPersonal: boolean
  cerrarSesion: () => Promise<void>
}

const Contexto = createContext<AuthContexto | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)

  // 1) Escuchar si alguien inicia o cierra sesión
  useEffect(() => {
    if (!supabase) {
      setTimeout(() => setCargando(false), 0)
      return
    }
    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion)
      if (!nuevaSesion) {
        setPerfil(null)
        setCargando(false)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // 2) Cuando hay sesión, cargar el perfil (nombre y rol)
  const usuarioId = session?.user.id
  useEffect(() => {
    if (!supabase || !usuarioId) return
    let activo = true
    setTimeout(() => setCargando(true), 0)
    supabase
      .from('perfiles')
      .select('id, nombre, telefono, rol')
      .eq('id', usuarioId)
      .single()
      .then(({ data }) => {
        if (!activo) return
        setPerfil(data as Perfil | null)
        setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [usuarioId])

  async function cerrarSesion() {
    await supabase?.auth.signOut()
  }

  const esPersonal = perfil?.rol === 'operador' || perfil?.rol === 'admin'

  return (
    <Contexto.Provider value={{ session, perfil, cargando, esPersonal, cerrarSesion }}>
      {children}
    </Contexto.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return contexto
}