'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable, useDraggable, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Calendar, GripVertical } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-zinc-100 border-zinc-300' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-50 border-blue-300' },
  { id: 'DONE', title: 'Done', color: 'bg-emerald-50 border-emerald-300' },
] as const

interface Task {
  id: string
  title: string
  status: string
  deadline: Date | string | null
  assignedTo: { id: string; name: string }
}

function KanbanTaskCard({ task, isDragOverlay }: { task: Task; isDragOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, data: { columnId: task.status } })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined

  const overdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${isDragging ? 'opacity-50' : ''} ${isDragOverlay ? 'shadow-xl opacity-80 rotate-3' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 shrink-0 cursor-grab text-zinc-300 hover:text-zinc-500">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">{task.title}</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Avatar name={task.assignedTo.name} size="sm" />
              <span className="text-xs text-zinc-500 truncate max-w-20">{task.assignedTo.name}</span>
            </div>
            {task.deadline && (
              <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-500' : 'text-zinc-400'}`}>
                <Calendar className="h-3 w-3" /> {formatDate(task.deadline)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Column({ id, title, color, tasks }: { id: string; title: string; color: string; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div ref={setNodeRef} className={`flex flex-col rounded-xl border-2 ${color} ${isOver ? 'ring-2 ring-zinc-900/20' : ''}`}>
      <div className={`px-4 py-3 border-b border-inherit`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          <Badge variant="default">{tasks.length}</Badge>
        </div>
      </div>
      <div className="flex-1 space-y-2 p-3 min-h-[200px]">
        {tasks.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-zinc-400">Drop tasks here</p>
          </div>
        ) : (
          tasks.map(task => (
            <KanbanTaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const router = useRouter()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function groupTasks() {
    return COLUMNS.map(col => ({
      ...col,
      tasks: tasks.filter(t => t.status === col.id),
    }))
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const targetColumnId = over.id as string
    const movedTask = tasks.find(t => t.id === taskId)
    if (!movedTask || targetColumnId === movedTask.status) return

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetColumnId }),
    })
    if (res.ok) {
      toast.success('Task moved')
      router.refresh()
    } else {
      toast.error('Failed to move task')
    }
  }

  const columns = groupTasks()

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map(col => (
          <Column key={col.id} id={col.id} title={col.title} color={col.color} tasks={col.tasks} />
        ))}
      </div>
      <DragOverlay>
        {activeTask && <KanbanTaskCard task={activeTask} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  )
}
