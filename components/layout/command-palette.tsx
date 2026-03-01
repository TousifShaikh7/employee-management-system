'use client'

import { useEffect, useState, useCallback } from 'react'
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
    Search,
    Briefcase,
} from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
]

interface SearchResult {
    id: string
    type: 'employee' | 'project'
    label: string
    subtitle: string
    avatar?: string | null
    href: string
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [searching, setSearching] = useState(false)
    const supabase = createBrowserSupabaseClient()

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

    const search = useCallback(async (q: string) => {
        if (q.length < 2) { setResults([]); return }
        setSearching(true)
        try {
            const searchResults: SearchResult[] = []

            // Search employees
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: employees } = await (supabase.from('profiles') as any)
                .select('id, full_name, job_title, profile_photo_url')
                .ilike('full_name', `%${q}%`)
                .limit(5)

            if (employees) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                employees.forEach((emp: any) => {
                    searchResults.push({
                        id: emp.id,
                        type: 'employee',
                        label: emp.full_name || 'Unknown',
                        subtitle: emp.job_title || 'Employee',
                        avatar: emp.profile_photo_url,
                        href: `/employees/${emp.id}`,
                    })
                })
            }

            // Search projects
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: projects } = await (supabase.from('projects') as any)
                .select('id, name, status')
                .ilike('name', `%${q}%`)
                .limit(5)

            if (projects) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                projects.forEach((proj: any) => {
                    searchResults.push({
                        id: proj.id,
                        type: 'project',
                        label: proj.name,
                        subtitle: (proj.status || 'planning').replace('_', ' '),
                        href: `/projects/${proj.id}`,
                    })
                })
            }

            setResults(searchResults)
        } catch (e) {
            console.error('Search error:', e)
        } finally {
            setSearching(false)
        }
    }, [supabase])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) search(query)
            else setResults([])
        }, 300)
        return () => clearTimeout(timer)
    }, [query, search])

    // Reset query when dialog closes
    useEffect(() => {
        if (!open) { setQuery(''); setResults([]) }
    }, [open])

    const handleSelect = (href: string) => {
        onOpenChange(false)
        router.push(href)
    }

    const employees = results.filter(r => r.type === 'employee')
    const projects = results.filter(r => r.type === 'project')

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput
                placeholder="Search employees, projects, pages..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                <CommandEmpty>
                    {searching ? 'Searching...' : query.length < 2 ? 'Type at least 2 characters to search...' : 'No results found.'}
                </CommandEmpty>

                {/* Live search results */}
                {employees.length > 0 && (
                    <CommandGroup heading="Employees">
                        {employees.map((emp) => (
                            <CommandItem
                                key={emp.id}
                                value={`employee-${emp.label}`}
                                onSelect={() => handleSelect(emp.href)}
                                className="cursor-pointer"
                            >
                                <Avatar className="w-6 h-6 mr-2">
                                    <AvatarImage src={emp.avatar || undefined} />
                                    <AvatarFallback className="bg-black text-white text-[9px]">
                                        {emp.label.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm">{emp.label}</span>
                                    <span className="text-xs text-neutral-400">{emp.subtitle}</span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {projects.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Projects">
                            {projects.map((proj) => (
                                <CommandItem
                                    key={proj.id}
                                    value={`project-${proj.label}`}
                                    onSelect={() => handleSelect(proj.href)}
                                    className="cursor-pointer"
                                >
                                    <Briefcase className="w-4 h-4 mr-2 text-neutral-500" />
                                    <div className="flex flex-col">
                                        <span className="text-sm">{proj.label}</span>
                                        <span className="text-xs text-neutral-400 capitalize">{proj.subtitle}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {/* Static page navigation */}
                {results.length > 0 && <CommandSeparator />}
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
                                <Icon className="w-4 h-4 mr-2 text-neutral-500" />
                                {page.label}
                            </CommandItem>
                        )
                    })}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
