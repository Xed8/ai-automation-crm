'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileInput,
  KanbanSquare,
  LayoutDashboard,
  Settings2,
  Users,
  UsersRound,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkspaceNavProps {
  workspaceSlug: string
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

const items = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    getHref: (workspaceSlug: string) => `/w/${workspaceSlug}`,
  },
  {
    label: 'Leads',
    icon: UsersRound,
    getHref: (workspaceSlug: string) => `/w/${workspaceSlug}/leads`,
  },
  {
    label: 'Boards',
    icon: KanbanSquare,
    getHref: (workspaceSlug: string) => `/w/${workspaceSlug}/boards`,
  },
  {
    label: 'Forms',
    icon: FileInput,
    getHref: (workspaceSlug: string) => `/w/${workspaceSlug}/forms`,
  },
  {
    label: 'Automations',
    icon: Zap,
    getHref: (workspaceSlug: string) => `/w/${workspaceSlug}/automations`,
  },
  {
    label: 'Team',
    icon: Users,
    getHref: (workspaceSlug: string) => `/w/${workspaceSlug}/team`,
  },
  {
    label: 'Settings',
    icon: Settings2,
    getHref: (workspaceSlug: string) => `/w/${workspaceSlug}/settings`,
  },
]

export function WorkspaceNav({
  workspaceSlug,
  orientation = 'vertical',
  className,
}: WorkspaceNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        orientation === 'horizontal'
          ? 'flex gap-1 overflow-x-auto'
          : 'flex flex-col gap-0.5',
        className
      )}
    >
      {items.map((item) => {
        const href = item.getHref(workspaceSlug)
        const isActive =
          pathname === href || (href !== `/w/${workspaceSlug}` && pathname.startsWith(`${href}/`))
        const Icon = item.icon

        return (
          <Link
            key={item.label}
            href={href}
            className={cn(
              'relative inline-flex min-w-fit items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
              orientation === 'vertical' ? '' : 'whitespace-nowrap'
            )}
            style={
              isActive
                ? {
                    background: 'rgba(255,77,28,0.10)',
                    color: 'var(--lp-accent)',
                    fontFamily: 'var(--font-dm)',
                  }
                : {
                    color: 'rgba(245,243,238,0.45)',
                    fontFamily: 'var(--font-dm)',
                  }
            }
          >
            {/* Left accent rail — vertical only */}
            {isActive && orientation === 'vertical' && (
              <span
                className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                style={{ background: 'var(--lp-accent)' }}
              />
            )}
            <Icon
              className="h-4 w-4 shrink-0"
              style={{ color: isActive ? 'var(--lp-accent)' : 'rgba(245,243,238,0.35)' }}
            />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
