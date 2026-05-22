import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { TrashPageClient } from './trash-page-client'

export default async function TrashPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'SUPER_ADMIN') redirect('/dashboard')

  return (
    <div>
      <PageHeader title="Trash" description="Deleted items" />
      <TrashPageClient />
    </div>
  )
}
