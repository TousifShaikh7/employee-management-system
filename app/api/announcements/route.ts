import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'announcements'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    if (tab === 'policies') {
        const { data, error } = await supabase.from('policies').select('*').order('published_at', { ascending: false })
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('announcements') as any)
        .select('*, author:profiles!created_by(id, full_name, profile_photo_url)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
    return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth(['super_admin', 'hr_admin'])
    if ('error' in auth) return auth.error

    const { profile } = auth.user
    const body = await request.json()
    const { type } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    if (type === 'announcement') {
        const { title, body: content, is_pinned, audience } = body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('announcements') as any)
            .insert({ title, body: content, is_pinned: is_pinned || false, audience: audience || 'all', created_by: profile.id })
            .select('*, author:profiles!created_by(id, full_name, profile_photo_url)').single()
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'Announcement posted' } as ApiResponse, { status: 201 })
    }

    if (type === 'policy') {
        const { title, description, version } = body
        const { data, error } = await supabase.from('policies')
            .insert({ title, description, version: version || '1.0', requires_acknowledgement: true, published_by: profile.id })
            .select().single()
        if (error) return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        return NextResponse.json({ success: true, data, message: 'Policy published' } as ApiResponse, { status: 201 })
    }

    return NextResponse.json({ success: false, data: null, message: 'Invalid type' } as ApiResponse, { status: 400 })
}
