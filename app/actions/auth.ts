'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { apiFetch, ApiError, SESSION_COOKIE } from '@/lib/api'

interface TokenResponse {
  accessToken: string
  user: { id: string; name: string; email: string }
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
}

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  let result: TokenResponse
  try {
    result = await apiFetch<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Sign in failed'
    redirect(`/sign-in?error=${encodeURIComponent(message)}`)
  }

  await setSessionCookie(result.accessToken)
  redirect('/')
}

export async function signUp(formData: FormData) {
  const name = String(formData.get('name') || '')
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  let result: TokenResponse
  try {
    result = await apiFetch<TokenResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Sign up failed'
    redirect(`/sign-up?error=${encodeURIComponent(message)}`)
  }

  await setSessionCookie(result.accessToken)
  redirect('/')
}

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect('/sign-in')
}
