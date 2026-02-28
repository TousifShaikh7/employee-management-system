import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse } from '@/lib/types/database'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { profile } = auth.user
    const { id: projectId } = await params
    const body = await request.json()
    const { title, description, assignee_id, due_date, priority, status: taskStatus } = body

    if (!title) {
        return NextResponse.json({ success: false, data: null, message: 'Task title is required' } as ApiResponse, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('tasks') as any)
        .insert({
            project_id: projectId,
            title,
            description: description || null,
            assignee_id: assignee_id || null,
            due_date: due_date || null,
            priority: priority || 'medium',
            status: taskStatus || 'todo',
            created_by: profile.id,
        })
        .select('*, assignee:profiles!assignee_id(id, full_name, profile_photo_url)')
        .single()

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    return NextResponse.json({ success: true, data, message: 'Task created' } as ApiResponse, { status: 201 })
}

export async function PATCH(request: NextRequest) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { task_id, ...updates } = body

    if (!task_id) {
        return NextResponse.json({ success: false, data: null, message: 'task_id is required' } as ApiResponse, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)
    const allowedFields = ['title', 'description', 'assignee_id', 'due_date', 'priority', 'status', 'estimated_hours', 'actual_hours']
    const safeUpdates: Record<string, unknown> = {}
    for (const key of allowedFields) {
        if (updates[key] !== undefined) safeUpdates[key] = updates[key]
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('tasks') as any)
        .update(safeUpdates)
        .eq('id', task_id)
        .select('*, assignee:profiles!assignee_id(id, full_name, profile_photo_url)')
        .single()

    if (error) {
        return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    }

    return NextResponse.json({ success: true, data, message: 'Task updated' } as ApiResponse)
}
