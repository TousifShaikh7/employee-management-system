/**
 * Seed projects and tasks — runs after seed-mock-data.ts
 * Usage: npx dotenv -e .env.local -- npx tsx scripts/seed-projects.ts
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
})

function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function dateStr(d: Date) { return d.toISOString().split('T')[0] }
function pastDate(daysAgo: number) { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d }

async function main() {
    console.log('📁 Fetching existing profiles & departments...')

    // Get all profiles
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, role, department_id, job_title')
    if (!profiles || profiles.length === 0) { console.error('❌ No profiles found!'); return }
    console.log(`   Found ${profiles.length} profiles`)

    // Get all departments
    const { data: departments } = await supabase.from('departments').select('id, name')
    if (!departments) { console.error('❌ No departments found!'); return }
    const deptMap: Record<string, string> = {}
    for (const d of departments) deptMap[d.name] = d.id
    console.log(`   Found ${departments.length} departments`)

    // Map profiles by department
    const getProfilesByDept = (deptName: string) => profiles.filter(p => p.department_id === deptMap[deptName])
    const getManagerForDept = (deptName: string) => {
        const deptProfiles = getProfilesByDept(deptName)
        return deptProfiles.find(p => p.role === 'manager' || p.role === 'super_admin' || p.role === 'hr_admin') || profiles[0]
    }
    const adminProfile = profiles.find(p => p.role === 'super_admin') || profiles[0]

    // Delete existing projects
    await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('   ✅ Cleaned existing projects')

    // Create projects
    const projectsData = [
        { name: 'Customer Portal Redesign', desc: 'Complete redesign of the customer-facing portal with modern React components, improved performance, and mobile-first approach', dept: 'Engineering', status: 'active', progress: 65, health: 'on_track', priority: 'high' },
        { name: 'Mobile App v2.0', desc: 'Native mobile app rewrite using React Native with offline-first architecture and push notifications', dept: 'Engineering', status: 'active', progress: 40, health: 'at_risk', priority: 'critical' },
        { name: 'HR Policy Automation', desc: 'Automate onboarding workflows, leave approval chains, and compliance documentation', dept: 'Human Resources', status: 'planning', progress: 10, health: 'on_track', priority: 'medium' },
        { name: 'Brand Identity Refresh', desc: 'Complete brand overhaul including new logo, color palette, typography, and marketing collaterals', dept: 'Design', status: 'active', progress: 80, health: 'on_track', priority: 'medium' },
        { name: 'Data Analytics Dashboard', desc: 'Real-time business analytics platform with interactive charts, custom reports, and automated alerts', dept: 'Product', status: 'active', progress: 55, health: 'delayed', priority: 'high' },
        { name: 'GST Compliance Module', desc: 'Automated GST filing, reconciliation, and e-invoicing integration for seamless tax compliance', dept: 'Finance', status: 'completed', progress: 100, health: 'on_track', priority: 'high' },
        { name: 'SEO Optimization Sprint', desc: 'Improve organic search rankings through technical SEO, content optimization, and Core Web Vitals', dept: 'Marketing', status: 'active', progress: 30, health: 'on_track', priority: 'low' },
        { name: 'Cloud Migration to AWS', desc: 'Migrate on-premise infrastructure to AWS with zero-downtime strategy and cost optimization', dept: 'Engineering', status: 'on_hold', progress: 20, health: 'at_risk', priority: 'critical' },
    ]

    const projectIds: string[] = []
    for (const p of projectsData) {
        const lead = getManagerForDept(p.dept)
        const startDate = pastDate(randomInt(30, 180))
        const deadline = new Date(startDate); deadline.setDate(deadline.getDate() + randomInt(60, 180))

        const { data, error } = await supabase.from('projects').insert({
            name: p.name, description: p.desc,
            department_id: deptMap[p.dept], lead_id: lead.id,
            start_date: dateStr(startDate), deadline: dateStr(deadline),
            priority: p.priority, status: p.status,
            progress_percentage: p.progress, health: p.health,
            created_by: adminProfile.id,
        }).select('id').single()

        if (error) {
            console.error(`   ❌ Project "${p.name}": ${error.message}`)
            continue
        }
        projectIds.push(data.id)
        console.log(`   ✅ ${p.name}`)

        // Add members from the department
        const deptMembers = getProfilesByDept(p.dept)
        for (const member of deptMembers) {
            await supabase.from('project_members').upsert({
                project_id: data.id, employee_id: member.id,
                role_in_project: member.id === lead.id ? 'lead' : 'member',
            }, { onConflict: 'project_id,employee_id' })
        }
    }
    console.log(`\n📋 Creating tasks for ${projectIds.length} projects...`)

    const taskTitles: Record<number, string[]> = {
        0: ['Setup project repository & CI/CD', 'Design database schema', 'Implement authentication flow', 'Build REST API endpoints', 'Create dashboard components', 'Write integration tests', 'Performance optimization', 'Deploy to staging environment'],
        1: ['Initialize React Native project', 'Implement offline-first storage', 'Build navigation architecture', 'Setup push notification service', 'Design onboarding flow screens', 'Integrate payment gateway', 'Build background sync service'],
        2: ['Document current HR processes', 'Map leave approval workflow', 'Design onboarding checklist system', 'Create policy acknowledgement templates', 'Build automated email notifications'],
        3: ['Brand audit & competitor analysis', 'Design new logo concepts', 'Create updated brand guidelines PDF', 'Build social media template library', 'Design email marketing templates', 'Create presentation templates'],
        4: ['Setup Metabase instance', 'Configure data warehouse connections', 'Design executive dashboard', 'Build sales analytics report', 'Create user engagement metrics', 'Implement automated alerts'],
        5: ['Research GST API documentation', 'Build GSTIN validation module', 'Implement e-invoice generation', 'Create GST return filing flow', 'Build reconciliation report'],
        6: ['Technical SEO audit', 'Fix Core Web Vitals issues', 'Content gap analysis', 'Build internal linking strategy', 'Optimize meta descriptions'],
        7: ['Cloud architecture assessment', 'Design migration plan', 'Setup AWS VPC & networking', 'Configure CI/CD pipelines', 'Database migration strategy', 'Load testing on cloud'],
    }

    const taskStatuses = ['todo', 'in_progress', 'in_review', 'done', 'done'] as const
    const taskPriorities = ['low', 'medium', 'high', 'medium', 'critical'] as const

    for (let pi = 0; pi < projectIds.length; pi++) {
        const tasks = taskTitles[pi] || []
        const deptName = projectsData[pi].dept
        const deptMembers = getProfilesByDept(deptName)

        for (const title of tasks) {
            const assignee = deptMembers.length > 0 ? randomItem(deptMembers) : adminProfile

            await supabase.from('tasks').insert({
                project_id: projectIds[pi], title,
                description: `Implementation task: ${title} for the ${projectsData[pi].name} project`,
                assignee_id: assignee.id,
                due_date: dateStr(pastDate(-randomInt(5, 45))),
                priority: randomItem([...taskPriorities]),
                status: randomItem([...taskStatuses]),
                estimated_hours: randomInt(4, 40),
                actual_hours: randomInt(0, 35),
                created_by: getManagerForDept(deptName).id,
            })
        }
        console.log(`   ✅ ${tasks.length} tasks for "${projectsData[pi].name}"`)
    }

    console.log('\n🎉 Projects & Tasks seeded successfully!')
    console.log(`   📁 ${projectIds.length} projects`)
    console.log(`   📋 ${Object.values(taskTitles).flat().length} tasks`)
}

main().catch(console.error)
