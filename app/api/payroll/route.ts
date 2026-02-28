import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { profile } = auth.user
    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'payslips'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    if (tab === 'runs' && (profile.role === 'super_admin' || profile.role === 'hr_admin')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('payroll_runs') as any)
            .select('*').order('month', { ascending: false })
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
    }

    if (tab === 'salary' && (profile.role === 'super_admin' || profile.role === 'hr_admin')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('salary_components') as any)
            .select('*, employee:profiles!employee_id(id, full_name)')
            .order('effective_from', { ascending: false }).limit(50)
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
    }

    // Default: payslips
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('payslips') as any)
        .select('*, employee:profiles!employee_id(id, full_name, profile_photo_url)')
        .order('month', { ascending: false })

    if (profile.role === 'employee') query = query.eq('employee_id', profile.id)

    const { data, error } = await query.limit(50)
    if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
}
