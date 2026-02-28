// ============================================================================
// Database Types for Employee Management System
// These types mirror the Supabase database schema
// ============================================================================

// ---- Enums ----
export type UserRole = 'super_admin' | 'hr_admin' | 'manager' | 'employee'
export type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'intern'
export type WorkLocation = 'office' | 'remote' | 'hybrid'
export type EmployeeStatus = 'active' | 'on_leave' | 'probation' | 'suspended' | 'resigned' | 'terminated'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave'
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'info_requested'
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
export type ProjectHealth = 'on_track' | 'at_risk' | 'delayed'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done'
export type GoalLevel = 'company' | 'department' | 'individual'
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled'
export type ReviewType = 'self' | 'manager' | 'peer'
export type ReviewCycleType = 'quarterly' | 'half_yearly' | 'annual'
export type ReviewCycleStatus = 'draft' | 'active' | 'completed'
export type PerformanceReviewStatus = 'pending' | 'submitted' | 'finalized' | 'acknowledged'
export type SalaryComponent = 'basic' | 'hra' | 'transport' | 'special_allowance' | 'bonus' | 'pf_employer'
export type PayrollRunStatus = 'pending' | 'processing' | 'completed'
export type ReimbursementCategory = 'travel' | 'food' | 'equipment' | 'medical' | 'other'
export type ReimbursementStatus = 'pending' | 'approved' | 'rejected' | 'processed'
export type JobOpeningStatus = 'draft' | 'open' | 'paused' | 'closed'
export type CandidateSource = 'linkedin' | 'referral' | 'job_board' | 'direct' | 'other'
export type CandidateStatus = 'active' | 'rejected' | 'offer_sent' | 'offer_accepted' | 'joined' | 'withdrew'
export type InterviewRecommendation = 'strong_yes' | 'yes' | 'maybe' | 'no'
export type AnnouncementAudience = 'all' | 'department' | 'role'
export type NotificationType =
    | 'leave_request'
    | 'leave_approved'
    | 'leave_rejected'
    | 'task_assigned'
    | 'task_overdue'
    | 'payslip_uploaded'
    | 'announcement'
    | 'onboarding_task'
    | 'review_due'
export type DocumentType = 'offer_letter' | 'nda' | 'id_proof' | 'certificate' | 'other'
export type TimelineEventType = 'joined' | 'promoted' | 'transferred' | 'salary_revised' | 'warning_issued' | 'role_changed' | 'resigned' | 'terminated'
export type ProjectMemberRole = 'lead' | 'member'

// ---- Table Row Types ----

export interface CompanySettings {
    id: string
    company_name: string
    logo_storage_path: string | null
    address: string | null
    industry: string | null
    timezone: string
    currency: string
    working_days: string[]
    working_hours_per_day: number
    financial_year_start_month: number
    late_threshold_minutes: number
    min_attendance_percentage_alert: number
    two_level_leave_approval: boolean
    mfa_enforced: boolean
    allowed_office_ips: string[]
    office_geofence_lat: number | null
    office_geofence_lng: number | null
    office_geofence_radius_meters: number | null
    created_at: string
    updated_at: string
}

export interface Branch {
    id: string
    name: string
    address: string | null
    city: string | null
    country: string | null
    geofence_lat: number | null
    geofence_lng: number | null
    geofence_radius_meters: number | null
    created_at: string
}

export interface Department {
    id: string
    name: string
    head_id: string | null
    created_at: string
}

export interface Profile {
    id: string
    employee_id: string
    full_name: string
    profile_photo_url: string | null
    job_title: string | null
    department_id: string | null
    employment_type: EmploymentType
    date_of_joining: string | null
    probation_end_date: string | null
    confirmation_date: string | null
    manager_id: string | null
    work_location: WorkLocation
    branch_id: string | null
    work_email: string
    personal_email: string | null
    phone: string | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
    skills: string[]
    status: EmployeeStatus
    role: UserRole
    password_changed: boolean
    created_at: string
    updated_at: string
    // Joined fields
    department?: Department
    branch?: Branch
    manager?: Pick<Profile, 'id' | 'full_name' | 'job_title' | 'profile_photo_url'>
}

