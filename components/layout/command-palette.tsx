'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
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
    User,
} from 'lucide-react'

interface CommandPaletteProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const pages = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Employees', href: '/employees', icon: Users },
    { label: 'Add Employee', href: '/employees/new', icon: UserPlus },
    { label: 'Attendance', href: '/attendance', icon: Clock },
    { label: 'Leave Management', href: '/leave', icon: CalendarDays },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Performance', href: '/performance', icon: Target },
    { label: 'Payroll', href: '/payroll', icon: DollarSign },
    { label: 'Hiring', href: '/hiring', icon: UserPlus },
    { label: 'Announcements', href: '/announcements', icon: Megaphone },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'My Profile', href: '/profile', icon: User },
]

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const router = useRouter()

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                onOpenChange(!open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [open, onOpenChange])

    const handleSelect = (href: string) => {
        onOpenChange(false)
        router.push(href)
    }

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Search pages, employees, actions..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Pages">
                    {pages.map((page) => {
                        const Icon = page.icon
                        return (
                            <CommandItem
                                key={page.href}
                                value={page.label}
                                onSelect={() => handleSelect(page.href)}
                                className="cursor-pointer"
                            >
                                <Icon className="w-4 h-4 mr-2 text-slate-500" />
                                {page.label}
                            </CommandItem>
                        )
                    })}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
