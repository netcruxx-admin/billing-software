import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AuthForm } from '@/components/auth-form'

type SignInPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getSession()
  if (session?.user) redirect('/')
  const { error } = await searchParams
  return <AuthForm mode="sign-in" error={error} />
}
