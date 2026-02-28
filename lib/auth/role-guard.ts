import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import type { UserRole, Profile } from '@/lib/types/database'
import { NextResponse } from 'next/server'

export interface AuthenticatedUser {
    id: string
    email: string
    profile: Profile
}

/**
 * Verify the authenticated user and check their role.
 * Returns the user profile if authorized, or a NextResponse error.
 */
export async function requireAuth(
    allowedRoles?: UserRole[]
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
    const supabase = await createServerSupabaseClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return {
            error: NextResponse.json(
                { success: false, data: null, message: 'Unauthorized' },
                { status: 401 }
            ),
        }
    }

    // Fetch the user's profile using service role to bypass RLS
    const serviceClient = createServiceRoleClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: profileError } = await (serviceClient.from('profiles') as any)
        .select('*')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        return {
            error: NextResponse.json(
                { success: false, data: null, message: 'Profile not found' },
                { status: 403 }
            ),
        }
    }

    // Check role authorization
    const typedProfile = profile as unknown as Profile
    if (allowedRoles && !allowedRoles.includes(typedProfile.role)) {
        return {
            error: NextResponse.json(
                { success: false, data: null, message: 'Insufficient permissions' },
                { status: 403 }
            ),
        }
    }

    return {
        user: {
            id: user.id,
            email: user.email!,
            profile: typedProfile,
        },
    }
}

/**
 * Get a Supabase client for data queries.
 * Returns the service role client for admin users (bypasses RLS),
 * or the session-based client for non-admin users.
 */
export async function getDataClient(auth: { user: AuthenticatedUser }) {
    if (isAdmin(auth.user.profile.role)) {
        return createServiceRoleClient()
    }
    return await createServerSupabaseClient()
}

/**
 * Check if the user has one of the specified roles.
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
    return allowedRoles.includes(userRole)
}

/**
 * Check if user is admin (super_admin or hr_admin)
 */
export function isAdmin(role: UserRole): boolean {
    return role === 'super_admin' || role === 'hr_admin'
}

/**
 * Check if user can manage a specific department
 */
export function canManageDepartment(
    userRole: UserRole,
    userDepartmentId: string | null,
    targetDepartmentId: string | null
): boolean {
    if (isAdmin(userRole)) return true
    if (userRole === 'manager' && userDepartmentId === targetDepartmentId) return true
    return false
}
