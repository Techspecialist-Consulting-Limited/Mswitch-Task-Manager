import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar role={session.user.role} />
      <div className="flex flex-1 flex-col md:pl-60">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
