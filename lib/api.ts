import { cookies } from 'next/headers'

const API_URL = process.env.API_URL || 'http://127.0.0.1:8000'
export const SESSION_COOKIE = 'session_token'

export class ApiError extends Error {}

async function getToken() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value
}

// Server-side fetch wrapper for the Python backend. Attaches the JWT stored
// in the session cookie (if present) as a Bearer token, and normalizes
// backend error responses into thrown Errors so callers can keep using
// try/catch like they did with the old in-memory demoDb.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (typeof data?.detail === 'string') message = data.detail
    } catch {
      // response body wasn't JSON — keep the generic message
    }
    throw new ApiError(message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