export interface EmployeeDocument {
    id: string
    employee_id: string
    document_type: DocumentType
    file_name: string
    storage_path: string
    uploaded_by: string
    uploaded_at: string
}

export interface EmployeeTimeline {
    id: string
    employee_id: string
    event_type: TimelineEventType
    description: string
    effective_date: string
    recorded_by: string
    created_at: string
    // Joined
    recorder?: Pick<Profile, 'id' | 'full_name'>
}

export interface Shift {
    id: string
    name: string
    start_time: string
    end_time: string
    department_id: string | null
    created_by: string
    created_at: string
}

export interface EmployeeShift {
    employee_id: string
    shift_id: string
    effective_from: string
    effective_to: string | null
}

export interface Attendance {
    id: string
    employee_id: string
    date: string
    check_in_time: string | null
    check_out_time: string | null
    check_in_ip: string | null
    check_in_location: string | null
    status: AttendanceStatus
    total_hours: number | null
    notes: string | null
    created_at: string
    // Joined
    employee?: Pick<Profile, 'id' | 'full_name' | 'department_id' | 'profile_photo_url' | 'job_title'>
}

export interface LeaveType {
    id: string
    name: string
    annual_quota: number
    carry_forward: boolean
    max_carry_forward_days: number
    encashable: boolean
    created_by: string
    created_at: string
}

export interface LeaveBalance {
    id: string
    employee_id: string
    leave_type_id: string
    year: number
    total_allocated: number
    used: number
    pending: number
    remaining: number
    // Joined
    leave_type?: LeaveType
}

export interface LeaveRequest {
    id: string
    employee_id: string
    leave_type_id: string
    start_date: string
    end_date: string
    total_days: number
    reason: string | null
    attachment_path: string | null
    status: LeaveRequestStatus
    manager_approval_status: string | null
    hr_approval_status: string | null
    manager_note: string | null
    hr_note: string | null
    requested_at: string
    updated_at: string
    // Joined
    employee?: Pick<Profile, 'id' | 'full_name' | 'department_id' | 'profile_photo_url'>
    leave_type?: LeaveType
}

export interface Holiday {
    id: string
    name: string
    date: string
    company_wide: boolean
    branch_id: string | null
    created_by: string
    created_at: string
}

export interface Project {
    id: string
    name: string
    description: string | null
    department_id: string | null
    lead_id: string | null
    start_date: string | null
    deadline: string | null
    priority: ProjectPriority
    status: ProjectStatus
    progress_percentage: number
    health: ProjectHealth
    created_by: string
    created_at: string
    // Joined
    lead?: Pick<Profile, 'id' | 'full_name' | 'profile_photo_url'>
    department?: Department
}

export interface ProjectMember {
    project_id: string
    employee_id: string
    role_in_project: ProjectMemberRole
    joined_at: string
    // Joined
    employee?: Pick<Profile, 'id' | 'full_name' | 'profile_photo_url' | 'job_title'>
}

export interface Task {
    id: string
    project_id: string
    parent_task_id: string | null
    title: string
    description: string | null
    assignee_id: string | null
    due_date: string | null
    priority: ProjectPriority
    status: TaskStatus
    estimated_hours: number | null
    actual_hours: number | null
    created_by: string
    created_at: string
    updated_at: string
    // Joined
    assignee?: Pick<Profile, 'id' | 'full_name' | 'profile_photo_url'>
}

export interface TaskComment {
    id: string
    task_id: string
    author_id: string
    content: string
    created_at: string
    // Joined
    author?: Pick<Profile, 'id' | 'full_name' | 'profile_photo_url'>
}

export interface TaskActivityLog {
    id: string
    task_id: string
    actor_id: string
    action: string
    old_value: string | null
    new_value: string | null
    created_at: string
}

