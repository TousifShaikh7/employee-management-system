'use client'

import { useState } from 'react'
import { TopBar } from '@/components/layout/top-bar'
import { PageNav } from '@/components/layout/page-nav'
import { CommandPalette } from '@/components/layout/command-palette'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading, signOut } = useAuth()
    const [commandOpen, setCommandOpen] = useState(false)

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="space-y-4 w-full max-w-md">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-1/2" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <TopBar
                profile={profile}
                onSignOut={signOut}
                onOpenCommandPalette={() => setCommandOpen(true)}
            />
            <PageNav userRole={profile?.role || 'employee'} />
            <main className="max-w-[1400px] mx-auto px-6 py-8">
                {children}
            </main>
            <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        </div>
    )
}
