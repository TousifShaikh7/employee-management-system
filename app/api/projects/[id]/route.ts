import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse } from '@/lib/types/database'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { id } = await params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error } = await (supabase.from('projects') as any)
        .select('*, lead:profiles!lead_id(id, full_name, profile_photo_url), department:departments!department_id(*)')
        .eq('id', id)
        .single()

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 404 })
    }

    // Fetch tasks for this project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tasks } = await (supabase.from('tasks') as any)
        .select('*, assignee:profiles!assignee_id(id, full_name, profile_photo_url)')
        .eq('project_id', id)
        .order('created_at', { ascending: false })

    // Fetch members
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (supabase.from('project_members') as any)
        .select('*, employee:profiles!employee_id(id, full_name, profile_photo_url, job_title)')
        .eq('project_id', id)

    return NextResponse.json({
        success: true,
        data: { ...project, tasks: tasks || [], members: members || [] },
        message: 'ok'
    } as ApiResponse)
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth(['super_admin', 'hr_admin', 'manager'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    const allowedFields = ['name', 'description', 'department_id', 'lead_id', 'start_date', 'deadline', 'priority', 'status', 'progress_percentage', 'health']
    const updates: Record<string, unknown> = {}
    for (const key of allowedFields) {
        if (body[key] !== undefined) updates[key] = body[key]
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('projects') as any)
        .update(updates)
        .eq('id', id)
        .select('*, lead:profiles!lead_id(id, full_name, profile_photo_url), department:departments!department_id(*)')
        .single()

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    return NextResponse.json({ success: true, data, message: 'Project updated' } as ApiResponse)
}
