'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE } from '@/lib/demo-auth'

// Demo mode: any credentials are accepted, there is a single shared demo user.
export async function signIn(_formData: FormData) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  redirect('/')
}

export async function signUp(formData: FormData) {
  await signIn(formData)
}

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect('/sign-in')
}
