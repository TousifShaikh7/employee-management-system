/**
 * Seed script to create a super_admin user.
 * 
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 * 
 * This will create both the auth user and the profile entry.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ---- CHANGE THESE ----
const ADMIN_EMAIL = 'admin@company.com'
const ADMIN_PASSWORD = 'Admin@12345'
const ADMIN_NAME = 'Admin User'
// -----------------------

async function main() {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.error('❌ Missing env vars. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
        console.error('   Run with: npx dotenv -e .env.local -- npx tsx scripts/seed-admin.ts')
        process.exit(1)
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log('🔧 Creating auth user...')

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
    })

    if (authError) {
        if (authError.message.includes('already been registered')) {
            console.log('⚠️  User already exists. Fetching existing user...')
            const { data: { users } } = await supabase.auth.admin.listUsers()
            const existing = users?.find(u => u.email === ADMIN_EMAIL)
            if (!existing) {
                console.error('❌ Could not find existing user')
                process.exit(1)
            }

            // Check if profile already exists
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', existing.id)
                .maybeSingle()

            if (existingProfile) {
                console.log('✅ Profile already exists! You can login with:')
                console.log(`   Email:    ${ADMIN_EMAIL}`)
                console.log(`   Password: ${ADMIN_PASSWORD}`)
                return
            }

            // Create profile for existing user
            const { error: profileError } = await supabase.from('profiles').insert({
                id: existing.id,
                employee_id: 'EMP001',
                full_name: ADMIN_NAME,
                work_email: ADMIN_EMAIL,
                role: 'super_admin',
                employment_type: 'full_time',
                work_location: 'office',
                status: 'active',
                password_changed: true,
                skills: [],
            })

            if (profileError) {
                console.error('❌ Error creating profile:', profileError.message)
                process.exit(1)
            }

            console.log('✅ Profile created! You can login with:')
            console.log(`   Email:    ${ADMIN_EMAIL}`)
            console.log(`   Password: ${ADMIN_PASSWORD}`)
            return
        }

        console.error('❌ Error creating user:', authError.message)
        process.exit(1)
    }

    const userId = authData.user.id
    console.log(`✅ Auth user created (ID: ${userId})`)

    console.log('📝 Creating profile...')

    const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        employee_id: 'EMP001',
        full_name: ADMIN_NAME,
        work_email: ADMIN_EMAIL,
        role: 'super_admin',
        employment_type: 'full_time',
        work_location: 'office',
        status: 'active',
        password_changed: true,
        skills: [],
    })

    if (profileError) {
        console.error('❌ Error creating profile:', profileError.message)
        process.exit(1)
    }

    console.log('✅ Done! You can now login with:')
    console.log(`   Email:    ${ADMIN_EMAIL}`)
    console.log(`   Password: ${ADMIN_PASSWORD}`)
}

main().catch(console.error)
