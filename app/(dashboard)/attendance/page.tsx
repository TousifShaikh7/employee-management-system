'use client'

import { useState, useEffect, useCallback } from 'react'
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
    Clock,
    LogIn,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Users,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Attendance, Department, PaginatedResponse } from '@/lib/types/database'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const statusStyles: Record<string, string> = {
    present: 'bg-neutral-100 text-black border-neutral-200',
    absent: 'bg-neutral-200 text-neutral-700 border-neutral-300',
    late: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    half_day: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    on_leave: 'bg-neutral-100 text-neutral-500 border-neutral-200',
}

export default function AttendancePage() {
    const { profile } = useAuth()
    const [records, setRecords] = useState<Attendance[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [dateFilter, setDateFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [departments, setDepartments] = useState<Department[]>([])
    const [deptFilter, setDeptFilter] = useState('')
    const [todayRecord, setTodayRecord] = useState<Attendance | null>(null)
    const [checkingIn, setCheckingIn] = useState(false)
    const [checkingOut, setCheckingOut] = useState(false)
    const pageSize = 15

    const supabase = createBrowserSupabaseClient()
    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'hr_admin' || profile?.role === 'manager'

    const fetchDepartments = useCallback(async () => {
        if (!isAdmin) return
        const { data } = await supabase.from('departments').select('*').order('name')
        if (data) setDepartments(data as unknown as Department[])
    }, [supabase, isAdmin])

    const fetchRecords = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() })
        if (dateFilter) params.set('date', dateFilter)
        if (statusFilter) params.set('status', statusFilter)
        if (deptFilter) params.set('department', deptFilter)

        const res = await fetch(`/api/attendance?${params}`)
        const json = await res.json()
        if (json.success && json.data) {
            const paginated = json.data as PaginatedResponse<Attendance>
            setRecords(paginated.data)
            setTotalPages(paginated.totalPages)
            setTotal(paginated.total)
        }
        setLoading(false)
    }, [page, dateFilter, statusFilter, deptFilter])

    const fetchTodayRecord = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0]
        const params = new URLSearchParams({
            page: '1', pageSize: '1',
            date: today,
            ...(profile ? { employee_id: profile.id } : {}),
        })
        const res = await fetch(`/api/attendance?${params}`)
        const json = await res.json()
        if (json.success && json.data?.data?.[0]) {
            setTodayRecord(json.data.data[0])
        }
    }, [profile])

    useEffect(() => {
        fetchDepartments()
    }, [fetchDepartments])

    useEffect(() => {
        fetchRecords()
    }, [fetchRecords])

    useEffect(() => {
        fetchTodayRecord()
    }, [fetchTodayRecord])

    const handleCheckIn = async () => {
        setCheckingIn(true)
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check_in' }),
            })
            const json = await res.json()
            if (json.success) {
                toast.success('Checked in successfully!')
                setTodayRecord(json.data)
                fetchRecords()
            } else {
                toast.error(json.message)
            }
        } catch {
            toast.error('Failed to check in')
        } finally {
            setCheckingIn(false)
        }
    }

    const handleCheckOut = async () => {
        setCheckingOut(true)
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check_out' }),
            })
            const json = await res.json()
            if (json.success) {
                toast.success('Checked out successfully!')
                setTodayRecord(json.data)
                fetchRecords()
            } else {
                toast.error(json.message)
            }
        } catch {
            toast.error('Failed to check out')
        } finally {
            setCheckingOut(false)
        }
    }

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '—'
        return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-black tracking-tight">Attendance</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">
                        {isAdmin ? `${total} records` : 'Your attendance history'}
                    </p>
                </div>
            </div>

            {/* Today's Status Card */}
            <Card className="border-neutral-200">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Today</p>
                            <p className="text-sm text-neutral-600">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                            {todayRecord && (
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5">
                                        <LogIn className="w-3.5 h-3.5 text-neutral-400" />
                                        <span className="text-sm text-black font-medium">{formatTime(todayRecord.check_in_time)}</span>
                                    </div>
                                    {todayRecord.check_out_time && (
                                        <div className="flex items-center gap-1.5">
                                            <LogOut className="w-3.5 h-3.5 text-neutral-400" />
                                            <span className="text-sm text-black font-medium">{formatTime(todayRecord.check_out_time)}</span>
                                        </div>
                                    )}
                                    {todayRecord.total_hours && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                            <span className="text-sm text-neutral-600">{todayRecord.total_hours}h</span>
                                        </div>
                                    )}
                                    <Badge variant="outline" className={`text-xs capitalize ${statusStyles[todayRecord.status]}`}>
                                        {todayRecord.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {!todayRecord ? (
                                <Button
                                    onClick={handleCheckIn}
                                    disabled={checkingIn}
                                    className="gap-2 bg-black hover:bg-neutral-800 text-white"
                                >
                                    {checkingIn ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <LogIn className="w-4 h-4" />
                                    )}
                                    Check In
                                </Button>
                            ) : !todayRecord.check_out_time ? (
                                <Button
                                    onClick={handleCheckOut}
                                    disabled={checkingOut}
                                    variant="outline"
                                    className="gap-2 border-neutral-200"
                                >
                                    {checkingOut ? (
                                        <span className="w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <LogOut className="w-4 h-4" />
                                    )}
                                    Check Out
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-neutral-500">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Completed for today
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
                    className="w-[180px] h-9 bg-neutral-50 border-neutral-200 focus:border-black"
                />
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
                    <SelectTrigger className="w-[130px] h-9 bg-neutral-50 border-neutral-200">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="half_day">Half Day</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                </Select>
                {isAdmin && (
                    <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v === 'all' ? '' : v); setPage(1) }}>
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
                )}
                {dateFilter && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setDateFilter(''); setPage(1) }}
                        className="text-xs text-neutral-500"
                    >
                        Clear date
                    </Button>
                )}
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
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Clock className="w-8 h-8 text-neutral-200 mb-3" />
                            <h3 className="text-sm font-semibold text-neutral-700">No attendance records</h3>
                            <p className="text-xs text-neutral-400 mt-1">
                                {dateFilter ? 'No records for this date' : 'Attendance records will appear here'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-neutral-200">
                                        {isAdmin && (
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Employee</TableHead>
                                        )}
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Date</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Check In</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Check Out</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Hours</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record) => (
                                        <TableRow key={record.id} className="border-neutral-100">
                                            {isAdmin && (
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="w-7 h-7">
                                                            <AvatarImage src={record.employee?.profile_photo_url || undefined} />
                                                            <AvatarFallback className="bg-black text-white text-[10px]">
                                                                {record.employee?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-black">{record.employee?.full_name}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <span className="text-sm text-neutral-600">
                                                    {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-black font-medium">{formatTime(record.check_in_time)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-black font-medium">{formatTime(record.check_out_time)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-neutral-600">
                                                    {record.total_hours ? `${record.total_hours}h` : '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-xs capitalize ${statusStyles[record.status]}`}>
                                                    {record.status.replace('_', ' ')}
                                                </Badge>
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
                                    <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-7 w-7 p-0">
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-xs text-neutral-500 px-2">{page} / {totalPages}</span>
                                    <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-7 w-7 p-0">
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
