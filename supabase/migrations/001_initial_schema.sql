-- ============================================================================
-- Employee Management System — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================
CREATE TYPE user_role AS ENUM ('super_admin', 'hr_admin', 'manager', 'employee');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contractor', 'intern');
CREATE TYPE work_location AS ENUM ('office', 'remote', 'hybrid');
CREATE TYPE employee_status AS ENUM ('active', 'on_leave', 'probation', 'suspended', 'resigned', 'terminated');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'half_day', 'on_leave');
CREATE TYPE leave_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'info_requested');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE project_health AS ENUM ('on_track', 'at_risk', 'delayed');
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'in_review', 'blocked', 'done');
CREATE TYPE goal_level AS ENUM ('company', 'department', 'individual');
CREATE TYPE goal_status AS ENUM ('not_started', 'in_progress', 'completed', 'cancelled');
CREATE TYPE review_type AS ENUM ('self', 'manager', 'peer');
CREATE TYPE review_cycle_type AS ENUM ('quarterly', 'half_yearly', 'annual');
CREATE TYPE review_cycle_status AS ENUM ('draft', 'active', 'completed');
CREATE TYPE performance_review_status AS ENUM ('pending', 'submitted', 'finalized', 'acknowledged');
CREATE TYPE salary_component_type AS ENUM ('basic', 'hra', 'transport', 'special_allowance', 'bonus', 'pf_employer');
CREATE TYPE payroll_run_status AS ENUM ('pending', 'processing', 'completed');
CREATE TYPE reimbursement_category AS ENUM ('travel', 'food', 'equipment', 'medical', 'other');
CREATE TYPE reimbursement_status AS ENUM ('pending', 'approved', 'rejected', 'processed');
CREATE TYPE job_opening_status AS ENUM ('draft', 'open', 'paused', 'closed');
CREATE TYPE candidate_source AS ENUM ('linkedin', 'referral', 'job_board', 'direct', 'other');
CREATE TYPE candidate_status AS ENUM ('active', 'rejected', 'offer_sent', 'offer_accepted', 'joined', 'withdrew');
CREATE TYPE interview_recommendation AS ENUM ('strong_yes', 'yes', 'maybe', 'no');
CREATE TYPE announcement_audience AS ENUM ('all', 'department', 'role');
CREATE TYPE notification_type AS ENUM ('leave_request', 'leave_approved', 'leave_rejected', 'task_assigned', 'task_overdue', 'payslip_uploaded', 'announcement', 'onboarding_task', 'review_due');
CREATE TYPE document_type AS ENUM ('offer_letter', 'nda', 'id_proof', 'certificate', 'other');
CREATE TYPE timeline_event_type AS ENUM ('joined', 'promoted', 'transferred', 'salary_revised', 'warning_issued', 'role_changed', 'resigned', 'terminated');
CREATE TYPE project_member_role AS ENUM ('lead', 'member');

-- ============================================================================
-- SECTION 1: CREATE ALL TABLES (no RLS policies yet — profiles must exist first)
-- ============================================================================

-- 1. COMPANY SETTINGS
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name text NOT NULL DEFAULT 'My Company',
  logo_storage_path text,
  address text,
  industry text,
  timezone text NOT NULL DEFAULT 'UTC',
  currency text NOT NULL DEFAULT 'USD',
  working_days text[] NOT NULL DEFAULT ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'],
  working_hours_per_day numeric NOT NULL DEFAULT 8,
  financial_year_start_month int NOT NULL DEFAULT 4,
  late_threshold_minutes int NOT NULL DEFAULT 15,
  min_attendance_percentage_alert numeric NOT NULL DEFAULT 75,
  two_level_leave_approval boolean NOT NULL DEFAULT false,
  mfa_enforced boolean NOT NULL DEFAULT false,
  allowed_office_ips text[] DEFAULT ARRAY[]::text[],
  office_geofence_lat double precision,
  office_geofence_lng double precision,
  office_geofence_radius_meters double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. BRANCHES
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text,
  city text,
  country text,
  geofence_lat double precision,
  geofence_lng double precision,
  geofence_radius_meters double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. DEPARTMENTS (head_id added later after profiles)
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  profile_photo_url text,
  job_title text,
  department_id uuid REFERENCES public.departments(id),
  employment_type employment_type NOT NULL DEFAULT 'full_time',
  date_of_joining date,
  probation_end_date date,
  confirmation_date date,
  manager_id uuid REFERENCES public.profiles(id),
  work_location work_location NOT NULL DEFAULT 'office',
  branch_id uuid REFERENCES public.branches(id),
  work_email text NOT NULL,
  personal_email text,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  skills text[] DEFAULT ARRAY[]::text[],
  status employee_status NOT NULL DEFAULT 'active',
  role user_role NOT NULL DEFAULT 'employee',
  password_changed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_department ON public.profiles(department_id);
