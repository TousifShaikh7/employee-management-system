'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Search,
    Plus,
    Users,
    Download,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import type { Profile, Department, PaginatedResponse } from '@/lib/types/database'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const statusStyles: Record<string, string> = {
    active: 'bg-neutral-100 text-black border-neutral-200',
    on_leave: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    probation: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    suspended: 'bg-neutral-200 text-neutral-700 border-neutral-300',
    resigned: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    terminated: 'bg-neutral-200 text-neutral-700 border-neutral-300',
}

const typeLabels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contractor: 'Contractor',
    intern: 'Intern',
}

export default function EmployeesPage() {
    const { profile } = useAuth()
    const router = useRouter()
    const [employees, setEmployees] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [department, setDepartment] = useState('')
    const [status, setStatus] = useState('')
    const [employmentType, setEmploymentType] = useState('')
    const [departments, setDepartments] = useState<Department[]>([])
    const pageSize = 10

    const supabase = createBrowserSupabaseClient()

    const fetchDepartments = useCallback(async () => {
        const { data } = await supabase.from('departments').select('*').order('name')
        if (data) setDepartments(data as unknown as Department[])
    }, [supabase])

    const fetchEmployees = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
        })
        if (search) params.set('search', search)
        if (department) params.set('department', department)
        if (status) params.set('status', status)
        if (employmentType) params.set('employment_type', employmentType)

        const res = await fetch(`/api/employees?${params}`)
        const json = await res.json()

        if (json.success && json.data) {
            const paginated = json.data as PaginatedResponse<Profile>
            setEmployees(paginated.data)
            setTotalPages(paginated.totalPages)
            setTotal(paginated.total)
        }
        setLoading(false)
    }, [page, search, department, status, employmentType])

    useEffect(() => {
        fetchDepartments()
    }, [fetchDepartments])

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchEmployees()
        }, 300)
        return () => clearTimeout(debounce)
    }, [fetchEmployees])

    const exportCSV = () => {
        const headers = ['Employee ID', 'Name', 'Email', 'Job Title', 'Department', 'Status', 'Type', 'Joined']
        const rows = employees.map((e) => [
            e.employee_id,
            e.full_name,
            e.work_email,
            e.job_title || '',
            e.department?.name || '',
            e.status,
            typeLabels[e.employment_type] || e.employment_type,
            e.date_of_joining || '',
        ])
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'employees.csv'
        a.click()
    }

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'hr_admin'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-black tracking-tight">Employees</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">{total} total</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportCSV}
                        className="gap-2 border-neutral-200 text-neutral-600 hover:text-black"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </Button>
                    {isAdmin && (
                        <Button
                            size="sm"
                            onClick={() => router.push('/employees/new')}
                            className="gap-2 bg-black hover:bg-neutral-800 text-white"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Employee
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder="Search by name, ID, or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        className="pl-9 h-9 bg-neutral-50 border-neutral-200 focus:border-black"
                    />
                </div>
                <Select value={department} onValueChange={(v) => { setDepartment(v === 'all' ? '' : v); setPage(1) }}>
                    <SelectTrigger className="w-[160px] h-9 bg-neutral-50 border-neutral-200">
                        <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
                    <SelectTrigger className="w-[130px] h-9 bg-neutral-50 border-neutral-200">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="probation">Probation</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="resigned">Resigned</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={employmentType} onValueChange={(v) => { setEmploymentType(v === 'all' ? '' : v); setPage(1) }}>
                    <SelectTrigger className="w-[130px] h-9 bg-neutral-50 border-neutral-200">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card className="border-neutral-200">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Users className="w-8 h-8 text-neutral-200 mb-3" />
                            <h3 className="text-sm font-semibold text-neutral-700">No employees found</h3>
                            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                                {search || department || status ? 'Try adjusting your filters' : 'Get started by adding your first employee'}
                            </p>
                            {isAdmin && !search && (
                                <Button
                                    size="sm"
                                    className="mt-4 gap-2 bg-black hover:bg-neutral-800 text-white"
                                    onClick={() => router.push('/employees/new')}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Employee
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-neutral-200">
                                        <TableHead className="w-[300px] text-xs uppercase tracking-wider text-neutral-400 font-medium">Employee</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Department</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Type</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Location</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Status</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.map((employee) => (
                                        <TableRow
                                            key={employee.id}
                                            className="cursor-pointer hover:bg-neutral-50 border-neutral-100"
                                            onClick={() => router.push(`/employees/${employee.id}`)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={employee.profile_photo_url || undefined} />
                                                        <AvatarFallback className="bg-black text-white text-[10px] font-medium">
                                                            {employee.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium text-black">{employee.full_name}</p>
                                                        <p className="text-xs text-neutral-400">{employee.job_title || employee.employee_id}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-neutral-600">{employee.department?.name || '—'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-neutral-600">{typeLabels[employee.employment_type] || employee.employment_type}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-neutral-600 capitalize">{employee.work_location}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-xs capitalize ${statusStyles[employee.status] || ''}`}>
                                                    {employee.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-neutral-500">
                                                    {employee.date_of_joining
                                                        ? new Date(employee.date_of_joining).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                        : '—'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {/* Pagination */}
                            <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-200">
                                <p className="text-xs text-neutral-500">
                                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={page <= 1}
                                        onClick={() => setPage(page - 1)}
                                        className="h-7 w-7 p-0"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-xs text-neutral-500 px-2">
                                        {page} / {totalPages}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(page + 1)}
                                        className="h-7 w-7 p-0"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
