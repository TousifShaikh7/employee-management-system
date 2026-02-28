/**
 * Comprehensive seed script with Indian mock employee data.
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/seed-mock-data.ts
 *
 * Creates:
 *   - Company settings, branches, departments
 *   - 25 employees (auth + profiles) across roles
 *   - Shifts, leave types, leave balances
 *   - Attendance records (last 30 days)
 *   - Leave requests
 *   - Projects, tasks, project members
 *   - Goals, review cycles, performance reviews
 *   - Salary components, payroll runs, payslips
 *   - Job openings, candidates
 *   - Announcements, policies
 *   - Holidays
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
})

// ---- Helper ----
function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}
function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}
function uuid() {
    return crypto.randomUUID()
}
function dateStr(d: Date) {
    return d.toISOString().split('T')[0]
}
function pastDate(daysAgo: number) {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d
}

// ---- Data definitions ----

const EMPLOYEES = [
    // Super Admin (already exists — will skip if present)
    { name: 'Rajesh Kumar', email: 'rajesh.kumar@techcorp.in', role: 'super_admin' as const, title: 'Chief Executive Officer', dept: 'Leadership' },
    // HR Admins
    { name: 'Priya Sharma', email: 'priya.sharma@techcorp.in', role: 'hr_admin' as const, title: 'HR Director', dept: 'Human Resources' },
    { name: 'Ananya Reddy', email: 'ananya.reddy@techcorp.in', role: 'hr_admin' as const, title: 'HR Manager', dept: 'Human Resources' },
    // Managers
    { name: 'Vikram Singh', email: 'vikram.singh@techcorp.in', role: 'manager' as const, title: 'Engineering Manager', dept: 'Engineering' },
    { name: 'Deepika Patel', email: 'deepika.patel@techcorp.in', role: 'manager' as const, title: 'Design Lead', dept: 'Design' },
    { name: 'Arjun Nair', email: 'arjun.nair@techcorp.in', role: 'manager' as const, title: 'Product Manager', dept: 'Product' },
    { name: 'Sneha Iyer', email: 'sneha.iyer@techcorp.in', role: 'manager' as const, title: 'Finance Manager', dept: 'Finance' },
    { name: 'Karthik Menon', email: 'karthik.menon@techcorp.in', role: 'manager' as const, title: 'Marketing Head', dept: 'Marketing' },
    // Employees - Engineering
    { name: 'Rahul Verma', email: 'rahul.verma@techcorp.in', role: 'employee' as const, title: 'Senior Software Engineer', dept: 'Engineering' },
    { name: 'Neha Gupta', email: 'neha.gupta@techcorp.in', role: 'employee' as const, title: 'Software Engineer', dept: 'Engineering' },
    { name: 'Aditya Joshi', email: 'aditya.joshi@techcorp.in', role: 'employee' as const, title: 'Backend Developer', dept: 'Engineering' },
    { name: 'Kavitha Subramaniam', email: 'kavitha.s@techcorp.in', role: 'employee' as const, title: 'Frontend Developer', dept: 'Engineering' },
    { name: 'Rohit Choudhury', email: 'rohit.c@techcorp.in', role: 'employee' as const, title: 'DevOps Engineer', dept: 'Engineering' },
    { name: 'Meera Krishnan', email: 'meera.k@techcorp.in', role: 'employee' as const, title: 'QA Engineer', dept: 'Engineering' },
    // Employees - Design
    { name: 'Ishaan Malhotra', email: 'ishaan.m@techcorp.in', role: 'employee' as const, title: 'UI/UX Designer', dept: 'Design' },
    { name: 'Tanvi Deshmukh', email: 'tanvi.d@techcorp.in', role: 'employee' as const, title: 'Graphic Designer', dept: 'Design' },
    // Employees - Product
    { name: 'Siddharth Rao', email: 'siddharth.r@techcorp.in', role: 'employee' as const, title: 'Product Analyst', dept: 'Product' },
    { name: 'Pooja Bhatt', email: 'pooja.b@techcorp.in', role: 'employee' as const, title: 'Business Analyst', dept: 'Product' },
    // Employees - Finance
    { name: 'Amit Saxena', email: 'amit.s@techcorp.in', role: 'employee' as const, title: 'Accountant', dept: 'Finance' },
    { name: 'Divya Pillai', email: 'divya.p@techcorp.in', role: 'employee' as const, title: 'Financial Analyst', dept: 'Finance' },
    // Employees - Marketing
    { name: 'Varun Kapoor', email: 'varun.k@techcorp.in', role: 'employee' as const, title: 'Content Strategist', dept: 'Marketing' },
    { name: 'Shruti Agarwal', email: 'shruti.a@techcorp.in', role: 'employee' as const, title: 'SEO Specialist', dept: 'Marketing' },
    // HR employees
    { name: 'Ritu Mehta', email: 'ritu.m@techcorp.in', role: 'employee' as const, title: 'HR Executive', dept: 'Human Resources' },
    // Interns
    { name: 'Ayush Pandey', email: 'ayush.p@techcorp.in', role: 'employee' as const, title: 'Engineering Intern', dept: 'Engineering' },
    { name: 'Nisha Tiwari', email: 'nisha.t@techcorp.in', role: 'employee' as const, title: 'Design Intern', dept: 'Design' },
]

const DEFAULT_PASSWORD = 'Employee@123'

async function main() {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.error('❌ Missing env vars. Run with: npx dotenv -e .env.local -- npx tsx scripts/seed-mock-data.ts')
        process.exit(1)
    }

    console.log('🚀 Starting comprehensive mock data seed...\n')

    // ============================================================
    // 1. COMPANY SETTINGS
    // ============================================================
    console.log('🏢 Creating company settings...')
    const { data: existingSettings } = await supabase.from('company_settings').select('id').limit(1).maybeSingle()
    let companyId: string
    if (existingSettings) {
        companyId = existingSettings.id
        console.log('   ⚠️  Company settings already exist, skipping.')
    } else {
        const { data: cs } = await supabase.from('company_settings').insert({
            company_name: 'TechCorp India Pvt. Ltd.',
            address: '91 Cyber Park, Whitefield, Bengaluru, Karnataka 560066',
            industry: 'Information Technology',
            timezone: 'Asia/Kolkata',
            currency: 'INR',
            working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            working_hours_per_day: 9,
            financial_year_start_month: 4,
            late_threshold_minutes: 15,
            min_attendance_percentage_alert: 75,
            two_level_leave_approval: true,
        }).select('id').single()
        companyId = cs!.id
        console.log('   ✅ Company settings created.')
    }

    // ============================================================
    // 2. BRANCHES
    // ============================================================
    console.log('🏗️  Creating branches...')
    const branchData = [
        { name: 'Bengaluru HQ', city: 'Bengaluru', country: 'India', address: '91 Cyber Park, Whitefield' },
        { name: 'Mumbai Office', city: 'Mumbai', country: 'India', address: 'Bandra Kurla Complex, BKC' },
        { name: 'Delhi NCR', city: 'Gurugram', country: 'India', address: 'DLF Cyber City, Sector 24' },
    ]
    const branchIds: string[] = []
    for (const b of branchData) {
        const { data: existing } = await supabase.from('branches').select('id').eq('name', b.name).maybeSingle()
        if (existing) {
            branchIds.push(existing.id)
        } else {
            const { data } = await supabase.from('branches').insert(b).select('id').single()
            branchIds.push(data!.id)
        }
    }
    console.log(`   ✅ ${branchIds.length} branches ready.`)

    // ============================================================
    // 3. DEPARTMENTS
    // ============================================================
    console.log('🏛️  Creating departments...')
    const deptNames = ['Leadership', 'Human Resources', 'Engineering', 'Design', 'Product', 'Finance', 'Marketing']
    const deptMap: Record<string, string> = {}
    for (const name of deptNames) {
        const { data: existing } = await supabase.from('departments').select('id').eq('name', name).maybeSingle()
        if (existing) {
            deptMap[name] = existing.id
        } else {
            const { data } = await supabase.from('departments').insert({ name }).select('id').single()
            deptMap[name] = data!.id
        }
    }
    console.log(`   ✅ ${Object.keys(deptMap).length} departments ready.`)

    // ============================================================
    // 4. SHIFTS
    // ============================================================
    console.log('⏰ Creating shifts...')
    const shifts = [
        { name: 'General Shift', start_time: '09:00:00', end_time: '18:00:00' },
        { name: 'Early Shift', start_time: '07:00:00', end_time: '16:00:00' },
        { name: 'Late Shift', start_time: '12:00:00', end_time: '21:00:00' },
    ]
    const shiftIds: string[] = []
    for (const s of shifts) {
        const { data: existing } = await supabase.from('shifts').select('id').eq('name', s.name).maybeSingle()
        if (existing) {
            shiftIds.push(existing.id)
        } else {
            const { data } = await supabase.from('shifts').insert(s).select('id').single()
            shiftIds.push(data!.id)
        }
    }
    console.log(`   ✅ ${shiftIds.length} shifts ready.`)

    // ============================================================
    // 5. LEAVE TYPES
    // ============================================================
    console.log('🏖️  Creating leave types...')
    const leaveTypeData = [
        { name: 'Casual Leave', annual_quota: 12, carry_forward: false, encashable: false },
        { name: 'Sick Leave', annual_quota: 10, carry_forward: false, encashable: false },
        { name: 'Earned Leave', annual_quota: 15, carry_forward: true, max_carry_forward_days: 30, encashable: true },
        { name: 'Maternity Leave', annual_quota: 182, carry_forward: false, encashable: false },
        { name: 'Paternity Leave', annual_quota: 15, carry_forward: false, encashable: false },
        { name: 'Compensatory Off', annual_quota: 0, carry_forward: false, encashable: false },
    ]
    const leaveTypeMap: Record<string, string> = {}
    for (const lt of leaveTypeData) {
        const { data: existing } = await supabase.from('leave_types').select('id').eq('name', lt.name).maybeSingle()
        if (existing) {
            leaveTypeMap[lt.name] = existing.id
        } else {
            const { data } = await supabase.from('leave_types').insert(lt).select('id').single()
            leaveTypeMap[lt.name] = data!.id
        }
    }
    console.log(`   ✅ ${Object.keys(leaveTypeMap).length} leave types ready.`)

    // ============================================================
    // 6. EMPLOYEES (Auth + Profiles)
    // ============================================================
    console.log('👥 Creating employees...')
    const profileIds: string[] = []
    const employmentTypes = ['full_time', 'full_time', 'full_time', 'full_time', 'contract'] as const
    const locations = ['office', 'remote', 'hybrid', 'office', 'office'] as const
    const indianPhones = ['+91 98765 43210', '+91 87654 32109', '+91 76543 21098', '+91 99887 76655', '+91 88776 65544']

    for (let i = 0; i < EMPLOYEES.length; i++) {
        const emp = EMPLOYEES[i]

        // Check if profile email already exists
        const { data: existingProfile } = await supabase.from('profiles').select('id').eq('work_email', emp.email).maybeSingle()
        if (existingProfile) {
            profileIds.push(existingProfile.id)
            console.log(`   ⚠️  ${emp.name} already exists, skipping.`)
            continue
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: emp.email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
        })

        if (authError) {
            // If user exists but profile doesn't, find them
            if (authError.message.includes('already been registered')) {
                const { data: { users } } = await supabase.auth.admin.listUsers()
                const existing = users?.find(u => u.email === emp.email)
                if (existing) {
                    const joinDate = pastDate(randomInt(90, 800))
                    await supabase.from('profiles').insert({
                        id: existing.id,
                        employee_id: `EMP${String(i + 1).padStart(3, '0')}`,
                        full_name: emp.name,
                        work_email: emp.email,
                        personal_email: emp.email.replace('@techcorp.in', '@gmail.com'),
                        job_title: emp.title,
                        department_id: deptMap[emp.dept],
                        role: emp.role,
                        employment_type: randomItem([...employmentTypes]),
                        work_location: randomItem([...locations]),
                        branch_id: randomItem(branchIds),
                        date_of_joining: dateStr(joinDate),
                        phone: randomItem(indianPhones),
                        skills: randomItem([['React', 'Node.js', 'TypeScript'], ['Python', 'Django', 'AWS'], ['Figma', 'Sketch', 'CSS'], ['Excel', 'SAP', 'Tally'], ['SEO', 'Google Ads', 'Analytics']]),
                        status: randomItem(['active', 'active', 'active', 'active', 'probation'] as const),
                        password_changed: true,
                    })
                    profileIds.push(existing.id)
                    console.log(`   ✅ ${emp.name} (profile linked to existing auth)`)
                    continue
                }
            }
            console.error(`   ❌ Error for ${emp.name}: ${authError.message}`)
            continue
        }

        const userId = authData.user.id
        const joinDate = pastDate(randomInt(90, 800))

        await supabase.from('profiles').insert({
            id: userId,
            employee_id: `EMP${String(i + 1).padStart(3, '0')}`,
            full_name: emp.name,
            work_email: emp.email,
            personal_email: emp.email.replace('@techcorp.in', '@gmail.com'),
            job_title: emp.title,
            department_id: deptMap[emp.dept],
            role: emp.role,
            employment_type: i >= 23 ? 'intern' : randomItem([...employmentTypes]),
            work_location: randomItem([...locations]),
            branch_id: randomItem(branchIds),
            date_of_joining: dateStr(joinDate),
            phone: randomItem(indianPhones),
            emergency_contact_name: randomItem(['Suresh Kumar', 'Lakshmi Devi', 'Ramesh Prasad', 'Sunita Sharma']),
            emergency_contact_phone: '+91 99001 10022',
            skills: randomItem([['React', 'Node.js', 'TypeScript'], ['Python', 'Django', 'AWS'], ['Figma', 'Sketch', 'CSS'], ['Excel', 'SAP', 'Tally'], ['SEO', 'Google Ads', 'Analytics']]),
            status: randomItem(['active', 'active', 'active', 'active', 'probation'] as const),
            password_changed: true,
        })

        profileIds.push(userId)
        console.log(`   ✅ ${emp.name} (${emp.role})`)
    }
    console.log(`   📊 Total profiles: ${profileIds.length}`)

    // Set managers (dept heads)
    const engMgr = profileIds[3] // Vikram Singh
    const designMgr = profileIds[4]
    const prodMgr = profileIds[5]
    const finMgr = profileIds[6]
    const mktMgr = profileIds[7]

    // Set department heads
    await supabase.from('departments').update({ head_id: profileIds[0] }).eq('name', 'Leadership')
    await supabase.from('departments').update({ head_id: profileIds[1] }).eq('name', 'Human Resources')
    await supabase.from('departments').update({ head_id: engMgr }).eq('name', 'Engineering')
    await supabase.from('departments').update({ head_id: designMgr }).eq('name', 'Design')
    await supabase.from('departments').update({ head_id: prodMgr }).eq('name', 'Product')
    await supabase.from('departments').update({ head_id: finMgr }).eq('name', 'Finance')
    await supabase.from('departments').update({ head_id: mktMgr }).eq('name', 'Marketing')

    // Set manager_id on employee profiles
    const mgrMap: Record<string, string> = {
        Engineering: engMgr, Design: designMgr, Product: prodMgr, Finance: finMgr, Marketing: mktMgr,
        'Human Resources': profileIds[1], Leadership: profileIds[0],
    }
    for (let i = 0; i < EMPLOYEES.length; i++) {
        const mgr = mgrMap[EMPLOYEES[i].dept]
        if (mgr && profileIds[i] !== mgr) {
            await supabase.from('profiles').update({ manager_id: mgr }).eq('id', profileIds[i])
        }
    }
    console.log('   ✅ Department heads & managers set.')

    // ============================================================
    // 7. LEAVE BALANCES
    // ============================================================
    console.log('📋 Creating leave balances...')
    const year = 2026
    let balanceCount = 0
    for (const pid of profileIds) {
        for (const [ltName, ltId] of Object.entries(leaveTypeMap)) {
            if (ltName === 'Maternity Leave' || ltName === 'Paternity Leave' || ltName === 'Compensatory Off') continue
            const used = randomInt(0, 5)
            const pending = randomInt(0, 2)
            const quota = ltName === 'Casual Leave' ? 12 : ltName === 'Sick Leave' ? 10 : 15
            const { error } = await supabase.from('leave_balances').upsert({
                employee_id: pid, leave_type_id: ltId, year,
                total_allocated: quota, used, pending,
            }, { onConflict: 'employee_id,leave_type_id,year' })
            if (!error) balanceCount++
        }
    }
    console.log(`   ✅ ${balanceCount} leave balances created.`)

    // ============================================================
    // 8. ATTENDANCE (last 30 days)
    // ============================================================
    console.log('📅 Creating attendance records...')
    let attendanceCount = 0
    const statuses = ['present', 'present', 'present', 'present', 'late', 'half_day'] as const
    for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
        const d = pastDate(dayOffset)
        const dayOfWeek = d.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) continue // Skip weekends

        for (const pid of profileIds) {
            if (Math.random() < 0.1) continue // ~10% absent
            const status = randomItem([...statuses])
            const checkInHour = 8 + randomInt(0, 2)
            const checkInMin = randomInt(0, 59)
            const checkIn = new Date(d); checkIn.setHours(checkInHour, checkInMin)
            const checkOut = new Date(d); checkOut.setHours(checkInHour + randomInt(8, 10), randomInt(0, 59))

            await supabase.from('attendance').upsert({
                employee_id: pid,
                date: dateStr(d),
                check_in_time: checkIn.toISOString(),
                check_out_time: status === 'half_day' ? null : checkOut.toISOString(),
                status,
                total_hours: status === 'half_day' ? 4.5 : parseFloat((randomInt(75, 100) / 10).toFixed(1)),
                notes: status === 'late' ? 'Traffic delay' : null,
            }, { onConflict: 'employee_id,date' })
            attendanceCount++
        }
    }
    console.log(`   ✅ ${attendanceCount} attendance records created.`)

    // ============================================================
    // 9. LEAVE REQUESTS
    // ============================================================
    console.log('✈️  Creating leave requests...')
    const leaveStatuses = ['pending', 'approved', 'approved', 'approved', 'rejected'] as const
    let leaveCount = 0
    for (let i = 0; i < 20; i++) {
        const pid = randomItem(profileIds)
        const ltId = randomItem([leaveTypeMap['Casual Leave'], leaveTypeMap['Sick Leave'], leaveTypeMap['Earned Leave']])
        const startDateObj = pastDate(randomInt(1, 60))
        const totalDays = randomInt(1, 5)
        const endDateObj = new Date(startDateObj); endDateObj.setDate(endDateObj.getDate() + totalDays - 1)
        const status = randomItem([...leaveStatuses])

        const { error } = await supabase.from('leave_requests').insert({
            employee_id: pid, leave_type_id: ltId,
            start_date: dateStr(startDateObj), end_date: dateStr(endDateObj),
            total_days: totalDays,
            reason: randomItem([
                'Family function in hometown',
                'Not feeling well, need rest',
                'Personal work — bank and passport',
                'Visiting parents in Jaipur',
                'Doctor appointment and follow-up',
                'Sister\'s wedding in Chennai',
                'Annual vacation to Kerala',
                'Mental health day',
            ]),
            status,
            manager_approval_status: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : null,
            manager_note: status === 'rejected' ? 'Team has a critical deadline this week' : null,
        })
        if (!error) leaveCount++
    }
    console.log(`   ✅ ${leaveCount} leave requests created.`)

    // ============================================================
    // 10. PROJECTS & TASKS
    // ============================================================
    console.log('📁 Creating projects & tasks...')
    const projectsData = [
        { name: 'Customer Portal Redesign', desc: 'Complete redesign of the customer-facing portal for better UX and performance', dept: 'Engineering', status: 'active', progress: 65, health: 'on_track', priority: 'high' },
        { name: 'Mobile App v2.0', desc: 'Native mobile app rewrite using React Native with offline support', dept: 'Engineering', status: 'active', progress: 40, health: 'at_risk', priority: 'critical' },
        { name: 'HR Policy Automation', desc: 'Automate onboarding, leave approval, and compliance workflows', dept: 'Human Resources', status: 'planning', progress: 10, health: 'on_track', priority: 'medium' },
        { name: 'Brand Identity Refresh', desc: 'Update brand guidelines, logo, and marketing collaterals', dept: 'Design', status: 'active', progress: 80, health: 'on_track', priority: 'medium' },
        { name: 'Data Analytics Dashboard', desc: 'Real-time analytics platform for business insights using Metabase', dept: 'Product', status: 'active', progress: 55, health: 'delayed', priority: 'high' },
        { name: 'GST Compliance Module', desc: 'Automated GST filing and reconciliation for finance team', dept: 'Finance', status: 'completed', progress: 100, health: 'on_track', priority: 'high' },
        { name: 'SEO Optimization Sprint', desc: 'Improve organic search rankings and site performance scores', dept: 'Marketing', status: 'active', progress: 30, health: 'on_track', priority: 'low' },
        { name: 'Cloud Migration', desc: 'Migrate on-premise infrastructure to AWS with zero downtime', dept: 'Engineering', status: 'on_hold', progress: 20, health: 'at_risk', priority: 'critical' },
    ]

    const projectIds: string[] = []
    for (const p of projectsData) {
        const leadId = mgrMap[p.dept] || profileIds[0]
        const startDate = pastDate(randomInt(30, 180))
        const deadline = new Date(startDate); deadline.setDate(deadline.getDate() + randomInt(60, 180))

        const { data, error } = await supabase.from('projects').insert({
            name: p.name, description: p.desc,
            department_id: deptMap[p.dept], lead_id: leadId,
            start_date: dateStr(startDate), deadline: dateStr(deadline),
            priority: p.priority, status: p.status,
            progress_percentage: p.progress, health: p.health,
            created_by: profileIds[0],
        }).select('id').single()

        if (error) { console.error(`   ❌ Project ${p.name}: ${error.message}`); continue }
        projectIds.push(data.id)

        // Add members
        const deptEmployees = EMPLOYEES.map((e, idx) => ({ ...e, id: profileIds[idx] })).filter(e => e.dept === p.dept)
        for (const member of deptEmployees) {
            await supabase.from('project_members').upsert({
                project_id: data.id, employee_id: member.id,
                role_in_project: member.id === leadId ? 'lead' : 'member',
            }, { onConflict: 'project_id,employee_id' })
        }
    }
    console.log(`   ✅ ${projectIds.length} projects created.`)

    // Tasks for first 4 projects
    const taskTitles = [
        ['Setup project repo', 'Design database schema', 'Implement auth flow', 'Build API endpoints', 'Create dashboard UI', 'Write unit tests', 'Performance optimization', 'Deploy to staging'],
        ['Setup React Native project', 'Implement offline storage', 'Build navigation stack', 'Create push notification service', 'Design onboarding screens', 'Integrate payment gateway'],
        ['Document current HR processes', 'Map leave approval workflow', 'Design onboarding checklist UI', 'Create policy templates'],
        ['Brand audit', 'Design new logo concepts', 'Update brand guidelines PDF', 'Create social media templates', 'Design email templates'],
    ]
    const taskStatuses = ['todo', 'in_progress', 'in_review', 'done', 'done'] as const
    const taskPriorities = ['low', 'medium', 'high', 'medium', 'critical'] as const

    for (let pi = 0; pi < Math.min(4, projectIds.length); pi++) {
        const tasks = taskTitles[pi] || []
        for (const title of tasks) {
            const deptEmps = EMPLOYEES.map((e, idx) => ({ ...e, id: profileIds[idx] })).filter(e => e.dept === projectsData[pi].dept)
            const assignee = deptEmps.length > 0 ? randomItem(deptEmps).id : profileIds[0]

            await supabase.from('tasks').insert({
                project_id: projectIds[pi], title,
                description: `Task: ${title} for ${projectsData[pi].name}`,
                assignee_id: assignee,
                due_date: dateStr(pastDate(-randomInt(5, 30))),
                priority: randomItem([...taskPriorities]),
                status: randomItem([...taskStatuses]),
                estimated_hours: randomInt(4, 40),
                actual_hours: randomInt(0, 35),
                created_by: mgrMap[projectsData[pi].dept] || profileIds[0],
            })
        }
    }
    console.log('   ✅ Tasks created for projects.')

    // ============================================================
    // 11. GOALS
    // ============================================================
    console.log('🎯 Creating goals...')
    const goalsData = [
        { title: 'Improve customer NPS by 20 points', level: 'company', progress: 45 },
        { title: 'Achieve 99.9% system uptime', level: 'department', progress: 88 },
        { title: 'Reduce employee attrition to below 10%', level: 'department', progress: 60 },
        { title: 'Launch mobile app by Q2', level: 'department', progress: 40 },
        { title: 'Complete AWS certification', level: 'individual', progress: 70 },
        { title: 'Increase organic traffic by 50%', level: 'department', progress: 35 },
        { title: 'Implement CI/CD pipeline', level: 'individual', progress: 90 },
        { title: 'Reduce page load time to under 2s', level: 'individual', progress: 55 },
        { title: 'Hire 10 engineers by March', level: 'department', progress: 30 },
        { title: 'Conduct quarterly all-hands meeting', level: 'company', progress: 100 },
    ]
    const goalStatuses = ['not_started', 'in_progress', 'in_progress', 'completed'] as const
    for (const g of goalsData) {
        const ownerId = g.level === 'company' ? profileIds[0] : randomItem(profileIds.slice(0, 8))
        await supabase.from('goals').insert({
            title: g.title, description: `OKR: ${g.title}`,
            owner_id: ownerId,
            current_progress: g.progress,
            due_date: dateStr(pastDate(-randomInt(30, 120))),
            status: g.progress >= 100 ? 'completed' : randomItem([...goalStatuses]),
            level: g.level, created_by: profileIds[0],
        })
    }
    console.log(`   ✅ ${goalsData.length} goals created.`)

    // ============================================================
    // 12. REVIEW CYCLES & PERFORMANCE REVIEWS
    // ============================================================
    console.log('⭐ Creating review cycles & reviews...')
    const { data: cycle } = await supabase.from('review_cycles').insert({
        name: 'Q4 FY2025-26 Performance Review',
        type: 'quarterly', start_date: '2026-01-01', end_date: '2026-03-31',
        status: 'active', created_by: profileIds[1],
    }).select('id').single()

    if (cycle) {
        // Create reviews for most employees
        const reviewStatuses = ['pending', 'submitted', 'submitted', 'finalized'] as const
        for (let i = 3; i < profileIds.length; i++) {
            const emp = EMPLOYEES[i]
            const reviewerId = mgrMap[emp.dept] || profileIds[1]
            const status = randomItem([...reviewStatuses])

            await supabase.from('performance_reviews').insert({
                cycle_id: cycle.id,
                employee_id: profileIds[i],
                reviewer_id: reviewerId,
                review_type: 'manager',
                overall_rating: status === 'pending' ? null : randomInt(3, 5) + Math.random() * 0.9,
                status,
                submitted_at: status !== 'pending' ? new Date().toISOString() : null,
                finalized_at: status === 'finalized' ? new Date().toISOString() : null,
            })
        }
    }
    console.log('   ✅ Review cycle & performance reviews created.')

    // ============================================================
    // 13. SALARY COMPONENTS & PAYROLL
    // ============================================================
    console.log('💰 Creating salary data & payslips...')
    const baseSalaries: Record<string, number> = {
        super_admin: 250000, hr_admin: 120000, manager: 150000, employee: 80000,
    }

    // Payroll runs
    const payrollIds: string[] = []
    for (let m = 0; m < 3; m++) {
        const monthDate = new Date(2026, m, 1)
        const { data: pr } = await supabase.from('payroll_runs').insert({
            month: dateStr(monthDate), status: m < 2 ? 'completed' : 'processing',
            processed_by: profileIds[1],
            completed_at: m < 2 ? new Date().toISOString() : null,
        }).select('id').single()
        if (pr) payrollIds.push(pr.id)
    }

    // Salary components + payslips
    for (let i = 0; i < profileIds.length; i++) {
        const base = baseSalaries[EMPLOYEES[i].role] + randomInt(-10000, 20000)
        const hra = Math.round(base * 0.4)
        const transport = 3200
        const specialAllowance = Math.round(base * 0.15)

        // Salary components
        await supabase.from('salary_components').insert([
            { employee_id: profileIds[i], component_name: 'basic', amount: base, effective_from: '2025-04-01', created_by: profileIds[1] },
            { employee_id: profileIds[i], component_name: 'hra', amount: hra, effective_from: '2025-04-01', created_by: profileIds[1] },
            { employee_id: profileIds[i], component_name: 'transport', amount: transport, effective_from: '2025-04-01', created_by: profileIds[1] },
            { employee_id: profileIds[i], component_name: 'special_allowance', amount: specialAllowance, effective_from: '2025-04-01', created_by: profileIds[1] },
        ])

        // Payslips for each completed payroll run
        for (const prId of payrollIds.slice(0, 2)) {
            const gross = base + hra + transport + specialAllowance
            const deductions = Math.round(gross * 0.2) // ~20% deductions (PF + tax)
            const net = gross - deductions
            const monthIdx = payrollIds.indexOf(prId)
            await supabase.from('payslips').insert({
                employee_id: profileIds[i], payroll_run_id: prId,
                month: dateStr(new Date(2026, monthIdx, 1)),
                gross_pay: gross, total_deductions: deductions, net_pay: net,
            })
        }
    }
    console.log('   ✅ Salary components & payslips created.')

    // ============================================================
    // 14. JOB OPENINGS & CANDIDATES
    // ============================================================
    console.log('💼 Creating job openings & candidates...')
    const openings = [
        { title: 'Senior Full Stack Developer', dept: 'Engineering', type: 'full_time', count: 3, status: 'open', skills: ['React', 'Node.js', 'PostgreSQL'] },
        { title: 'UI/UX Designer', dept: 'Design', type: 'full_time', count: 1, status: 'open', skills: ['Figma', 'Design Systems', 'Prototyping'] },
        { title: 'DevOps Engineer', dept: 'Engineering', type: 'full_time', count: 2, status: 'open', skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'] },
        { title: 'Product Manager', dept: 'Product', type: 'full_time', count: 1, status: 'paused', skills: ['Agile', 'JIRA', 'Product Strategy'] },
        { title: 'Content Writer', dept: 'Marketing', type: 'contract', count: 2, status: 'open', skills: ['SEO Writing', 'Copywriting', 'Social Media'] },
        { title: 'Data Analyst Intern', dept: 'Product', type: 'intern', count: 2, status: 'closed', skills: ['Python', 'SQL', 'Tableau'] },
    ]

    const openingIds: string[] = []
    for (const o of openings) {
        const { data } = await supabase.from('job_openings').insert({
            title: o.title, department_id: deptMap[o.dept],
            employment_type: o.type, openings_count: o.count,
            job_description: `We are looking for a talented ${o.title} to join our growing ${o.dept} team at TechCorp India. Required skills: ${o.skills.join(', ')}.`,
            required_skills: o.skills, status: o.status,
            created_by: profileIds[1],
        }).select('id').single()
        if (data) openingIds.push(data.id)
    }

    // Candidates
    const candidateNames = [
        { name: 'Anshul Khanna', email: 'anshul.k@gmail.com', source: 'linkedin' },
        { name: 'Mansi Arora', email: 'mansi.arora@gmail.com', source: 'referral' },
        { name: 'Devendra Yadav', email: 'dev.yadav@yahoo.com', source: 'job_board' },
        { name: 'Pallavi Sinha', email: 'p.sinha@outlook.com', source: 'linkedin' },
        { name: 'Tarun Grover', email: 'tarun.g@gmail.com', source: 'direct' },
        { name: 'Rashi Bansal', email: 'rashi.b@gmail.com', source: 'referral' },
        { name: 'Himanshu Rawat', email: 'himanshu.r@gmail.com', source: 'linkedin' },
        { name: 'Swati Mishra', email: 'swati.m@hotmail.com', source: 'job_board' },
        { name: 'Kunal Deshpande', email: 'kunal.d@gmail.com', source: 'direct' },
        { name: 'Aditi Chauhan', email: 'aditi.c@gmail.com', source: 'linkedin' },
        { name: 'Nikhil Bhat', email: 'nikhil.bhat@gmail.com', source: 'referral' },
        { name: 'Prerna Jha', email: 'prerna.j@gmail.com', source: 'job_board' },
    ]
    const candidateStatuses = ['active', 'active', 'active', 'rejected', 'offer_sent', 'offer_accepted'] as const
    const stages = ['Screening', 'Technical Round', 'HR Round', 'Final Round']

    for (const c of candidateNames) {
        const openingId = randomItem(openingIds.filter((_, idx) => openings[idx].status === 'open'))
        await supabase.from('candidates').insert({
            job_opening_id: openingId, full_name: c.name,
            email: c.email, phone: `+91 ${randomInt(70000, 99999)} ${randomInt(10000, 99999)}`,
            source: c.source, current_stage: randomItem(stages),
            overall_status: randomItem([...candidateStatuses]),
        })
    }
    console.log(`   ✅ ${openingIds.length} openings & ${candidateNames.length} candidates created.`)

    // ============================================================
    // 15. ANNOUNCEMENTS & POLICIES
    // ============================================================
    console.log('📢 Creating announcements & policies...')
    const announcements = [
        { title: '🎉 Holi Celebration at Office', body: 'Join us for Holi celebrations on March 14th in the cafeteria. Eco-friendly colors and special Thandai will be provided. Dress in white!', pinned: true },
        { title: 'Annual Increment Letters Released', body: 'We are pleased to announce that the annual increment letters for FY 2026-27 have been released. Please check your email for your individual letter. For any queries, reach out to the HR team.', pinned: true },
        { title: 'New Leave Policy Update', body: 'Effective April 1, 2026, the work-from-home policy has been updated. Employees can now avail up to 2 WFH days per week. Please refer to the updated policy document for detailed guidelines.', pinned: false },
        { title: 'IT Security Awareness Training', body: 'All employees are required to complete the mandatory IT Security Awareness Training by March 15th. The training module is available on the Learning Portal. This is mandatory for compliance.', pinned: false },
        { title: 'Town Hall Meeting — February Recap', body: 'Thank you all for attending the Town Hall. Key highlights: Revenue grew 28% YoY, we crossed 500+ clients, and our Bengaluru office expansion is on track for Q3.', pinned: false },
        { title: 'Employee Referral Bonus Increased!', body: 'Great news! The employee referral bonus has been increased to ₹50,000 for all engineering roles and ₹25,000 for non-engineering roles. Refer talented individuals from your network.', pinned: false },
        { title: 'Women\'s Day Celebration — March 8', body: 'TechCorp is proud to celebrate International Women\'s Day! Join us for a special panel discussion with women leaders in tech, followed by lunch. Details on Slack #events.', pinned: false },
    ]

    for (const a of announcements) {
        await supabase.from('announcements').insert({
            title: a.title, body: a.body,
            is_pinned: a.pinned, audience: 'all',
            created_by: randomItem([profileIds[0], profileIds[1]]),
        })
    }

    const policies = [
        { title: 'Employee Code of Conduct', desc: 'Company-wide code of conduct covering ethics, behavior, and professional standards expected from all employees at TechCorp India.', version: '3.1' },
        { title: 'Anti-Harassment Policy', desc: 'Zero-tolerance policy against workplace harassment, including guidelines for reporting and investigation procedures under POSH Act, 2013.', version: '2.0' },
        { title: 'Remote Work Policy', desc: 'Guidelines for employees working remotely, including expected availability hours, VPN usage, and equipment reimbursement.', version: '1.5' },
        { title: 'Data Protection & Privacy Policy', desc: 'Guidelines for handling sensitive data, GDPR & IT Act compliance, and procedures for reporting data breaches.', version: '2.2' },
        { title: 'Travel & Expense Reimbursement Policy', desc: 'Rules and limits for business travel expenses, per diem allowances, and the reimbursement claim process.', version: '4.0' },
    ]

    for (const p of policies) {
        await supabase.from('policies').insert({
            title: p.title, description: p.desc,
            version: p.version, requires_acknowledgement: true,
            published_by: profileIds[1],
        })
    }
    console.log(`   ✅ ${announcements.length} announcements & ${policies.length} policies created.`)

    // ============================================================
    // 16. HOLIDAYS
    // ============================================================
    console.log('🎊 Creating holidays...')
    const holidays = [
        { name: 'Republic Day', date: '2026-01-26' },
        { name: 'Holi', date: '2026-03-14' },
        { name: 'Good Friday', date: '2026-04-03' },
        { name: 'Eid ul-Fitr', date: '2026-03-31' },
        { name: 'Independence Day', date: '2026-08-15' },
        { name: 'Ganesh Chaturthi', date: '2026-08-27' },
        { name: 'Mahatma Gandhi Jayanti', date: '2026-10-02' },
        { name: 'Dussehra', date: '2026-10-02' },
        { name: 'Diwali', date: '2026-10-20' },
        { name: 'Diwali (Day 2)', date: '2026-10-21' },
        { name: 'Christmas', date: '2026-12-25' },
    ]
    for (const h of holidays) {
        await supabase.from('holidays').insert({
            name: h.name, date: h.date,
            company_wide: true, created_by: profileIds[1],
        })
    }
    console.log(`   ✅ ${holidays.length} holidays created.`)

    // ============================================================
    // DONE
    // ============================================================
    console.log('\n' + '='.repeat(60))
    console.log('🎉 MOCK DATA SEEDING COMPLETE!')
    console.log('='.repeat(60))
    console.log(`\n📊 Summary:`)
    console.log(`   👥 ${profileIds.length} employees created`)
    console.log(`   🏗️  ${branchIds.length} branches`)
    console.log(`   🏛️  ${Object.keys(deptMap).length} departments`)
    console.log(`   📅 ${attendanceCount} attendance records`)
    console.log(`   ✈️  ${leaveCount} leave requests`)
    console.log(`   📁 ${projectIds.length} projects with tasks`)
    console.log(`   🎯 ${goalsData.length} goals`)
    console.log(`   💰 ${payrollIds.length} payroll runs with payslips`)
    console.log(`   💼 ${openingIds.length} job openings`)
    console.log(`   📢 ${announcements.length} announcements`)
    console.log(`   📜 ${policies.length} policies`)
    console.log(`   🎊 ${holidays.length} holidays`)
    console.log(`\n🔑 All employees can login with password: ${DEFAULT_PASSWORD}`)
    console.log(`   Super Admin: ${EMPLOYEES[0].email}`)
    console.log(`   HR Admin:    ${EMPLOYEES[1].email}`)
    console.log(`   Manager:     ${EMPLOYEES[3].email}`)
    console.log(`   Employee:    ${EMPLOYEES[8].email}`)
}

main().catch(console.error)
