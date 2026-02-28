import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { profile } = auth.user
    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'reviews'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    if (tab === 'cycles') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('review_cycles') as any)
            .select('*')
            .order('created_at', { ascending: false })

        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
    }

    if (tab === 'goals') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase.from('goals') as any)
            .select('*, owner:profiles!owner_id(id, full_name, profile_photo_url)')
            .order('created_at', { ascending: false })

        if (profile.role === 'employee') {
            query = query.eq('owner_id', profile.id)
        }

        const { data, error } = await query
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
    }

    // Default: reviews
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('performance_reviews') as any)
        .select('*, employee:profiles!performance_reviews_employee_id_fkey(id, full_name, profile_photo_url, job_title), reviewer:profiles!performance_reviews_reviewer_id_fkey(id, full_name), cycle:review_cycles(*)')
        .order('submitted_at', { ascending: false })

    if (profile.role === 'employee') {
        query = query.eq('employee_id', profile.id)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth(['super_admin', 'hr_admin', 'manager'])
    if ('error' in auth) return auth.error

    const { profile } = auth.user
    const body = await request.json()
    const { type } = body // 'cycle' | 'goal'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    if (type === 'cycle') {
        const { name, review_type, start_date, end_date } = body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('review_cycles') as any)
            .insert({ name, type: review_type || 'quarterly', start_date, end_date, status: 'draft', created_by: profile.id })
            .select().single()
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'Review cycle created' } as ApiResponse, { status: 201 })
    }

    if (type === 'goal') {
        const { title, description, owner_id, due_date, level } = body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('goals') as any)
            .insert({ title, description, owner_id: owner_id || profile.id, due_date, status: 'not_started', level: level || 'individual', current_progress: 0, created_by: profile.id })
            .select('*, owner:profiles!owner_id(id, full_name, profile_photo_url)').single()
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'Goal created' } as ApiResponse, { status: 201 })
    }

    return NextResponse.json({ success: false, data: null, message: 'Invalid type' } as ApiResponse, { status: 400 })
}
