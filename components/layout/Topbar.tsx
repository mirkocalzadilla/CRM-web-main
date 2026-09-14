'use client'

import { useRouter } from 'next/navigation'
import { LogOut, UserCog } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'

function initialsOf(name: string): string {
  const parts = name.split(' ').filter(Boolean).slice(0, 2)
  const result = parts.map((p) => p.charAt(0).toUpperCase()).join('')
  return result === '' ? '?' : result
}

export function Topbar() {
  const router = useRouter()
  const { session, signOut } = useAuth()

  const userName = session?.user.full_name?.trim() || session?.user.email || 'Usuario'
  const userEmail = session?.user.email ?? ''

  const handleSignOut = () => {
    signOut()
    router.replace('/login')
  }

  return (
    <header className="relative z-20 h-16 flex-shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="flex h-full items-center justify-end gap-4 pl-14 pr-4 md:px-6">
        <div className="flex flex-shrink-0 items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                aria-label="Menú de usuario"
                className="h-9 gap-2 rounded-full px-2 text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                <Avatar className="size-7">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
                    {initialsOf(userName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-normal sm:inline">
                  {userName.split(' ')[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-white/10 bg-zinc-950 text-zinc-200"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-white">
                    {userName}
                  </span>
                  <span className="truncate text-xs text-zinc-500">
                    {userEmail}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                onSelect={() => router.push('/settings')}
                className="text-zinc-300 focus:bg-white/5 focus:text-white"
              >
                <UserCog className="size-4" />
                Mi cuenta
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="text-zinc-300 focus:bg-white/5 focus:text-white"
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
