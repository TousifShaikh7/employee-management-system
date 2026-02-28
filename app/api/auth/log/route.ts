import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, success, userId } = body

        const supabase = createServiceRoleClient()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('auth_logs') as any).insert({
            user_id: userId || null,
            email,
            success,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
        })

        return NextResponse.json({ success: true, data: null, message: 'Logged' })
    } catch {
        return NextResponse.json(
            { success: false, data: null, message: 'Failed to log auth event' },
            { status: 500 }
        )
    }
}
