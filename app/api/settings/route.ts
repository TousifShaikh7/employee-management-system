import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    const auth = await requireAuth(['super_admin', 'hr_admin'])
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'company'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    if (tab === 'departments') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('departments') as any)
            .select('*, manager:profiles!head_id(id, full_name)')
            .order('name')
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
    }

    if (tab === 'branches') {
        const { data, error } = await supabase.from('branches').select('*').order('name')
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
    }

    if (tab === 'leave_types') {
        const { data, error } = await supabase.from('leave_types').select('*').order('name')
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
    }

    if (tab === 'shifts') {
        const { data, error } = await supabase.from('shifts').select('*').order('name')
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
    }

    // Default: company settings
    const { data, error } = await supabase.from('company_settings').select('*').single()
    if (error) return NextResponse.json({ success: true, data: null, message: 'No settings found' } as ApiResponse)
    return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth(['super_admin'])
    if ('error' in auth) return auth.error

    const { profile } = auth.user
    const body = await request.json()
    const { type } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    if (type === 'department') {
        const { name, head_id } = body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('departments') as any)
            .insert({ name, head_id: head_id || null, created_by: profile.id })
            .select().single()
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'Department created' } as ApiResponse, { status: 201 })
    }

    if (type === 'branch') {
        const { name, city, country, address } = body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('branches') as any)
            .insert({ name, city: city || null, country: country || null, address: address || null, created_by: profile.id })
            .select().single()
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'Branch created' } as ApiResponse, { status: 201 })
    }

    if (type === 'leave_type') {
        const { name, annual_quota } = body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('leave_types') as any)
            .insert({ name, annual_quota: annual_quota || 0, carry_forward: false, max_carry_forward_days: 0, encashable: false, created_by: profile.id })
            .select().single()
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'Leave type created' } as ApiResponse, { status: 201 })
    }

    return NextResponse.json({ success: false, data: null, message: 'Invalid type' } as ApiResponse, { status: 400 })
}
