'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BadgeDollarSign,
  BookOpen,
  CalendarDays,
  Bot,
  Funnel,
  Inbox,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { usePermissions } from '@/hooks/use-permissions'
import { useUiStore } from '@/store/ui-store'
import { PendingPaymentsBadge } from '@/components/crm/payments/pending-payments-badge'
import { AttentionBadge } from '@/components/crm/attention/attention-badge'
import { Logo } from './Logo'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Capacidad requerida para ver el ítem; sin ella, visible para toda sesión CRM. */
  requires?: 'canManageConfig' | 'canManageCatalog' | 'canManageUsers'
  /** Contador de trabajo pendiente al lado del ítem (web#184). */
  badge?: 'payments' | 'attention'
}

const navItems: readonly NavItem[] = [
  { label: 'Embudo de ventas', href: '/', icon: Funnel },
  // Lo que la IA no pudo resolver sola, de los dos embudos juntos. Va segundo y sin
  // `requires`: es la primera pantalla que mira quien atiende, y atienden los 3 roles.
  { label: 'Requiere atención', href: '/atencion', icon: Inbox, badge: 'attention' },
  // Conciliar es operación diaria de los 3 roles (server#274): sin `requires`.
  { label: 'Pagos por confirmar', href: '/pagos', icon: BadgeDollarSign, badge: 'payments' },
  { label: 'Contactos', href: '/contacts', icon: Users },
  // Entradas: sin `requires` a propósito — quien atiende la puerta suele ser staff (#185).
  { label: 'Entradas', href: '/entradas', icon: ScanLine },
  // Agentes: solo platform_operator (superadmin). Catálogo/Usuarios: + client_admin (#126).
  { label: 'Agentes', href: '/agents', icon: Bot, requires: 'canManageConfig' },
  { label: 'Catálogo', href: '/catalogo', icon: BookOpen, requires: 'canManageCatalog' },
  // Agenda: las fechas concretas de los servicios presenciales. Mismo permiso que el
  // catálogo — el backend exige client_admin (event_router.EventManager).
  { label: 'Agenda', href: '/agenda', icon: CalendarDays, requires: 'canManageCatalog' },
  { label: 'Usuarios', href: '/users', icon: ShieldCheck, requires: 'canManageUsers' },
  { label: 'Ajustes', href: '/settings', icon: Settings },
]

function isActive(pathname: string, href: string): boolean {
  // Evitar que '/' marque todos los items
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface NavListProps {
  pathname: string
  collapsed?: boolean
  onSelect?: () => void
}

function NavList({ pathname, collapsed = false, onSelect }: NavListProps) {
  const permissions = usePermissions()
  const visibleItems = navItems.filter((item) => !item.requires || permissions[item.requires])

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {visibleItems.map((item) => {
        const Icon = item.icon
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onSelect}
            aria-current={active ? 'page' : undefined}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              'group relative flex items-center rounded-xl border py-2.5 text-sm font-normal transition-all',
              collapsed ? 'justify-center px-0' : 'gap-3 px-3',
              active
                ? 'border-violet-500/30 bg-violet-500/15 text-white shadow-[0_0_25px_-12px_rgba(167,139,250,0.7)]'
                : 'border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-white',
            )}
          >
            <Icon
              className={cn(
                'size-4 flex-shrink-0 transition-colors',
                active
                  ? 'text-violet-300'
                  : 'text-zinc-500 group-hover:text-zinc-300',
              )}
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {item.badge === 'payments' && <PendingPaymentsBadge collapsed={collapsed} />}
            {item.badge === 'attention' && <AttentionBadge collapsed={collapsed} />}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)
  const hasHydrated = useUiStore((s) => s.hasHydrated)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  // Render expanded until the persisted value hydrates (avoids SSR mismatch).
  const collapsed = hasHydrated && sidebarCollapsed

  return (
    <>
      {/* Trigger mobile + drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir navegación"
            className="fixed top-3 left-3 z-40 text-zinc-400 hover:bg-white/5 hover:text-white md:hidden"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 border-r border-white/5 bg-zinc-950 p-0 text-white"
        >
          <SheetTitle className="sr-only">Navegación CRM</SheetTitle>
          <div className="flex h-16 items-center border-b border-white/5 px-5">
            <Logo />
          </div>
          <NavList pathname={pathname} onSelect={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar (collapsible) */}
      <aside
        className={cn(
          'hidden flex-shrink-0 flex-col border-r border-white/5 bg-black/40 backdrop-blur-xl transition-[width] duration-200 ease-out md:flex',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-white/5',
            collapsed ? 'justify-center px-0' : 'px-5',
          )}
        >
          <Logo compact={collapsed} />
        </div>
        <NavList pathname={pathname} collapsed={collapsed} />
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className={cn(
            'mt-auto flex h-12 items-center border-t border-white/5 text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-white',
            collapsed ? 'justify-center px-0' : 'gap-3 px-5',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4 flex-shrink-0" />
          ) : (
            <PanelLeftClose className="size-4 flex-shrink-0" />
          )}
          {!collapsed && <span className="text-sm">Colapsar</span>}
        </button>
      </aside>
    </>
  )
}
