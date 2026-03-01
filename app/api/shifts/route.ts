import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse } from '@/lib/types/database'

export async function GET() {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    const { data, error } = await supabase
        .from('shifts')
        .select('*, department:departments!department_id(id, name)')
        .order('name', { ascending: true })

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth(['super_admin', 'hr_admin', 'manager'])
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { name, start_time, end_time, department_id } = body

    if (!name || !start_time || !end_time) {
        return NextResponse.json({ success: false, data: null, message: 'Name, start_time, and end_time are required' } as ApiResponse, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    const { data, error } = await supabase
        .from('shifts')
        .insert({
            name,
            start_time,
            end_time,
            department_id: department_id || null,
            created_by: auth.user.profile.id,
        })
        .select('*, department:departments!department_id(id, name)')
        .single()

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    return NextResponse.json({ success: true, data, message: 'Shift created' } as ApiResponse)
}
