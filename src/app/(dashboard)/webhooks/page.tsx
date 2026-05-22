import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Webhook, Pencil, Trash2, Play, Plus } from 'lucide-react'
import { WebhookActions } from './webhook-actions'

export default async function WebhooksPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'SUPER_ADMIN') redirect('/dashboard')

  const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div>
      <PageHeader title="Webhooks" description="Manage outgoing webhook endpoints">
        <Link href="/webhooks/new">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            New Webhook
          </Button>
        </Link>
      </PageHeader>
      <div className="space-y-3">
        {webhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
              <Webhook className="h-7 w-7 text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900">No webhooks</h3>
            <p className="mt-1 text-sm text-zinc-500">Create your first webhook to get started.</p>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                      <Webhook className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{webhook.name}</CardTitle>
                      <p className="mt-0.5 text-sm text-zinc-500">{webhook.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={webhook.active ? 'success' : 'default'}>
                      {webhook.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <WebhookActions webhook={webhook} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {webhook.events.split(',').map((event) => (
                    <Badge key={event} variant="info">{event.trim()}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
