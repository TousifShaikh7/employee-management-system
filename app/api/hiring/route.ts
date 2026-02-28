import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse, PaginatedResponse, JobOpening, Candidate } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    const auth = await requireAuth(['super_admin', 'hr_admin', 'manager'])
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'openings'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status') || ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    if (tab === 'candidates') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase.from('candidates') as any)
            .select('*, job_opening:job_openings(id, title)', { count: 'exact' })
        if (status) query = query.eq('overall_status', status)
        const { data, error, count } = await query.order('applied_at', { ascending: false }).range(from, to)
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data: { data: data || [], total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) }, message: 'ok' } as ApiResponse)
    }

    // Default: openings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('job_openings') as any)
        .select('*, department:departments!department_id(*)', { count: 'exact' })
    if (status) query = query.eq('status', status)
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
    if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    return NextResponse.json({ success: true, data: { data: data || [], total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) }, message: 'ok' } as ApiResponse)
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth(['super_admin', 'hr_admin', 'manager'])
    if ('error' in auth) return auth.error

    const { profile } = auth.user
    const body = await request.json()
    const { title, department_id, employment_type, openings_count, job_description, required_skills } = body

    if (!title) return NextResponse.json({ success: false, data: null, message: 'Title is required' } as ApiResponse, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('job_openings') as any)
        .insert({
            title, department_id: department_id || null,
            employment_type: employment_type || 'full_time',
            openings_count: openings_count || 1,
            job_description: job_description || null,
            required_skills: required_skills || [],
            status: 'draft', created_by: profile.id,
        })
        .select('*, department:departments!department_id(*)').single()

    if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    return NextResponse.json({ success: true, data, message: 'Job opening created' } as ApiResponse, { status: 201 })
}
