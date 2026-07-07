'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface DeleteButtonProps {
  action: () => Promise<void>
  confirmMessage: string
  label?: string
  redirectTo?: string
}

export function DeleteButton({ action, confirmMessage, label = 'Delete', redirectTo }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    if (!window.confirm(confirmMessage)) return
    startTransition(async () => {
      try {
        await action()
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.refresh()
        }
      } catch (error) {
        console.error('Delete failed:', error)
        alert('Failed to delete. Please try again.')
      }
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="text-destructive hover:text-destructive"
    >
      {isPending ? 'Deleting...' : label}
    </Button>
  )
}