CREATE INDEX idx_profiles_manager ON public.profiles(manager_id);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Add head_id FK to departments now that profiles exists
ALTER TABLE public.departments ADD COLUMN head_id uuid REFERENCES public.profiles(id);

-- 5. SHIFTS
CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  department_id uuid REFERENCES public.departments(id),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. PAY GRADES
CREATE TABLE public.pay_grades (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  min_salary numeric NOT NULL,
  max_salary numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  created_by uuid REFERENCES public.profiles(id)
);

-- 7. LEAVE TYPES
CREATE TABLE public.leave_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  annual_quota int NOT NULL DEFAULT 0,
  carry_forward boolean NOT NULL DEFAULT false,
  max_carry_forward_days int NOT NULL DEFAULT 0,
  encashable boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. EMPLOYEE SHIFTS
CREATE TABLE public.employee_shifts (
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE,
  effective_from date NOT NULL,
  effective_to date,
  PRIMARY KEY (employee_id, shift_id, effective_from)
);

-- 9. EMPLOYEE DOCUMENTS
CREATE TABLE public.employee_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL DEFAULT 'other',
  file_name text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- 10. EMPLOYEE TIMELINE
CREATE TABLE public.employee_timeline (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type timeline_event_type NOT NULL,
  description text NOT NULL,
  effective_date date NOT NULL,
  recorded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. LEAVE BALANCES
CREATE TABLE public.leave_balances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id),
  year int NOT NULL,
  total_allocated int NOT NULL DEFAULT 0,
  used int NOT NULL DEFAULT 0,
  pending int NOT NULL DEFAULT 0,
  remaining int GENERATED ALWAYS AS (total_allocated - used - pending) STORED,
  UNIQUE(employee_id, leave_type_id, year)
);

-- 12. ATTENDANCE
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  check_in_ip text,
  check_in_location point,
  status attendance_status NOT NULL DEFAULT 'present',
  total_hours numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_employee_date ON public.attendance(employee_id, date);

-- 13. LEAVE REQUESTS
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days numeric NOT NULL,
  reason text,
  attachment_path text,
  status leave_request_status NOT NULL DEFAULT 'pending',
  manager_approval_status text,
  hr_approval_status text,
  manager_note text,
  hr_note text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 14. HOLIDAYS
CREATE TABLE public.holidays (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  date date NOT NULL,
  company_wide boolean NOT NULL DEFAULT true,
  branch_id uuid REFERENCES public.branches(id),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 15. PROJECTS
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  department_id uuid REFERENCES public.departments(id),
  lead_id uuid REFERENCES public.profiles(id),
  start_date date,
  deadline date,
  priority project_priority NOT NULL DEFAULT 'medium',
  status project_status NOT NULL DEFAULT 'planning',
  progress_percentage int NOT NULL DEFAULT 0,
  health project_health NOT NULL DEFAULT 'on_track',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 16. PROJECT MEMBERS
CREATE TABLE public.project_members (
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_project project_member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, employee_id)
);

-- 17. TASKS
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES public.tasks(id),
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES public.profiles(id),
  due_date date,
  priority project_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'todo',
  estimated_hours numeric,
  actual_hours numeric,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);

-- 18. TASK COMMENTS
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 19. TASK ACTIVITY LOG
CREATE TABLE public.task_activity_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id),
  action text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 20. GOALS
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  parent_goal_id uuid REFERENCES public.goals(id),
  target_metric text,
  current_progress numeric NOT NULL DEFAULT 0,
  due_date date,
  status goal_status NOT NULL DEFAULT 'not_started',
  level goal_level NOT NULL DEFAULT 'individual',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 21. REVIEW CYCLES
CREATE TABLE public.review_cycles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type review_cycle_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status review_cycle_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 22. REVIEW FORMS
CREATE TABLE public.review_forms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id uuid NOT NULL REFERENCES public.review_cycles(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id),
  questions jsonb NOT NULL DEFAULT '[]'
);

