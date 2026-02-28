import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse, PaginatedResponse, Project } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const search = searchParams.get('search') || ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('projects') as any)
        .select('*, lead:profiles!lead_id(id, full_name, profile_photo_url), department:departments!department_id(*)', { count: 'exact' })

    if (search) query = query.ilike('name', `%${search}%`)
    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    const response: PaginatedResponse<Project> = {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
    }

    return NextResponse.json({ success: true, data: response, message: 'ok' } as ApiResponse)
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth(['super_admin', 'hr_admin', 'manager'])
    if ('error' in auth) return auth.error

    const { profile } = auth.user
    const body = await request.json()
    const { name, description, department_id, lead_id, start_date, deadline, priority, status: projStatus } = body

    if (!name) {
        return NextResponse.json({ success: false, data: null, message: 'Project name is required' } as ApiResponse, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('projects') as any)
        .insert({
            name,
            description: description || null,
            department_id: department_id || null,
            lead_id: lead_id || null,
            start_date: start_date || null,
            deadline: deadline || null,
            priority: priority || 'medium',
            status: projStatus || 'planning',
            progress_percentage: 0,
            health: 'on_track',
            created_by: profile.id,
        })
        .select('*, lead:profiles!lead_id(id, full_name, profile_photo_url), department:departments!department_id(*)')
        .single()

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    return NextResponse.json({ success: true, data, message: 'Project created' } as ApiResponse, { status: 201 })
}
