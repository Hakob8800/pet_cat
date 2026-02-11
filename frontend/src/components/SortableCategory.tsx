import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ReactNode } from 'react'

interface SortableCategoryProps {
  id: number
  children: ReactNode
}

export default function SortableCategory({ id, children }: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="bg-white rounded-lg shadow">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 bg-gray-50 rounded-t-lg border-b flex items-center justify-center"
        >
          <span className="text-gray-400 text-sm">Drag to reorder</span>
        </div>
        {children}
      </div>
    </div>
  )
}