-- 23. PERFORMANCE REVIEWS
CREATE TABLE public.performance_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id uuid NOT NULL REFERENCES public.review_cycles(id),
  employee_id uuid NOT NULL REFERENCES public.profiles(id),
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id),
  review_type review_type NOT NULL,
  form_id uuid REFERENCES public.review_forms(id),
  responses jsonb NOT NULL DEFAULT '{}',
  overall_rating numeric,
  status performance_review_status NOT NULL DEFAULT 'pending',
  submitted_at timestamptz,
  finalized_at timestamptz,
  acknowledged_at timestamptz,
  employee_comments text
);

-- 24. SALARY COMPONENTS
CREATE TABLE public.salary_components (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  component_name salary_component_type NOT NULL,
  amount numeric NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  created_by uuid REFERENCES public.profiles(id)
);

-- 25. SALARY REVISIONS
CREATE TABLE public.salary_revisions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_ctc numeric NOT NULL,
  new_ctc numeric NOT NULL,
  effective_date date NOT NULL,
  reason text,
  revised_by uuid REFERENCES public.profiles(id)
);

-- 26. PAYROLL RUNS
CREATE TABLE public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  month date NOT NULL,
  status payroll_run_status NOT NULL DEFAULT 'pending',
  processed_by uuid REFERENCES public.profiles(id),
  completed_at timestamptz
);

-- 27. PAYSLIPS
CREATE TABLE public.payslips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payroll_run_id uuid NOT NULL REFERENCES public.payroll_runs(id),
  month date NOT NULL,
  gross_pay numeric NOT NULL,
  total_deductions numeric NOT NULL DEFAULT 0,
  net_pay numeric NOT NULL,
  payslip_storage_path text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- 28. REIMBURSEMENTS
CREATE TABLE public.reimbursements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category reimbursement_category NOT NULL,
  amount numeric NOT NULL,
  expense_date date NOT NULL,
  description text,
  receipt_storage_path text,
  status reimbursement_status NOT NULL DEFAULT 'pending',
  manager_approval_at timestamptz,
  finance_note text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 29. JOB OPENINGS
CREATE TABLE public.job_openings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  department_id uuid REFERENCES public.departments(id),
  branch_id uuid REFERENCES public.branches(id),
  employment_type employment_type NOT NULL DEFAULT 'full_time',
  openings_count int NOT NULL DEFAULT 1,
  job_description text,
  required_skills text[] DEFAULT ARRAY[]::text[],
  status job_opening_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 30. CANDIDATES
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_opening_id uuid NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  resume_storage_path text,
  source candidate_source NOT NULL DEFAULT 'direct',
  referral_employee_id uuid REFERENCES public.profiles(id),
  current_stage text,
  overall_status candidate_status NOT NULL DEFAULT 'active',
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- 31. INTERVIEW STAGES
CREATE TABLE public.interview_stages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_opening_id uuid NOT NULL REFERENCES public.job_openings(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  stage_order int NOT NULL,
  interviewer_ids uuid[] DEFAULT ARRAY[]::uuid[]
);

-- 32. INTERVIEW SCORECARDS
CREATE TABLE public.interview_scorecards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.interview_stages(id),
  interviewer_id uuid NOT NULL REFERENCES public.profiles(id),
  ratings jsonb NOT NULL DEFAULT '{}',
  overall_recommendation interview_recommendation,
  notes text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- 33. ONBOARDING TEMPLATES
CREATE TABLE public.onboarding_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  department_id uuid REFERENCES public.departments(id),
  tasks jsonb NOT NULL DEFAULT '[]'
);

-- 34. ONBOARDING CHECKLISTS
CREATE TABLE public.onboarding_checklists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.onboarding_templates(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 35. ONBOARDING TASKS
CREATE TABLE public.onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id uuid NOT NULL REFERENCES public.onboarding_checklists(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  description text,
  assigned_to_id uuid REFERENCES public.profiles(id),
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz
);

-- 36. ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  body text NOT NULL,
  attachment_storage_path text,
  is_pinned boolean NOT NULL DEFAULT false,
  audience announcement_audience NOT NULL DEFAULT 'all',
  target_department_id uuid REFERENCES public.departments(id),
  target_role user_role,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 37. ANNOUNCEMENT READS
CREATE TABLE public.announcement_reads (
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, employee_id)
);

-- 38. POLICIES
CREATE TABLE public.policies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  document_storage_path text,
  version text NOT NULL DEFAULT '1.0',
  requires_acknowledgement boolean NOT NULL DEFAULT false,
  published_by uuid REFERENCES public.profiles(id),
  published_at timestamptz NOT NULL DEFAULT now()
);

