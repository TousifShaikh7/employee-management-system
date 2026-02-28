import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireAuth, getDataClient } from '@/lib/auth/role-guard'
import type { ApiResponse, PaginatedResponse, Profile } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const department = searchParams.get('department') || ''
    const status = searchParams.get('status') || ''
    const employment_type = searchParams.get('employment_type') || ''
    const work_location = searchParams.get('work_location') || ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await getDataClient(auth as any)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
        .from('profiles')
        .select('*, department:departments!department_id(*), branch:branches(*)', { count: 'exact' })

    if (search) {
        query = query.or(`full_name.ilike.%${search}%,employee_id.ilike.%${search}%,work_email.ilike.%${search}%`)
    }
    if (department) {
        query = query.eq('department_id', department)
    }
    if (status) {
        query = query.eq('status', status)
    }
    if (employment_type) {
        query = query.eq('employment_type', employment_type)
    }
    if (work_location) {
        query = query.eq('work_location', work_location)
    }

    const { data, count, error } = await query
        .order('full_name', { ascending: true })
        .range(from, to)

    if (error) {
        return NextResponse.json<ApiResponse>(
            { success: false, data: null, message: error.message },
            { status: 500 }
        )
    }

    const response: PaginatedResponse<Profile> = {
        data: (data || []) as unknown as Profile[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
    }

    return NextResponse.json<ApiResponse<PaginatedResponse<Profile>>>({
        success: true,
        data: response,
        message: 'Employees fetched successfully',
    })
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth(['super_admin', 'hr_admin'])
    if ('error' in auth) return auth.error

    try {
        const body = await request.json()
        const { email, password, full_name, job_title, department_id, employment_type, work_location, branch_id, role, phone, date_of_joining } = body

        const serviceClient = createServiceRoleClient()

        // Create auth user
        const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
            email,
            password: password || 'TempPass123!',
            email_confirm: true,
        })

        if (authError) {
            return NextResponse.json<ApiResponse>(
                { success: false, data: null, message: authError.message },
                { status: 400 }
            )
        }

        // Create profile
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile, error: profileError } = await (serviceClient.from('profiles') as any)
            .insert({
                id: authData.user.id,
                full_name,
                work_email: email,
                job_title,
                department_id: department_id || null,
                employment_type: employment_type || 'full_time',
                work_location: work_location || 'office',
                branch_id: branch_id || null,
                role: role || 'employee',
                phone: phone || null,
                date_of_joining: date_of_joining || null,
                password_changed: false,
                status: 'active',
            })
            .select()
            .single()

        if (profileError) {
            // Cleanup: delete the auth user if profile creation fails
            await serviceClient.auth.admin.deleteUser(authData.user.id)
            return NextResponse.json<ApiResponse>(
                { success: false, data: null, message: profileError.message },
                { status: 500 }
            )
        }

        // Log the action
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (serviceClient as any).rpc('log_audit_event', {
            p_actor_id: auth.user.id,
            p_action: 'Created employee',
            p_module: 'employees',
            p_target_table: 'profiles',
            p_target_id: authData.user.id,
            p_old_values: null,
            p_new_values: { full_name, email, role },
        })

        // Add timeline entry
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (serviceClient.from('employee_timeline') as any).insert({
            employee_id: authData.user.id,
            event_type: 'joined',
            description: `${full_name} joined as ${job_title || 'Employee'}`,
            effective_date: date_of_joining || new Date().toISOString().split('T')[0],
            recorded_by: auth.user.id,
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            data: profile,
            message: 'Employee created successfully',
        })
    } catch (err) {
        return NextResponse.json<ApiResponse>(
            { success: false, data: null, message: 'Failed to create employee' },
            { status: 500 }
        )
    }
}
