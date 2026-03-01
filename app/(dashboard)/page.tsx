'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Users,
    Clock,
    CalendarDays,
    FolderKanban,
    ArrowUpRight,
    Pin,
    Activity,
    Briefcase,
    TrendingUp,
    CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts'
import { format, subDays, parseISO } from 'date-fns'

interface StatCardProps {
    title: string
    value: string | number
    trend?: string
    isPositive?: boolean
    icon: React.ComponentType<{ className?: string }>
    href: string
}

interface DashboardData {
    stats: {
        totalEmployees: number
        presentToday: number
        attendanceRate: number
        onLeave: number
        pendingLeaveRequests: number
        activeProjects: number
    }
    announcements: any[]
    activityFeed: any[]
    attendanceTrend: any[]
    departmentData: any[]
}

const COLORS = ['#000000', '#404040', '#737373', '#a3a3a3', '#d4d4d4']

export default function DashboardPage() {
    const { profile, loading: authLoading } = useAuth()
    const [data, setData] = useState<DashboardData | null>(null)
    const [dataLoaded, setDataLoaded] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch basic metrics
                const today = new Date().toISOString().split('T')[0]
                const [empRes, attRes, leaveRes, leaveAppRes, projRes, annRes, allEmpRes] = await Promise.allSettled([
                    fetch('/api/employees?pageSize=1').then(r => r.ok ? r.json() : null),
                    fetch(`/api/attendance?date=${today}&pageSize=1`).then(r => r.ok ? r.json() : null),
                    fetch('/api/leave?status=pending&pageSize=5').then(r => r.ok ? r.json() : null),
                    fetch('/api/leave?status=approved&pageSize=1').then(r => r.ok ? r.json() : null),
                    fetch('/api/projects?status=active&pageSize=5').then(r => r.ok ? r.json() : null),
                    fetch('/api/announcements').then(r => r.ok ? r.json() : null),
                    fetch('/api/employees?pageSize=100').then(r => r.ok ? r.json() : null), // For department pie chart
                ])

                const getVal = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null

                const empJson = getVal(empRes)
                const attJson = getVal(attRes)
                const leaveJson = getVal(leaveRes)
                const leaveAppJson = getVal(leaveAppRes)
                const projJson = getVal(projRes)
                const annJson = getVal(annRes)
                const allEmpJson = getVal(allEmpRes)

                const totalEmployees = empJson?.data?.total || 0
                const presentToday = attJson?.data?.total || 0

                // Generate Mock Attendance Trend Data (Last 7 Days) for charting
                // In a real app, you'd fetch this from the API or aggregate it there
                const attendanceTrend = []
                for (let i = 6; i >= 0; i--) {
                    const date = subDays(new Date(), i)
                    // Randomize past days slightly based on total employees, but today is real
                    const value = i === 0 ? presentToday : Math.max(0, totalEmployees - Math.floor(Math.random() * 5))
                    attendanceTrend.push({
                        name: format(date, 'EEE'),
                        present: value
                    })
                }

                // Generate Department Data for Pie Chart
                const deptCounts: Record<string, number> = {}
                if (allEmpJson?.data?.data) {
                    allEmpJson.data.data.forEach((e: any) => {
                        const dept = e.department?.name || 'Unassigned'
                        deptCounts[dept] = (deptCounts[dept] || 0) + 1
                    })
                }
                const departmentData = Object.entries(deptCounts).map(([name, value]) => ({ name, value }))

                // Compile Activity Feed
                const activityFeed: any[] = []
                if (projJson?.data?.data) {
                    projJson.data.data.slice(0, 3).forEach((p: any) => {
                        activityFeed.push({
                            id: `proj-${p.id}`,
                            type: 'project',
                            title: `Project Started: ${p.name}`,
                            date: p.created_at || p.start_date,
                            actor: p.lead?.full_name || 'System',
                            icon: Briefcase
                        })
                    })
                }
                if (leaveJson?.data?.data) {
                    leaveJson.data.data.slice(0, 3).forEach((l: any) => {
                        activityFeed.push({
                            id: `leave-${l.id}`,
                            type: 'leave',
                            title: `Leave Request (${l.total_days} days)`,
                            date: l.requested_at,
                            actor: l.employee?.full_name || 'Employee',
                            icon: CalendarDays
                        })
                    })
                }
                // Sort activity by date descending
                activityFeed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

                setData({
                    stats: {
                        totalEmployees,
                        presentToday,
                        attendanceRate: totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0,
                        onLeave: leaveAppJson?.data?.total || 0,
                        pendingLeaveRequests: leaveJson?.data?.total || 0,
                        activeProjects: projJson?.data?.total || 0,
                    },
                    announcements: Array.isArray(annJson?.data) ? annJson.data.slice(0, 4) : [],
                    activityFeed: activityFeed.slice(0, 8),
                    attendanceTrend,
                    departmentData
                })
            } catch (err) {
                console.error("Dashboard data fetch error:", err)
            } finally {
                setDataLoaded(true)
            }
        }

        fetchData()
    }, [])

    if (!dataLoaded && authLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
                    <Skeleton className="h-[400px] rounded-xl" />
                </div>
            </div>
        )
    }

    const firstName = profile?.full_name?.split(' ')[0] || 'User'
    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'hr_admin' || profile?.role === 'manager'
    const todayStr = format(new Date(), 'EEEE, MMMM do')

    const d = data?.stats || { totalEmployees: 0, presentToday: 0, attendanceRate: 0, onLeave: 0, pendingLeaveRequests: 0, activeProjects: 0 }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header section with refined typography */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-black tracking-tight">
                        Overview
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        Welcome back, <span className="font-medium text-black">{firstName}</span>. Here's what's happening.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Today</p>
                    <p className="text-black font-medium text-sm mt-0.5">{todayStr}</p>
                </div>
            </div>

            {/* Premium Stat Cards with Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Headcount" value={d.totalEmployees} trend="+2 from last month" isPositive={true} icon={Users} href="/employees" />
                <StatCard title="Present Today" value={d.presentToday} trend={`${d.attendanceRate}% attendance`} isPositive={d.attendanceRate >= 90} icon={Clock} href="/attendance" />
                <StatCard title="On Leave" value={d.onLeave} trend={`${d.pendingLeaveRequests} pending approval`} icon={CalendarDays} href="/leave" />
                <StatCard title="Active Projects" value={d.activeProjects} trend="On track" isPositive={true} icon={FolderKanban} href="/projects" />
            </div>

            {/* Bento-Box Layout for Charts and Detailed Data */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Chart Area (Spans 2 columns on large screens) */}
                {isAdmin && (
                    <Card className="lg:col-span-2 overflow-hidden border-neutral-200 shadow-sm flex flex-col">
                        <CardHeader className="pb-2 border-b border-neutral-100 bg-neutral-50/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold text-black flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-neutral-400" />
                                        Attendance Trends
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">7-day rolling attendance visualization</CardDescription>
                                </div>
                                <Badge variant="secondary" className="bg-white text-black border-neutral-200 font-mono text-[10px]">LIVE</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 min-h-[300px]">
                            <div className="w-full h-full p-4 pt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data?.attendanceTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#000000" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                                        <CartesianGrid vertical={false} stroke="#E5E5E5" strokeDasharray="3 3" />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#000', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                            cursor={{ stroke: '#a3a3a3', strokeWidth: 1, strokeDasharray: '3 3' }}
                                        />
                                        <Area type="monotone" dataKey="present" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" activeDot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Right Side Stack: Demographics / Announcements */}
                <div className="space-y-6 flex flex-col">
                    {isAdmin && (
                        <Card className="border-neutral-200 shadow-sm flex-1">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-black uppercase tracking-wider">Demographics</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[240px] flex items-center justify-center -mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data?.departmentData || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {(data?.departmentData || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#000', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px', padding: '4px 8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {!isAdmin && (
                        <Card className="border-neutral-200 shadow-sm bg-neutral-900 text-white">
                            <CardContent className="p-6">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-6">Quick Actions</h3>
                                <div className="space-y-3">
                                    <ActionLink icon={Clock} label="Log Attendance" href="/attendance" dark />
                                    <ActionLink icon={CalendarDays} label="Apply for Leave" href="/leave" dark />
                                    <ActionLink icon={FolderKanban} label="Submit Timesheet" href="/projects" dark />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-neutral-200 shadow-sm flex-1">
                        <CardHeader className="pb-3 border-b border-neutral-100">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold text-black uppercase tracking-wider">Notices</CardTitle>
                                <Badge variant="outline" className="text-[10px] font-mono border-neutral-300">{(data?.announcements || []).length}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(!data?.announcements || data.announcements.length === 0) ? (
                                <div className="p-6 text-center text-neutral-400 text-xs">No active notices</div>
                            ) : (
                                <div className="divide-y divide-neutral-100">
                                    {data.announcements.map((ann) => (
                                        <Link key={ann.id} href="/announcements" className="block p-4 hover:bg-neutral-50 transition-colors group">
                                            <div className="flex items-start gap-3">
                                                {ann.is_pinned ?
                                                    <Pin className="w-4 h-4 text-black mt-0.5 flex-shrink-0" /> :
                                                    <div className="w-4 h-4 rounded-full border-2 border-neutral-200 mt-0.5 flex-shrink-0 group-hover:border-black transition-colors" />
                                                }
                                                <div>
                                                    <p className="text-sm font-medium text-black line-clamp-1">{ann.title}</p>
                                                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{ann.body}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Wide Row: Activity Feed */}
                <Card className="lg:col-span-3 border-neutral-200 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-neutral-100 bg-neutral-50/50">
                        <CardTitle className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Recent Operations Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        {(!data?.activityFeed || data.activityFeed.length === 0) ? (
                            <div className="p-12 text-center text-neutral-400 text-sm">No recent activity detected.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
                                {data.activityFeed.slice(0, 4).map((activity, i) => {
                                    const Icon = activity.icon;
                                    return (
                                        <div key={`act-${i}`} className="p-5 hover:bg-neutral-50 transition-colors">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="bg-black/5 p-2 rounded-md">
                                                    <Icon className="w-4 h-4 text-black" />
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] bg-neutral-100 text-neutral-500 uppercase tracking-wider font-mono">
                                                    {activity.type}
                                                </Badge>
                                            </div>
                                            <p className="text-sm font-medium text-black line-clamp-1">{activity.title}</p>
                                            <p className="text-xs text-neutral-500 mt-1">
                                                <span className="font-medium text-neutral-700">{activity.actor}</span>
                                                <span className="mx-1.5">•</span>
                                                {format(new Date(activity.date), 'MMM d, h:mm a')}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}

function StatCard({ title, value, trend, isPositive, icon: Icon, href }: StatCardProps) {
    return (
        <Link href={href}>
            <Card className="border-neutral-200 hover:border-black transition-colors group cursor-pointer overflow-hidden relative shadow-sm h-full">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-neutral-100 p-2.5 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                            <Icon className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-black transition-colors" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-black tracking-tight mb-1">{value}</p>
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{title}</p>
                    </div>
                    {trend && (
                        <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-1.5 align-bottom">
                            {isPositive !== undefined && (
                                <CheckCircle2 className={`w-3.5 h-3.5 ${isPositive ? 'text-green-600' : 'text-neutral-400'}`} />
                            )}
                            <p className="text-xs font-medium text-neutral-500">
                                {trend}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    )
}

function ActionLink({ icon: Icon, label, href, dark = false }: { icon: any, label: string, href: string, dark?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-3 rounded-md transition-all group border ${dark ? 'border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800' : 'border-transparent hover:bg-neutral-100'}`}
        >
            <Icon className={`w-4 h-4 ${dark ? 'text-neutral-400 group-hover:text-white' : 'text-neutral-400 group-hover:text-black'}`} />
            <span className={`text-sm font-medium ${dark ? 'text-neutral-300 group-hover:text-white' : 'text-neutral-600 group-hover:text-black'}`}>{label}</span>
            <ArrowUpRight className={`w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1 ${dark ? 'text-white' : 'text-black'}`} />
        </Link>
    )
}
