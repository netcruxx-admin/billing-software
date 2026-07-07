import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'demo_session'

export const demoUserId = 'demo-user-001'
export const demoUser = {
  id: demoUserId,
  email: 'demo@billingapp.com',
  name: 'Demo User',
}

export async function getDemoSession() {
  const cookieStore = await cookies()
  if (cookieStore.get(SESSION_COOKIE)?.value !== '1') return null

  return {
    user: demoUser,
    session: {
      id: 'demo-session',
      userId: demoUserId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  }
}