-- 39. POLICY ACKNOWLEDGEMENTS
CREATE TABLE public.policy_acknowledgements (
  policy_id uuid REFERENCES public.policies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (policy_id, employee_id)
);

-- 40. NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text,
  reference_id uuid,
  reference_type text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, read);

-- 41. AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid REFERENCES public.profiles(id),
  actor_name text NOT NULL,
  action text NOT NULL,
  module text NOT NULL,
  target_table text NOT NULL,
  target_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- 42. AUTH LOGS
CREATE TABLE public.auth_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid,
  email text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  success boolean NOT NULL DEFAULT false
);

-- 43. NOTIFICATION SETTINGS
CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type text UNIQUE NOT NULL,
  notify_employee boolean NOT NULL DEFAULT true,
  notify_manager boolean NOT NULL DEFAULT true,
  notify_hr boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false
);

-- ============================================================================
-- SECTION 2: HELPER FUNCTIONS (profiles table now exists)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_department(uid uuid)
RETURNS uuid AS $$
  SELECT department_id FROM public.profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- SECTION 3: ENABLE RLS & CREATE POLICIES (helper functions now exist)
-- ============================================================================

-- company_settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_settings" ON public.company_settings FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "all_read_settings" ON public.company_settings FOR SELECT USING (true);

-- branches
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_branches" ON public.branches FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "all_read_branches" ON public.branches FOR SELECT USING (true);

-- departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_departments" ON public.departments FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "all_read_departments" ON public.departments FOR SELECT USING (true);

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access" ON public.profiles FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "manager_read_dept" ON public.profiles FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'manager'
  AND department_id = public.get_user_department(auth.uid())
);
CREATE POLICY "employee_read_own" ON public.profiles FOR SELECT USING (
  auth.uid() = id
);
CREATE POLICY "employee_update_own" ON public.profiles FOR UPDATE USING (
  auth.uid() = id
) WITH CHECK (auth.uid() = id);
CREATE POLICY "employee_read_public" ON public.profiles FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'employee'
);

-- shifts
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_shifts" ON public.shifts FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "all_read_shifts" ON public.shifts FOR SELECT USING (true);

-- pay_grades
ALTER TABLE public.pay_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_pay_grades" ON public.pay_grades FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "managers_read_pay_grades" ON public.pay_grades FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'manager'
);

-- leave_types
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_leave_types" ON public.leave_types FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "all_read_leave_types" ON public.leave_types FOR SELECT USING (true);

-- employee_shifts
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_emp_shifts" ON public.employee_shifts FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "own_read_emp_shifts" ON public.employee_shifts FOR SELECT USING (
  auth.uid() = employee_id
);

-- employee_documents
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_docs" ON public.employee_documents FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "own_read_docs" ON public.employee_documents FOR SELECT USING (
  auth.uid() = employee_id
);

-- employee_timeline
ALTER TABLE public.employee_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_timeline" ON public.employee_timeline FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "own_read_timeline" ON public.employee_timeline FOR SELECT USING (
  auth.uid() = employee_id
);

-- leave_balances
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_balances" ON public.leave_balances FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "own_read_balances" ON public.leave_balances FOR SELECT USING (
  auth.uid() = employee_id
);
CREATE POLICY "manager_read_dept_balances" ON public.leave_balances FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'manager'
  AND employee_id IN (SELECT id FROM public.profiles WHERE department_id = public.get_user_department(auth.uid()))
);

-- attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_attendance" ON public.attendance FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "manager_read_dept_attendance" ON public.attendance FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'manager'
  AND employee_id IN (SELECT id FROM public.profiles WHERE department_id = public.get_user_department(auth.uid()))
);
CREATE POLICY "own_manage_attendance" ON public.attendance FOR ALL USING (
  auth.uid() = employee_id
);

-- leave_requests
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_leave_req" ON public.leave_requests FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "manager_manage_dept_leave" ON public.leave_requests FOR ALL USING (
  public.get_user_role(auth.uid()) = 'manager'
  AND employee_id IN (SELECT id FROM public.profiles WHERE department_id = public.get_user_department(auth.uid()))
);
CREATE POLICY "own_manage_leave_req" ON public.leave_requests FOR ALL USING (
  auth.uid() = employee_id
);

-- holidays
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_holidays" ON public.holidays FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "all_read_holidays" ON public.holidays FOR SELECT USING (true);

-- projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_projects" ON public.projects FOR SELECT USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "manager_manage_dept_projects" ON public.projects FOR ALL USING (
  public.get_user_role(auth.uid()) = 'manager'
  AND department_id = public.get_user_department(auth.uid())
);
CREATE POLICY "member_read_projects" ON public.projects FOR SELECT USING (
  id IN (SELECT project_id FROM public.project_members WHERE employee_id = auth.uid())
);

-- project_members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_pm" ON public.project_members FOR SELECT USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "manager_manage_pm" ON public.project_members FOR ALL USING (
  public.get_user_role(auth.uid()) = 'manager'
  AND project_id IN (SELECT id FROM public.projects WHERE department_id = public.get_user_department(auth.uid()))
);
CREATE POLICY "own_read_pm" ON public.project_members FOR SELECT USING (
  auth.uid() = employee_id
);

-- tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_tasks" ON public.tasks FOR SELECT USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "manager_manage_dept_tasks" ON public.tasks FOR ALL USING (
  public.get_user_role(auth.uid()) = 'manager'
  AND project_id IN (SELECT id FROM public.projects WHERE department_id = public.get_user_department(auth.uid()))
);
CREATE POLICY "assignee_manage_tasks" ON public.tasks FOR ALL USING (
  auth.uid() = assignee_id
);
CREATE POLICY "member_read_tasks" ON public.tasks FOR SELECT USING (
  project_id IN (SELECT project_id FROM public.project_members WHERE employee_id = auth.uid())
);

-- task_comments
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_members_manage_comments" ON public.task_comments FOR ALL USING (
  task_id IN (
    SELECT t.id FROM public.tasks t
    JOIN public.project_members pm ON pm.project_id = t.project_id
    WHERE pm.employee_id = auth.uid()
  )
  OR public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);

-- task_activity_log
ALTER TABLE public.task_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_task_activity" ON public.task_activity_log FOR SELECT USING (
  task_id IN (
    SELECT t.id FROM public.tasks t
    JOIN public.project_members pm ON pm.project_id = t.project_id
    WHERE pm.employee_id = auth.uid()
  )
  OR public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin', 'manager')
);

-- goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_goals" ON public.goals FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "own_manage_goals" ON public.goals FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "manager_read_dept_goals" ON public.goals FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'manager'
  AND owner_id IN (SELECT id FROM public.profiles WHERE department_id = public.get_user_department(auth.uid()))
);

-- review_cycles
ALTER TABLE public.review_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_cycles" ON public.review_cycles FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "all_read_cycles" ON public.review_cycles FOR SELECT USING (true);

-- review_forms
ALTER TABLE public.review_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_forms" ON public.review_forms FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "all_read_forms" ON public.review_forms FOR SELECT USING (true);

-- performance_reviews
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_reviews" ON public.performance_reviews FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "own_read_reviews" ON public.performance_reviews FOR SELECT USING (
  auth.uid() = employee_id OR auth.uid() = reviewer_id
);
CREATE POLICY "reviewer_update_reviews" ON public.performance_reviews FOR UPDATE USING (
  auth.uid() = reviewer_id
);
CREATE POLICY "manager_read_dept_reviews" ON public.performance_reviews FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'manager'
  AND employee_id IN (SELECT id FROM public.profiles WHERE department_id = public.get_user_department(auth.uid()))
);

-- salary_components
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_salary" ON public.salary_components FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "own_read_salary" ON public.salary_components FOR SELECT USING (
  auth.uid() = employee_id
);

-- salary_revisions
ALTER TABLE public.salary_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_revisions" ON public.salary_revisions FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "own_read_revisions" ON public.salary_revisions FOR SELECT USING (
  auth.uid() = employee_id
);

-- payroll_runs
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_payroll" ON public.payroll_runs FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);

-- payslips
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_payslips" ON public.payslips FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "own_read_payslips" ON public.payslips FOR SELECT USING (
  auth.uid() = employee_id
);

-- reimbursements
ALTER TABLE public.reimbursements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_reimbursements" ON public.reimbursements FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "own_manage_reimbursements" ON public.reimbursements FOR ALL USING (
  auth.uid() = employee_id
);
CREATE POLICY "manager_manage_dept_reimb" ON public.reimbursements FOR ALL USING (
  public.get_user_role(auth.uid()) = 'manager'
  AND employee_id IN (SELECT id FROM public.profiles WHERE department_id = public.get_user_department(auth.uid()))
);

