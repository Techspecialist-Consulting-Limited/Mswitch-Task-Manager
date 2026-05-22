'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface GoalsByMonthStat {
  month: string
  count: number
}

interface TasksByStatusStat {
  status: string
  count: number
}

interface WeeklyProgressStat {
  week: number
  avgProgress: number
}

interface ChartsSectionProps {
  goalsByMonth: GoalsByMonthStat[]
  tasksByStatus: TasksByStatusStat[]
  weeklyProgress: WeeklyProgressStat[]
}

const STATUS_COLORS: Record<string, string> = {
  TODO: '#a1a1aa',
  IN_PROGRESS: '#f59e0b',
  DONE: '#10b981',
}

const MONTH_COLOR = '#18181b'
const PROGRESS_COLOR = '#3b82f6'

export function ChartsSection({ goalsByMonth, tasksByStatus, weeklyProgress }: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Goals by Month</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={goalsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#71717a" />
              <YAxis tick={{ fontSize: 12 }} stroke="#71717a" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={MONTH_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Task Status Distribution</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={tasksByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} (${value})`}>
                {tasksByStatus.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#a1a1aa'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Weekly Progress (Active Goals)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#71717a" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
              <YAxis tick={{ fontSize: 12 }} stroke="#71717a" domain={[0, 100]} label={{ value: 'Avg Progress %', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgProgress" stroke={PROGRESS_COLOR} strokeWidth={2} dot={{ fill: PROGRESS_COLOR }} name="Avg Progress %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
