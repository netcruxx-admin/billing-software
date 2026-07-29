'use client'

import Link from 'next/link'
import { Receipt } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DashboardHeaderProps {
  user: { name?: string; email: string }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const handleLogout = () => {
    signOut()
  }

  return (
    <header className="border-b border-border bg-card shrink-0">
      <div className="px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Receipt className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">BillingPro</h1>
            <p className="text-xs text-muted-foreground">Business Billing Software</p>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{user.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">{user.name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
