import { auth } from './auth'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return session.user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')
  return user
}
