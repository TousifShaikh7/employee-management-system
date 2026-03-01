import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse } from '@/lib/types/database'

export async function GET() {
    const auth = await requireAuth(['super_admin', 'hr_admin'])
    if ('error' in auth) return auth.error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    // Try to fetch from assets table; if it doesn't exist, return empty
    try {
        const { data, error } = await supabase
            .from('assets')
            .select('*, assigned_to:profiles!assigned_to(id, full_name, profile_photo_url)')
            .order('created_at', { ascending: false })

        if (error) {
            // Table might not exist yet — return empty
            return NextResponse.json({ success: true, data: [], message: 'ok' } as ApiResponse)
        }

        return NextResponse.json({ success: true, data, message: 'ok' } as ApiResponse)
    } catch {
        return NextResponse.json({ success: true, data: [], message: 'ok' } as ApiResponse)
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth(['super_admin', 'hr_admin'])
    if ('error' in auth) return auth.error

    const body = await request.json()
    const { name, type, serial_number, assigned_to, status } = body

    if (!name || !type) {
        return NextResponse.json({ success: false, data: null, message: 'Name and type are required' } as ApiResponse, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    try {
        const { data, error } = await supabase
            .from('assets')
            .insert({
                name,
                type,
                serial_number: serial_number || null,
                assigned_to: assigned_to || null,
                status: status || 'available',
                created_by: auth.user.profile.id,
            })
            .select('*, assigned_to:profiles!assigned_to(id, full_name, profile_photo_url)')
            .single()

        if (error) {
            return NextResponse.json({ success: false, data: null, message: error.message } as ApiResponse, { status: 500 })
        }

        return NextResponse.json({ success: true, data, message: 'Asset created' } as ApiResponse)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to create asset'
        return NextResponse.json({ success: false, data: null, message } as ApiResponse, { status: 500 })
    }
}
