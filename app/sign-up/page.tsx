import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'

type SignUpPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const session = await getSession()
  if (session?.user) redirect('/')
  const { error } = await searchParams
  return <AuthForm mode="sign-up" error={error} />
}
