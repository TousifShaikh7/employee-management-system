import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse, PaginatedResponse, Attendance } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { profile } = auth.user

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const date = searchParams.get('date') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const employeeId = searchParams.get('employee_id') || ''
    const status = searchParams.get('status') || ''
    const department = searchParams.get('department') || ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('attendance') as any)
        .select('*, employee:profiles!employee_id(id, full_name, department_id, profile_photo_url, job_title)', { count: 'exact' })

    // Role-based filtering: employees only see their own
    if (profile.role === 'employee') {
        query = query.eq('employee_id', profile.id)
    } else if (employeeId) {
        query = query.eq('employee_id', employeeId)
    }

    if (date) {
        query = query.eq('date', date)
    } else {
        if (dateFrom) query = query.gte('date', dateFrom)
        if (dateTo) query = query.lte('date', dateTo)
    }

    if (status) query = query.eq('status', status)

    // Department filter via subquery
    if (department && profile.role !== 'employee') {
        const { data: deptEmployees } = await supabase
            .from('profiles')
            .select('id')
            .eq('department_id', department)
        if (deptEmployees) {
            const ids = deptEmployees.map((e: { id: string }) => e.id)
            query = query.in('employee_id', ids)
        }
    }

    const { data, error, count } = await query
        .order('date', { ascending: false })
        .order('check_in_time', { ascending: false })
        .range(from, to)

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    const response: PaginatedResponse<Attendance> = {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
    }

    return NextResponse.json({ success: true, data: response, message: 'ok' } as ApiResponse)
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { profile } = auth.user

    const body = await request.json()
    const { action } = body // 'check_in' or 'check_out'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    if (action === 'check_in') {
        // Check if already checked in today
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabase.from('attendance') as any)
            .select('id')
            .eq('employee_id', profile.id)
            .eq('date', today)
            .maybeSingle()

        if (existing) {
            return NextResponse.json(
                { success: false, data: null, message: 'Already checked in today' } as ApiResponse,
                { status: 400 }
            )
        }

        // Determine status based on time (simple: after 9:30 AM is late)
        const hour = new Date().getHours()
        const minute = new Date().getMinutes()
        const isLate = hour > 9 || (hour === 9 && minute > 30)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('attendance') as any)
            .insert({
                employee_id: profile.id,
                date: today,
                check_in_time: now,
                status: isLate ? 'late' : 'present',
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        }

        return NextResponse.json({ success: true, data, message: 'Checked in successfully' } as ApiResponse)
    }

    if (action === 'check_out') {
        // Find today's record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: record } = await (supabase.from('attendance') as any)
            .select('*')
            .eq('employee_id', profile.id)
            .eq('date', today)
            .maybeSingle()

        if (!record) {
            return NextResponse.json(
                { success: false, data: null, message: 'No check-in found for today' } as ApiResponse,
                { status: 400 }
            )
        }

        if (record.check_out_time) {
            return NextResponse.json(
                { success: false, data: null, message: 'Already checked out today' } as ApiResponse,
                { status: 400 }
            )
        }

        // Calculate total hours
        const checkIn = new Date(record.check_in_time)
        const checkOut = new Date()
        const totalHours = Math.round(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)) * 100) / 100

        // Determine if half day (less than 4 hours)
        const finalStatus = totalHours < 4 ? 'half_day' : record.status

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('attendance') as any)
            .update({
                check_out_time: now,
                total_hours: totalHours,
                status: finalStatus,
            })
            .eq('id', record.id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        }

        return NextResponse.json({ success: true, data, message: 'Checked out successfully' } as ApiResponse)
    }

    return NextResponse.json({ success: false, data: null, message: 'Invalid action' } as ApiResponse, { status: 400 })
}
