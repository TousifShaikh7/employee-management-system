'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/lib/types/database'

interface NavItem {
    label: string
    href: string
    roles?: UserRole[]
}

const navItems: NavItem[] = [
    { label: 'Overview', href: '/' },
    { label: 'Employees', href: '/employees' },
    { label: 'Attendance', href: '/attendance' },
    { label: 'Leave', href: '/leave' },
    { label: 'Projects', href: '/projects' },
    { label: 'Performance', href: '/performance', roles: ['super_admin', 'hr_admin', 'manager'] },
    { label: 'Payroll', href: '/payroll', roles: ['super_admin', 'hr_admin'] },
    { label: 'Hiring', href: '/hiring', roles: ['super_admin', 'hr_admin', 'manager'] },
    { label: 'Announcements', href: '/announcements' },
    { label: 'Reports', href: '/reports', roles: ['super_admin', 'hr_admin'] },
    { label: 'Settings', href: '/settings', roles: ['super_admin', 'hr_admin'] },
]

interface PageNavProps {
    userRole: UserRole
}

export function PageNav({ userRole }: PageNavProps) {
    const pathname = usePathname()

    const visibleItems = navItems.filter(
        (item) => !item.roles || item.roles.includes(userRole)
    )

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    return (
        <nav className="border-b border-neutral-200 bg-white">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
                    {visibleItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                relative px-4 py-3 text-[13px] font-medium tracking-wide uppercase whitespace-nowrap transition-colors
                ${isActive(item.href)
                                    ? 'text-black'
                                    : 'text-neutral-400 hover:text-neutral-700'
                                }
              `}
                        >
                            {item.label}
                            {isActive(item.href) && (
                                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-black" />
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    )
}
