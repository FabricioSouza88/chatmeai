import { Wrench } from 'lucide-react'
import type { Message } from '@/types/chat'

interface ToolCallCardProps {
  message: Message
}

export function ToolCallCard({ message }: ToolCallCardProps) {
  return (
    <div className="flex items-center gap-1.5 my-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
      <Wrench size={12} />
      <span className="font-mono">{message.toolName}</span>
    </div>
  )
}
