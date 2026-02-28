'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Users,
    Clock,
    CalendarDays,
    FolderKanban,
    ArrowUpRight,
    Building2,
    Pin,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ComponentType<{ className?: string }>
    href: string
}

interface DashboardStats {
    totalEmployees: number
    presentToday: number
    attendanceRate: number
    onLeave: number
    pendingLeaveRequests: number
    activeProjects: number
}

interface Announcement {
    id: string
    title: string
    body: string
    is_pinned: boolean
    created_at: string
    author?: { full_name: string }
}

function StatCard({ title, value, subtitle, icon: Icon, href }: StatCardProps) {
    return (
        <Link href={href}>
            <Card className="border-neutral-200 hover:border-neutral-300 transition-colors group cursor-pointer">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-neutral-400" />
                                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">{title}</p>
                            </div>
                            <p className="text-3xl font-bold text-black tracking-tight">{value}</p>
                            {subtitle && (
                                <p className="text-xs text-neutral-500">{subtitle}</p>
                            )}
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-black transition-colors" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

export default function DashboardPage() {
    const { profile, loading: authLoading } = useAuth()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [dataLoaded, setDataLoaded] = useState(false)

    useEffect(() => {
        // Start fetching as soon as component mounts — don't wait for auth
        const fetchData = async () => {
            try {
                const [empRes, attRes, leaveRes, leaveAppRes, projRes, annRes] = await Promise.allSettled([
                    fetch('/api/employees?pageSize=1').then(r => r.ok ? r.json() : null),
                    fetch(`/api/attendance?date=${new Date().toISOString().split('T')[0]}&pageSize=1`).then(r => r.ok ? r.json() : null),
                    fetch('/api/leave?status=pending&pageSize=1').then(r => r.ok ? r.json() : null),
                    fetch('/api/leave?status=approved&pageSize=1').then(r => r.ok ? r.json() : null),
                    fetch('/api/projects?status=active&pageSize=1').then(r => r.ok ? r.json() : null),
                    fetch('/api/announcements').then(r => r.ok ? r.json() : null),
                ])

                const getVal = (r: PromiseSettledResult<unknown>) =>
                    r.status === 'fulfilled' ? r.value : null

                const empJson = getVal(empRes) as { data?: { total?: number } } | null
                const attJson = getVal(attRes) as { data?: { total?: number } } | null
                const leaveJson = getVal(leaveRes) as { data?: { total?: number } } | null
                const leaveAppJson = getVal(leaveAppRes) as { data?: { total?: number } } | null
                const projJson = getVal(projRes) as { data?: { total?: number } } | null
                const annJson = getVal(annRes) as { data?: Announcement[] } | null

                const totalEmployees = empJson?.data?.total || 0
                const presentToday = attJson?.data?.total || 0

                setStats({
                    totalEmployees,
                    presentToday,
                    attendanceRate: totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0,
                    onLeave: leaveAppJson?.data?.total || 0,
                    pendingLeaveRequests: leaveJson?.data?.total || 0,
                    activeProjects: projJson?.data?.total || 0,
                })

                const anns = annJson?.data || []
                setAnnouncements(Array.isArray(anns) ? anns.slice(0, 5) : [])
            } catch {
                // Even on error, stop loading
                setStats({ totalEmployees: 0, presentToday: 0, attendanceRate: 0, onLeave: 0, pendingLeaveRequests: 0, activeProjects: 0 })
            } finally {
                setDataLoaded(true)
            }
        }

        fetchData()
    }, [])

    // Show skeleton only briefly during initial load
    if (!dataLoaded && authLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        )
    }

    const firstName = profile?.full_name?.split(' ')[0] || 'User'
    const currentHour = new Date().getHours()
    const greeting =
        currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening'

    const s = stats || { totalEmployees: 0, presentToday: 0, attendanceRate: 0, onLeave: 0, pendingLeaveRequests: 0, activeProjects: 0 }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-black tracking-tight">
                    {greeting}, {firstName}
                </h1>
                <p className="text-neutral-500 text-sm mt-1">
                    Here&apos;s your company overview for today
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Employees"
                    value={s.totalEmployees}
                    subtitle={`Total active employees`}
                    icon={Users}
                    href="/employees"
                />
                <StatCard
                    title="Present Today"
                    value={s.presentToday}
                    subtitle={`${s.attendanceRate}% attendance rate`}
                    icon={Clock}
                    href="/attendance"
                />
                <StatCard
                    title="On Leave"
                    value={s.onLeave}
                    subtitle={`${s.pendingLeaveRequests} pending requests`}
                    icon={CalendarDays}
                    href="/leave"
                />
                <StatCard
                    title="Active Projects"
                    value={s.activeProjects}
                    subtitle={`Currently in progress`}
                    icon={FolderKanban}
                    href="/projects"
                />
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card className="border-neutral-200">
                    <CardContent className="p-5">
                        <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-4">Quick Actions</h3>
                        <div className="space-y-1">
                            {profile?.role === 'employee' ? (
                                <>
                                    <ActionLink icon={Clock} label="Check In / Out" href="/attendance" />
                                    <ActionLink icon={CalendarDays} label="Apply for Leave" href="/leave" />
                                    <ActionLink icon={FolderKanban} label="My Tasks" href="/projects" />
                                </>
                            ) : (
                                <>
                                    <ActionLink icon={Users} label="View Employees" href="/employees" />
                                    <ActionLink icon={Clock} label="Attendance Dashboard" href="/attendance" />
                                    <ActionLink icon={CalendarDays} label="Leave Requests" href="/leave" />
                                    <ActionLink icon={FolderKanban} label="Projects" href="/projects" />
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Announcements */}
                <Card className="lg:col-span-2 border-neutral-200">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400">Announcements</h3>
                            <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-500 hover:bg-neutral-100">
                                {announcements.length} new
                            </Badge>
                        </div>
                        {announcements.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Building2 className="w-8 h-8 text-neutral-200 mb-3" />
                                <p className="text-sm font-medium text-neutral-400">No announcements</p>
                                <p className="text-xs text-neutral-300 mt-1">
                                    Company updates will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {announcements.map((ann) => (
                                    <div key={ann.id} className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                                        <div className="flex items-start gap-2">
                                            {ann.is_pinned && <Pin className="w-3 h-3 text-neutral-400 mt-1 flex-shrink-0" />}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-black truncate">{ann.title}</p>
                                                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{ann.body}</p>
                                                <p className="text-xs text-neutral-400 mt-2">
                                                    {ann.author?.full_name || 'Admin'} · {new Date(ann.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Link href="/announcements" className="text-xs text-neutral-500 hover:text-black transition-colors block text-center pt-2">
                                    View all announcements →
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function ActionLink({
    icon: Icon,
    label,
    href,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    href: string
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-neutral-100 transition-colors group"
        >
            <Icon className="w-4 h-4 text-neutral-400 group-hover:text-black" />
            <span className="text-sm text-neutral-600 group-hover:text-black">{label}</span>
            <ArrowUpRight className="w-3 h-3 text-neutral-300 group-hover:text-black ml-auto" />
        </Link>
    )
}
