import { cookies } from 'next/headers'
import { apiFetch, SESSION_COOKIE } from '@/lib/api'

export interface SessionUser {
  id: string
  name: string
  email: string
}

export async function getSession(): Promise<{ user: SessionUser } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const user = await apiFetch<SessionUser>('/api/auth/me')
    return { user }
  } catch {
    return null
  }
}
