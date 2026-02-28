import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    const auth = await requireAuth(['super_admin', 'hr_admin'])
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const report = searchParams.get('report') || 'overview'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    if (report === 'overview') {
        // Aggregate stats
        const [
            { count: totalEmployees },
            { count: activeEmployees },
            { count: totalProjects },
            { count: openPositions },
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('projects').select('*', { count: 'exact', head: true }),
            supabase.from('job_openings').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        ])

        // Department distribution
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: departments } = await (supabase.from('departments') as any).select('id, name')
        const deptCounts: { name: string; count: number }[] = []
        if (departments) {
            for (const dept of departments) {
                const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('department_id', dept.id)
                if (count && count > 0) deptCounts.push({ name: dept.name, count })
            }
        }

        // Recent attendance (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const { count: attendanceCount } = await supabase.from('attendance')
            .select('*', { count: 'exact', head: true })
            .gte('date', sevenDaysAgo.toISOString().split('T')[0])

        // Leave stats
        const { count: pendingLeaves } = await supabase.from('leave_requests')
            .select('*', { count: 'exact', head: true }).eq('status', 'pending')

        return NextResponse.json({
            success: true,
            data: {
                totalEmployees: totalEmployees || 0,
                activeEmployees: activeEmployees || 0,
                totalProjects: totalProjects || 0,
                openPositions: openPositions || 0,
                attendanceLast7Days: attendanceCount || 0,
                pendingLeaves: pendingLeaves || 0,
                departmentDistribution: deptCounts,
            },
            message: 'ok'
        } as ApiResponse)
    }

    if (report === 'attendance') {
        const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase as any).rpc('get_attendance_summary', { target_month: month, target_year: year })
            return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
        } catch {
            return NextResponse.json({ success: true, data: null, message: 'Function not available' } as ApiResponse)
        }
    }

    if (report === 'leave') {
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase as any).rpc('get_leave_utilization', { target_year: year })
            return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
        } catch {
            return NextResponse.json({ success: true, data: null, message: 'Function not available' } as ApiResponse)
        }
    }

    return NextResponse.json({ success: false, data: null, message: 'Unknown report' } as ApiResponse, { status: 400 })
}