-- job_openings
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_jobs" ON public.job_openings FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "manager_read_dept_jobs" ON public.job_openings FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'manager'
  AND department_id = public.get_user_department(auth.uid())
);

-- candidates
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_candidates" ON public.candidates FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "manager_read_dept_candidates" ON public.candidates FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'manager'
  AND job_opening_id IN (SELECT id FROM public.job_openings WHERE department_id = public.get_user_department(auth.uid()))
);

-- interview_stages
ALTER TABLE public.interview_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_stages" ON public.interview_stages FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "interviewers_read_stages" ON public.interview_stages FOR SELECT USING (
  auth.uid() = ANY(interviewer_ids)
);

-- interview_scorecards
ALTER TABLE public.interview_scorecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_scorecards" ON public.interview_scorecards FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "own_manage_scorecards" ON public.interview_scorecards FOR ALL USING (
  auth.uid() = interviewer_id
);

-- onboarding_templates
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_onb_templates" ON public.onboarding_templates FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);

-- onboarding_checklists
ALTER TABLE public.onboarding_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_onb_checklists" ON public.onboarding_checklists FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "own_read_onb_checklists" ON public.onboarding_checklists FOR SELECT USING (
  auth.uid() = employee_id
);

-- onboarding_tasks
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_onb_tasks" ON public.onboarding_tasks FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "assigned_manage_onb_tasks" ON public.onboarding_tasks FOR ALL USING (
  auth.uid() = assigned_to_id
  OR checklist_id IN (SELECT id FROM public.onboarding_checklists WHERE employee_id = auth.uid())
);

-- announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_announcements" ON public.announcements FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "all_read_announcements" ON public.announcements FOR SELECT USING (
  audience = 'all'
  OR (audience = 'department' AND target_department_id = public.get_user_department(auth.uid()))
  OR (audience = 'role' AND target_role = public.get_user_role(auth.uid()))
);

-- announcement_reads
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_manage_reads" ON public.announcement_reads FOR ALL USING (
  auth.uid() = employee_id
);
CREATE POLICY "admins_read_reads" ON public.announcement_reads FOR SELECT USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);

-- policies
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_policies" ON public.policies FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "all_read_policies" ON public.policies FOR SELECT USING (true);

-- policy_acknowledgements
ALTER TABLE public.policy_acknowledgements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_manage_ack" ON public.policy_acknowledgements FOR ALL USING (
  auth.uid() = employee_id
);
CREATE POLICY "admins_read_ack" ON public.policy_acknowledgements FOR SELECT USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);

-- notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_manage_notifications" ON public.notifications FOR ALL USING (
  auth.uid() = recipient_id
);
CREATE POLICY "admins_insert_notifications" ON public.notifications FOR INSERT WITH CHECK (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin', 'manager')
);

-- audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_audit" ON public.audit_logs FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);

-- auth_logs
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_auth_logs" ON public.auth_logs FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);

-- notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_notif_settings" ON public.notification_settings FOR ALL USING (
  public.get_user_role(auth.uid()) IN ('super_admin', 'hr_admin')
);
CREATE POLICY "all_read_notif_settings" ON public.notification_settings FOR SELECT USING (true);

-- ============================================================================
-- SECTION 4: DATABASE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Audit log helper
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_actor_id uuid,
  p_action text,
  p_module text,
  p_target_table text,
  p_target_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_actor_name text;
BEGIN
  SELECT full_name INTO v_actor_name FROM public.profiles WHERE id = p_actor_id;
  INSERT INTO public.audit_logs (actor_id, actor_name, action, module, target_table, target_id, old_values, new_values)
  VALUES (p_actor_id, COALESCE(v_actor_name, 'System'), p_action, p_module, p_target_table, p_target_id, p_old_values, p_new_values);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER leave_requests_updated_at BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER company_settings_updated_at BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Employee ID auto-generation
CREATE OR REPLACE FUNCTION public.generate_employee_id()
RETURNS TRIGGER AS $$
DECLARE
  next_num int;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS int)), 0) + 1
  INTO next_num FROM public.profiles;
  IF NEW.employee_id IS NULL OR NEW.employee_id = '' THEN
    NEW.employee_id := 'EMP' || LPAD(next_num::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_employee_id BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_employee_id();

-- Insert default company settings row
INSERT INTO public.company_settings (company_name) VALUES ('My Company') ON CONFLICT DO NOTHING;

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
