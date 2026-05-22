import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { ROLE_LABELS } from '@/lib/constants'
import { SystemSettings } from './system-settings'
import { ApiKeys } from './api-keys'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account" />
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={session.user.name || ''} size="lg" />
            <div>
              <p className="font-medium text-zinc-900">{session.user.name || 'User'}</p>
              <p className="text-sm text-zinc-500">{session.user.email || ''}</p>
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
            <p><span className="font-medium">Role:</span> {session.user.role ? (ROLE_LABELS[session.user.role] || session.user.role) : ''}</p>
            {session.user.unitName && <p className="mt-1"><span className="font-medium">Unit:</span> {session.user.unitName}</p>}
          </div>
        </CardContent>
      </Card>
      {session.user.role === 'SUPER_ADMIN' && <SystemSettings />}
      <ApiKeys />
    </div>
  )
}
