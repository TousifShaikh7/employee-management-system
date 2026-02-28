import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { profile } = auth.user

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id') || profile.id
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Only admins/managers can view other people's balances
    const targetId = (profile.role === 'employee') ? profile.id : employeeId

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('leave_balances') as any)
        .select('*, leave_type:leave_types(*)')
        .eq('employee_id', targetId)
        .eq('year', year)
        .order('leave_type_id')

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    // Also fetch leave types (for when no balances exist yet)
    const { data: leaveTypes } = await supabase.from('leave_types').select('*').order('name')

    return NextResponse.json({
        success: true,
        data: { balances: data || [], leaveTypes: leaveTypes || [] },
        message: 'ok'
    } as ApiResponse)
}
