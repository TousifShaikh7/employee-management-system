'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, FolderKanban, Briefcase, Calendar, Clock, FileText } from 'lucide-react'

interface OverviewData {
    totalEmployees: number
    activeEmployees: number
    totalProjects: number
    openPositions: number
    attendanceLast7Days: number
    pendingLeaves: number
    departmentDistribution: { name: string; count: number }[]
}

export default function ReportsPage() {
    const [data, setData] = useState<OverviewData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/reports?report=overview')
            if (!res.ok) { setLoading(false); return }
            const json = await res.json()
            if (json.success) setData(json.data)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    if (loading) return (
        <div className="space-y-6">
            <div><h1 className="text-xl font-bold text-black tracking-tight">Reports</h1></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
        </div>
    )

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-black tracking-tight">Reports & Analytics</h1>
                <p className="text-neutral-500 text-sm mt-0.5">Organization overview and insights</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="border-neutral-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-neutral-400" /><span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Employees</span></div>
                        <p className="text-2xl font-bold text-black">{data?.totalEmployees || 0}</p>
                        <p className="text-xs text-neutral-400 mt-1">{data?.activeEmployees || 0} active</p>
                    </CardContent>
                </Card>
                <Card className="border-neutral-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2"><FolderKanban className="w-4 h-4 text-neutral-400" /><span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Projects</span></div>
                        <p className="text-2xl font-bold text-black">{data?.totalProjects || 0}</p>
                    </CardContent>
                </Card>
                <Card className="border-neutral-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2"><Briefcase className="w-4 h-4 text-neutral-400" /><span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Open Positions</span></div>
                        <p className="text-2xl font-bold text-black">{data?.openPositions || 0}</p>
                    </CardContent>
                </Card>
                <Card className="border-neutral-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-neutral-400" /><span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Attendance (7d)</span></div>
                        <p className="text-2xl font-bold text-black">{data?.attendanceLast7Days || 0}</p>
                    </CardContent>
                </Card>
                <Card className="border-neutral-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-neutral-400" /><span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Pending Leaves</span></div>
                        <p className="text-2xl font-bold text-black">{data?.pendingLeaves || 0}</p>
                    </CardContent>
                </Card>
                <Card className="border-neutral-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-neutral-400" /><span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Departments</span></div>
                        <p className="text-2xl font-bold text-black">{data?.departmentDistribution?.length || 0}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Department Distribution */}
            {data?.departmentDistribution && data.departmentDistribution.length > 0 && (
                <Card className="border-neutral-200">
                    <CardContent className="p-5">
                        <h2 className="text-sm font-semibold text-black mb-4">Department Distribution</h2>
                        <div className="space-y-3">
                            {data.departmentDistribution
                                .sort((a, b) => b.count - a.count)
                                .map((dept) => {
                                    const maxCount = Math.max(...data.departmentDistribution.map(d => d.count))
                                    return (
                                        <div key={dept.name} className="flex items-center gap-3">
                                            <span className="text-sm text-neutral-600 w-[140px] truncate">{dept.name}</span>
                                            <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-black rounded-full transition-all" style={{ width: `${(dept.count / maxCount) * 100}%` }} />
                                            </div>
                                            <span className="text-sm font-medium text-black w-8 text-right">{dept.count}</span>
                                        </div>
                                    )
                                })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
