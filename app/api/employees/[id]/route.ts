import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse, Profile } from '@/lib/types/database'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { id } = await params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)

    const { data, error } = await supabase
        .from('profiles')
        .select('*, department:departments!department_id(*), branch:branches(*)')
        .eq('id', id)
        .single()

    if (error) {
        return NextResponse.json<ApiResponse>(
            { success: false, data: null, message: 'Employee not found' },
            { status: 404 }
        )
    }

    return NextResponse.json<ApiResponse<Profile>>({
        success: true,
        data: data as unknown as Profile,
        message: 'Employee fetched successfully',
    })
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json()

    // Employees can only update their own limited fields
    if (auth.user.profile.role === 'employee' && auth.user.id !== id) {
        return NextResponse.json<ApiResponse>(
            { success: false, data: null, message: 'Insufficient permissions' },
            { status: 403 }
        )
    }

    // Limit fields employees can update
    const allowedEmployeeFields = ['phone', 'personal_email', 'emergency_contact_name', 'emergency_contact_phone', 'skills']
    if (auth.user.profile.role === 'employee') {
        const filteredBody: Record<string, unknown> = {}
        for (const key of allowedEmployeeFields) {
            if (body[key] !== undefined) {
                filteredBody[key] = body[key]
            }
        }
        Object.keys(body).forEach((key) => {
            if (!allowedEmployeeFields.includes(key)) {
                delete body[key]
            }
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('profiles') as any)
        .update(body)
        .eq('id', id)
        .select('*, department:departments!department_id(*), branch:branches(*)')
        .single()

    if (error) {
        return NextResponse.json<ApiResponse>(
            { success: false, data: null, message: error.message },
            { status: 500 }
        )
    }

    // Audit log
    const serviceClient = createServiceRoleClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceClient as any).rpc('log_audit_event', {
        p_actor_id: auth.user.id,
        p_action: 'Updated employee profile',
        p_module: 'employees',
        p_target_table: 'profiles',
        p_target_id: id,
        p_old_values: null,
        p_new_values: body as Record<string, unknown>,
    })

    return NextResponse.json<ApiResponse<Profile>>({
        success: true,
        data: data as unknown as Profile,
        message: 'Employee updated successfully',
    })
}
