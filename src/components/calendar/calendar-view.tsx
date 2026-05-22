'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parse } from 'date-fns'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Target, CheckSquare } from 'lucide-react'

interface GoalItem {
  id: string
  title: string
  month: string
  status: string
}

interface TaskItem {
  id: string
  title: string
  deadline: string | null
  status: string
  assignedTo: { name: string }
}

interface CalendarViewProps {
  goals: GoalItem[]
  tasks: TaskItem[]
}

export function CalendarView({ goals, tasks }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const monthLabel = format(currentMonth, 'MMMM yyyy')

  function goToPrev() {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  function goToNext() {
    setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const goalsByDay = useMemo(() => {
    const map = new Map<string, GoalItem[]>()
    for (const g of goals) {
      const parsed = parse(g.month + '-01', 'yyyy-MM-dd', new Date())
      const key = format(parsed, 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(g)
    }
    return map
  }, [goals])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskItem[]>()
    for (const t of tasks) {
      if (!t.deadline) continue
      const key = format(new Date(t.deadline), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [tasks])

  const selectedDayGoals = selectedDate ? goalsByDay.get(format(selectedDate, 'yyyy-MM-dd')) || [] : []
  const selectedDayTasks = selectedDate ? tasksByDay.get(format(selectedDate, 'yyyy-MM-dd')) || [] : []

  const dayOfWeekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const firstDayOffset = monthStart.getDay()

  return (
    <div>
      <PageHeader title="Calendar" description="Monthly view of goals and tasks" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <Button variant="secondary" size="sm" onClick={goToPrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold text-zinc-900">{monthLabel}</h3>
                <Button variant="secondary" size="sm" onClick={goToNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {dayOfWeekHeaders.map(d => (
                  <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500">{d}</div>
                ))}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const dayGoals = goalsByDay.get(dateKey) || []
                  const dayTasks = tasksByDay.get(dateKey) || []
                  const selected = selectedDate && isSameDay(day, selectedDate)
                  const today = isToday(day)

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'flex min-h-[80px] flex-col rounded-lg border p-1.5 text-left transition-colors hover:bg-zinc-50',
                        today && 'border-zinc-900',
                        selected && 'ring-2 ring-zinc-900',
                        !selected && !today && 'border-zinc-200'
                      )}
                    >
                      <span className={cn('text-xs font-medium', today ? 'text-zinc-900' : 'text-zinc-400')}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-auto space-y-0.5">
                        {dayGoals.slice(0, 2).map(g => (
                          <Link
                            key={g.id}
                            href={`/goals/${g.id}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 rounded-sm bg-blue-50 px-1 py-0.5 text-[10px] text-blue-700 hover:bg-blue-100"
                          >
                            <Target className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{g.title}</span>
                          </Link>
                        ))}
                        {dayTasks.slice(0, 2).map(t => (
                          <Link
                            key={t.id}
                            href={`/tasks/${t.id}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 rounded-sm bg-amber-50 px-1 py-0.5 text-[10px] text-amber-700 hover:bg-amber-100"
                          >
                            <CheckSquare className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{t.title}</span>
                          </Link>
                        ))}
                        {(dayGoals.length + dayTasks.length) > 2 && (
                          <span className="text-[10px] text-zinc-400">+{dayGoals.length + dayTasks.length - 2} more</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a day'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!selectedDate && (
                <p className="text-sm text-zinc-400">Click on a day to see details.</p>
              )}
              {selectedDate && (
                <>
                  {selectedDayGoals.length === 0 && selectedDayTasks.length === 0 && (
                    <p className="text-sm text-zinc-400">No goals or tasks for this day.</p>
                  )}
                  {selectedDayGoals.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-zinc-500">Goals</p>
                      <div className="space-y-2">
                        {selectedDayGoals.map(g => (
                          <Link key={g.id} href={`/goals/${g.id}`} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50 transition-colors">
                            <Target className="h-4 w-4 text-blue-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-900 truncate">{g.title}</p>
                              <Badge variant={g.status === 'ACTIVE' ? 'info' : g.status === 'COMPLETED' ? 'success' : 'default'}>{g.status}</Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedDayTasks.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-zinc-500">Tasks</p>
                      <div className="space-y-2">
                        {selectedDayTasks.map(t => (
                          <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50 transition-colors">
                            <CheckSquare className="h-4 w-4 text-amber-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-900 truncate">{t.title}</p>
                              <p className="text-xs text-zinc-400">{t.assignedTo.name}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