export interface Goal {
    id: string
    title: string
    description: string | null
    owner_id: string
    parent_goal_id: string | null
    target_metric: string | null
    current_progress: number
    due_date: string | null
    status: GoalStatus
    level: GoalLevel
    created_by: string
    created_at: string
}

export interface ReviewCycle {
    id: string
    name: string
    type: ReviewCycleType
    start_date: string
    end_date: string
    status: ReviewCycleStatus
    created_by: string
    created_at: string
}

export interface ReviewForm {
    id: string
    cycle_id: string
    department_id: string | null
    questions: ReviewQuestion[]
}

export interface ReviewQuestion {
    id: string
    text: string
    type: 'rating' | 'text' | 'multiple_choice'
    options?: string[]
    required: boolean
}

export interface PerformanceReview {
    id: string
    cycle_id: string
    employee_id: string
    reviewer_id: string
    review_type: ReviewType
    form_id: string
    responses: Record<string, unknown>
    overall_rating: number | null
    status: PerformanceReviewStatus
    submitted_at: string | null
    finalized_at: string | null
    acknowledged_at: string | null
    employee_comments: string | null
    // Joined
    employee?: Pick<Profile, 'id' | 'full_name' | 'profile_photo_url' | 'job_title'>
    reviewer?: Pick<Profile, 'id' | 'full_name'>
    cycle?: Pick<ReviewCycle, 'id' | 'name' | 'type'>
}

export interface SalaryComponentRecord {
    id: string
    employee_id: string
    component_name: SalaryComponent
    amount: number
    effective_from: string
    effective_to: string | null
    created_by: string
}

export interface SalaryRevision {
    id: string
    employee_id: string
    previous_ctc: number
    new_ctc: number
    effective_date: string
    reason: string | null
    revised_by: string
}

export interface PayGrade {
    id: string
    name: string
    min_salary: number
    max_salary: number
    currency: string
    created_by: string
}

export interface PayrollRun {
    id: string
    month: string
    status: PayrollRunStatus
    processed_by: string | null
    completed_at: string | null
}

export interface Payslip {
    id: string
    employee_id: string
    payroll_run_id: string
    month: string
    gross_pay: number
    total_deductions: number
    net_pay: number
    payslip_storage_path: string | null
    generated_at: string
}

export interface Reimbursement {
    id: string
    employee_id: string
    category: ReimbursementCategory
    amount: number
    expense_date: string
    description: string | null
    receipt_storage_path: string | null
    status: ReimbursementStatus
    manager_approval_at: string | null
    finance_note: string | null
    processed_at: string | null
    created_at: string
}

export interface JobOpening {
    id: string
    title: string
    department_id: string | null
    branch_id: string | null
    employment_type: EmploymentType
    openings_count: number
    job_description: string | null
    required_skills: string[]
    status: JobOpeningStatus
    created_by: string
    created_at: string
    // Joined
    department?: Department
}

export interface Candidate {
    id: string
    job_opening_id: string
    full_name: string
    email: string
    phone: string | null
    resume_storage_path: string | null
    source: CandidateSource
    referral_employee_id: string | null
    current_stage: string | null
    overall_status: CandidateStatus
    applied_at: string
    // Joined
    job_opening?: JobOpening
}

export interface InterviewStage {
    id: string
    job_opening_id: string
    stage_name: string
    stage_order: number
    interviewer_ids: string[]
}

export interface InterviewScorecard {
    id: string
    candidate_id: string
    stage_id: string
    interviewer_id: string
    ratings: Record<string, unknown>
    overall_recommendation: InterviewRecommendation
    notes: string | null
    submitted_at: string
}

export interface OnboardingTemplate {
    id: string
    name: string
    department_id: string | null
    tasks: OnboardingTaskTemplate[]
}

export interface OnboardingTaskTemplate {
    name: string
    description: string
    assigned_role: string
    due_days_after_joining: number
}

