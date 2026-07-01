import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import { DeleteTemplateButton } from './delete-button'

interface Template {
  id: string
  title: string
  description: string | null
  weekTitles: string | null
  unitId: string | null
  createdAt: Date
  updatedAt: Date
}

export default async function TemplatesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  const templates: Template[] = await prisma.goalTemplate.findMany({
    where: isSuperAdmin ? {} : { OR: [{ unitId: session.user.unitId }, { unitId: null }] },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <PageHeader title="Goal Templates" description="Pre-defined goal templates for quick creation" />

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                <FileText className="h-7 w-7 text-zinc-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900">No templates yet</h3>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">Save a goal as a template from the new goal page.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t: Template) => (
            <Card key={t.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold text-zinc-900">{t.title}</h3>
                  {isSuperAdmin && <DeleteTemplateButton templateId={t.id} />}
                </div>
                {t.description && <p className="mb-3 text-sm text-zinc-500 line-clamp-2">{t.description}</p>}
                {t.weekTitles && (
                  <div className="flex flex-wrap gap-1">
                    {JSON.parse(t.weekTitles).map((wt: string, i: number) => (
                      <Badge key={i} variant="info">W{i + 1}: {wt}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
