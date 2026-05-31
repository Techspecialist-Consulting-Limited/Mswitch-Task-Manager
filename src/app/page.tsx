import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LandingContent from '@/components/landing/landing-content'

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')
  return <LandingContent />
}