export interface OnboardingChecklist {
    id: string
    employee_id: string
    template_id: string
    created_at: string
}

export interface OnboardingTask {
    id: string
    checklist_id: string
    task_name: string
    description: string | null
    assigned_to_id: string | null
    due_date: string | null
    completed: boolean
    completed_at: string | null
}

export interface Announcement {
    id: string
    title: string
    body: string
    attachment_storage_path: string | null
    is_pinned: boolean
    audience: AnnouncementAudience
    target_department_id: string | null
    target_role: UserRole | null
    created_by: string
    created_at: string
    // Joined
    author?: Pick<Profile, 'id' | 'full_name' | 'profile_photo_url'>
    read_status?: boolean
}

export interface AnnouncementRead {
    announcement_id: string
    employee_id: string
    read_at: string
}

export interface Policy {
    id: string
    title: string
    description: string | null
    document_storage_path: string | null
    version: string
    requires_acknowledgement: boolean
    published_by: string
    published_at: string
}

export interface PolicyAcknowledgement {
    policy_id: string
    employee_id: string
    acknowledged_at: string
}

export interface Notification {
    id: string
    recipient_id: string
    type: NotificationType
    title: string
    message: string | null
    reference_id: string | null
    reference_type: string | null
    read: boolean
    created_at: string
}

export interface AuditLog {
    id: string
    actor_id: string
    actor_name: string
    action: string
    module: string
    target_table: string
    target_id: string | null
    old_values: Record<string, unknown> | null
    new_values: Record<string, unknown> | null
    ip_address: string | null
    created_at: string
}

export interface AuthLog {
    id: string
    user_id: string | null
    email: string
    timestamp: string
    ip_address: string | null
    user_agent: string | null
    success: boolean
}

export interface NotificationSetting {
    id: string
    event_type: string
    notify_employee: boolean
    notify_manager: boolean
    notify_hr: boolean
    email_enabled: boolean
}

// ---- Supabase Database type (used by createClient<Database>) ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyInsert = Record<string, any>

