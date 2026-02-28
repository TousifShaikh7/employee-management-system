import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse, PaginatedResponse, LeaveRequest } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { profile } = auth.user

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status') || ''
    const employeeId = searchParams.get('employee_id') || ''
    const leaveTypeId = searchParams.get('leave_type_id') || ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('leave_requests') as any)
        .select('*, employee:profiles!employee_id(id, full_name, department_id, profile_photo_url), leave_type:leave_types(*)', { count: 'exact' })

    // Role-based filtering
    if (profile.role === 'employee') {
        query = query.eq('employee_id', profile.id)
    } else if (employeeId) {
        query = query.eq('employee_id', employeeId)
    }

    if (status) query = query.eq('status', status)
    if (leaveTypeId) query = query.eq('leave_type_id', leaveTypeId)

    const { data, error, count } = await query
        .order('requested_at', { ascending: false })
        .range(from, to)

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    const response: PaginatedResponse<LeaveRequest> = {
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
    const { leave_type_id, start_date, end_date, reason } = body

    if (!leave_type_id || !start_date || !end_date) {
        return NextResponse.json(
            { success: false, data: null, message: 'Leave type, start date, and end date are required' } as ApiResponse,
            { status: 400 }
        )
    }

    // Calculate total days (simple: business days between dates)
    const start = new Date(start_date)
    const end = new Date(end_date)
    let totalDays = 0
    const current = new Date(start)
    while (current <= end) {
        const day = current.getDay()
        if (day !== 0 && day !== 6) totalDays++ // Skip weekends
        current.setDate(current.getDate() + 1)
    }

    if (totalDays <= 0) {
        return NextResponse.json(
            { success: false, data: null, message: 'Invalid date range' } as ApiResponse,
            { status: 400 }
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    // Check leave balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: balance } = await (supabase.from('leave_balances') as any)
        .select('*')
        .eq('employee_id', profile.id)
        .eq('leave_type_id', leave_type_id)
        .eq('year', new Date().getFullYear())
        .maybeSingle()

    if (balance && balance.remaining < totalDays) {
        return NextResponse.json(
            { success: false, data: null, message: `Insufficient leave balance. You have ${balance.remaining} days remaining.` } as ApiResponse,
            { status: 400 }
        )
    }

    // Create leave request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('leave_requests') as any)
        .insert({
            employee_id: profile.id,
            leave_type_id,
            start_date,
            end_date,
            total_days: totalDays,
            reason: reason || null,
            status: 'pending',
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    // Update pending count in leave balance
    if (balance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('leave_balances') as any)
            .update({ pending: balance.pending + totalDays })
            .eq('id', balance.id)
    }

    return NextResponse.json({ success: true, data, message: 'Leave request submitted' } as ApiResponse, { status: 201 })
}
