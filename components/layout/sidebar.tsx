'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Users,
    Clock,
    CalendarDays,
    FolderKanban,
    Target,
    DollarSign,
    UserPlus,
    Megaphone,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types/database'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItem {
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    roles: UserRole[]
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['super_admin', 'hr_admin', 'manager', 'employee'] },
    { label: 'Employees', href: '/employees', icon: Users, roles: ['super_admin', 'hr_admin', 'manager', 'employee'] },
    { label: 'Attendance', href: '/attendance', icon: Clock, roles: ['super_admin', 'hr_admin', 'manager', 'employee'] },
    { label: 'Leave', href: '/leave', icon: CalendarDays, roles: ['super_admin', 'hr_admin', 'manager', 'employee'] },
    { label: 'Projects', href: '/projects', icon: FolderKanban, roles: ['super_admin', 'hr_admin', 'manager', 'employee'] },
    { label: 'Performance', href: '/performance', icon: Target, roles: ['super_admin', 'hr_admin', 'manager'] },
    { label: 'Payroll', href: '/payroll', icon: DollarSign, roles: ['super_admin', 'hr_admin'] },
    { label: 'Hiring', href: '/hiring', icon: UserPlus, roles: ['super_admin', 'hr_admin', 'manager'] },
    { label: 'Announcements', href: '/announcements', icon: Megaphone, roles: ['super_admin', 'hr_admin', 'manager', 'employee'] },
    { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['super_admin', 'hr_admin', 'manager'] },
    { label: 'Settings', href: '/settings', icon: Settings, roles: ['super_admin', 'hr_admin'] },
]

interface SidebarProps {
    userRole: UserRole
}

export function Sidebar({ userRole }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false)
    const pathname = usePathname()

    const filteredItems = navItems.filter((item) => item.roles.includes(userRole))

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-slate-950 border-r border-slate-800/50 transition-all duration-300 flex flex-col',
                collapsed ? 'w-[72px]' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-slate-800/50">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">EP</span>
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-white font-semibold text-sm truncate">Employee Portal</span>
                            <span className="text-slate-500 text-xs truncate">Management System</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    const Icon = item.icon

                    const linkContent = (
                        <Link
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                                isActive
                                    ? 'bg-blue-500/10 text-blue-400 shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            )}
                        >
                            <Icon
                                className={cn(
                                    'w-5 h-5 flex-shrink-0 transition-colors',
                                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                                )}
                            />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                            {isActive && !collapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                            )}
                        </Link>
                    )

                    if (collapsed) {
                        return (
                            <Tooltip key={item.href} delayDuration={0}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        )
                    }

                    return <div key={item.href}>{linkContent}</div>
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="p-3 border-t border-slate-800/50">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {!collapsed && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    )
}
