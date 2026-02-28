import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse } from '@/lib/types/database'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth(['super_admin', 'hr_admin', 'manager'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()
    const { action, note } = body // action: 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json(
            { success: false, data: null, message: 'Invalid action. Must be "approve" or "reject".' } as ApiResponse,
            { status: 400 }
        )
    }

    const { profile } = auth.user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    // Get the leave request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: leaveRequest } = await (supabase.from('leave_requests') as any)
        .select('*')
        .eq('id', id)
        .single()

    if (!leaveRequest) {
        return NextResponse.json(
            { success: false, data: null, message: 'Leave request not found' } as ApiResponse,
            { status: 404 }
        )
    }

    if (leaveRequest.status !== 'pending') {
        return NextResponse.json(
            { success: false, data: null, message: 'This request has already been processed' } as ApiResponse,
            { status: 400 }
        )
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const updateData: Record<string, unknown> = {
        status: newStatus,
    }

    if (profile.role === 'manager') {
        updateData.manager_approval_status = newStatus
        updateData.manager_note = note || null
    } else {
        updateData.hr_approval_status = newStatus
        updateData.hr_note = note || null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('leave_requests') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    // Update leave balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: balance } = await (supabase.from('leave_balances') as any)
        .select('*')
        .eq('employee_id', leaveRequest.employee_id)
        .eq('leave_type_id', leaveRequest.leave_type_id)
        .eq('year', new Date().getFullYear())
        .maybeSingle()

    if (balance) {
        const updates: Record<string, number> = {
            pending: Math.max(0, balance.pending - leaveRequest.total_days),
        }
        if (action === 'approve') {
            updates.used = balance.used + leaveRequest.total_days
            updates.remaining = Math.max(0, balance.remaining - leaveRequest.total_days)
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('leave_balances') as any)
            .update(updates)
            .eq('id', balance.id)
    }

    return NextResponse.json({
        success: true,
        data,
        message: `Leave request ${newStatus}`
    } as ApiResponse)
}