export interface Database {
    public: {
        Tables: {
            company_settings: { Row: CompanySettings; Insert: AnyInsert; Update: AnyInsert }
            branches: { Row: Branch; Insert: AnyInsert; Update: AnyInsert }
            departments: { Row: Department; Insert: AnyInsert; Update: AnyInsert }
            profiles: { Row: Profile; Insert: AnyInsert; Update: AnyInsert }
            employee_documents: { Row: EmployeeDocument; Insert: AnyInsert; Update: AnyInsert }
            employee_timeline: { Row: EmployeeTimeline; Insert: AnyInsert; Update: AnyInsert }
            shifts: { Row: Shift; Insert: AnyInsert; Update: AnyInsert }
            employee_shifts: { Row: EmployeeShift; Insert: AnyInsert; Update: AnyInsert }
            attendance: { Row: Attendance; Insert: AnyInsert; Update: AnyInsert }
            leave_types: { Row: LeaveType; Insert: AnyInsert; Update: AnyInsert }
            leave_balances: { Row: LeaveBalance; Insert: AnyInsert; Update: AnyInsert }
            leave_requests: { Row: LeaveRequest; Insert: AnyInsert; Update: AnyInsert }
            holidays: { Row: Holiday; Insert: AnyInsert; Update: AnyInsert }
            projects: { Row: Project; Insert: AnyInsert; Update: AnyInsert }
            project_members: { Row: ProjectMember; Insert: AnyInsert; Update: AnyInsert }
            tasks: { Row: Task; Insert: AnyInsert; Update: AnyInsert }
            task_comments: { Row: TaskComment; Insert: AnyInsert; Update: AnyInsert }
            task_activity_log: { Row: TaskActivityLog; Insert: AnyInsert; Update: AnyInsert }
            goals: { Row: Goal; Insert: AnyInsert; Update: AnyInsert }
            review_cycles: { Row: ReviewCycle; Insert: AnyInsert; Update: AnyInsert }
            review_forms: { Row: ReviewForm; Insert: AnyInsert; Update: AnyInsert }
            performance_reviews: { Row: PerformanceReview; Insert: AnyInsert; Update: AnyInsert }
            salary_components: { Row: SalaryComponentRecord; Insert: AnyInsert; Update: AnyInsert }
            salary_revisions: { Row: SalaryRevision; Insert: AnyInsert; Update: AnyInsert }
            pay_grades: { Row: PayGrade; Insert: AnyInsert; Update: AnyInsert }
            payroll_runs: { Row: PayrollRun; Insert: AnyInsert; Update: AnyInsert }
            payslips: { Row: Payslip; Insert: AnyInsert; Update: AnyInsert }
            reimbursements: { Row: Reimbursement; Insert: AnyInsert; Update: AnyInsert }
            job_openings: { Row: JobOpening; Insert: AnyInsert; Update: AnyInsert }
            candidates: { Row: Candidate; Insert: AnyInsert; Update: AnyInsert }
            interview_stages: { Row: InterviewStage; Insert: AnyInsert; Update: AnyInsert }
            interview_scorecards: { Row: InterviewScorecard; Insert: AnyInsert; Update: AnyInsert }
            onboarding_templates: { Row: OnboardingTemplate; Insert: AnyInsert; Update: AnyInsert }
            onboarding_checklists: { Row: OnboardingChecklist; Insert: AnyInsert; Update: AnyInsert }
            onboarding_tasks: { Row: OnboardingTask; Insert: AnyInsert; Update: AnyInsert }
            announcements: { Row: Announcement; Insert: AnyInsert; Update: AnyInsert }
            announcement_reads: { Row: AnnouncementRead; Insert: AnyInsert; Update: AnyInsert }
            policies: { Row: Policy; Insert: AnyInsert; Update: AnyInsert }
            policy_acknowledgements: { Row: PolicyAcknowledgement; Insert: AnyInsert; Update: AnyInsert }
            notifications: { Row: Notification; Insert: AnyInsert; Update: AnyInsert }
            audit_logs: { Row: AuditLog; Insert: AnyInsert; Update: AnyInsert }
            auth_logs: { Row: AuthLog; Insert: AnyInsert; Update: AnyInsert }
            notification_settings: { Row: NotificationSetting; Insert: AnyInsert; Update: AnyInsert }
        }
        Functions: {
            get_headcount_report: { Args: Record<string, unknown>; Returns: unknown }
            get_attrition_report: { Args: { start_date: string; end_date: string }; Returns: unknown }
            get_attendance_summary: { Args: { target_month: number; target_year: number }; Returns: unknown }
            get_leave_utilization: { Args: { target_year: number }; Returns: unknown }
            get_payroll_summary: { Args: { target_month: number; target_year: number }; Returns: unknown }
            get_project_health_report: { Args: Record<string, never>; Returns: unknown }
            get_hiring_funnel: { Args: { start_date: string; end_date: string }; Returns: unknown }
            log_audit_event: {
                Args: {
                    p_actor_id: string
                    p_action: string
                    p_module: string
                    p_target_table: string
                    p_target_id: string
                    p_old_values: Record<string, unknown> | null
                    p_new_values: Record<string, unknown> | null
                }
                Returns: void
            }
        }
        Enums: {
            user_role: UserRole
            employment_type: EmploymentType
            work_location: WorkLocation
            employee_status: EmployeeStatus
            attendance_status: AttendanceStatus
            leave_request_status: LeaveRequestStatus
            project_status: ProjectStatus
            project_health: ProjectHealth
            project_priority: ProjectPriority
            task_status: TaskStatus
        }
    }
}

// ---- API Response type ----
export interface ApiResponse<T = unknown> {
    success: boolean
    data: T | null
    message: string
}

// ---- Pagination ----
export interface PaginationParams {
    page: number
    pageSize: number
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}
