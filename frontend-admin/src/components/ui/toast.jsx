import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const variantStyles = {
  default: 'bg-white border-gray-200 text-gray-900',
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
}

export function Toaster({ toasts, dismiss }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 shadow-lg min-w-[300px] animate-in slide-in-from-bottom-5',
            variantStyles[t.variant] || variantStyles.default
          )}
        >
          <div className="flex-1">
            {t.title && <p className="font-medium text-sm">{t.title}</p>}
            {t.description && <p className="text-sm mt-1 opacity-80">{t.description}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
