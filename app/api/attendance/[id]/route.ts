import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse } from '@/lib/types/database'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth(['super_admin', 'hr_admin'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    const allowedFields = ['status', 'check_in_time', 'check_out_time', 'total_hours', 'notes']
    const updates: Record<string, unknown> = {}
    for (const key of allowedFields) {
        if (body[key] !== undefined) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json(
            { success: false, data: null, message: 'No valid fields to update' } as ApiResponse,
            { status: 400 }
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('attendance') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    return NextResponse.json({ success: true, data, message: 'Attendance record updated' } as ApiResponse)
}
