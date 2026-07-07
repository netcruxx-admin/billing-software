import { redirect } from 'next/navigation'
import { getDemoSession } from '@/lib/demo-auth'
import { AuthForm } from '@/components/auth-form'

export default async function SignUpPage() {
  const session = await getDemoSession()
  if (session?.user) redirect('/')
  return <AuthForm mode="sign-up" />
}
