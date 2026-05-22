import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Users, Pencil, Plus } from 'lucide-react'
import { canManageUnits } from '@/lib/permissions'

export default async function UnitsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isSuperAdmin = canManageUnits(session.user.role)

  const units = await prisma.unit.findMany({
    include: {
      lead: { select: { name: true, email: true } },
      _count: { select: { members: true, monthlyGoals: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <PageHeader title="Units" description="All organizational units">
        {isSuperAdmin && (
          <Link href="/units/new">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4" />
              New Unit
            </Button>
          </Link>
        )}
      </PageHeader>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => (
          <Card key={unit.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                    <Building2 className="h-5 w-5 text-zinc-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{unit.name}</CardTitle>
                    {unit.lead && <p className="text-xs text-zinc-500">Lead: {unit.lead.name}</p>}
                  </div>
                </div>
                {isSuperAdmin && (
                  <Link href={`/units/${unit.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {unit._count.members} members</span>
                <span>{unit._count.monthlyGoals} goals</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
