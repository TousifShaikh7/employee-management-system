'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
    CalendarDays,
    Plus,
    ChevronLeft,
    ChevronRight,
    Check,
    X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { LeaveRequest, LeaveBalance, LeaveType, PaginatedResponse } from '@/lib/types/database'

const statusStyles: Record<string, string> = {
    pending: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    approved: 'bg-neutral-100 text-black border-neutral-200',
    rejected: 'bg-neutral-200 text-neutral-700 border-neutral-300',
    cancelled: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    info_requested: 'bg-neutral-100 text-neutral-600 border-neutral-200',
}

export default function LeavePage() {
    const { profile } = useAuth()
    const [requests, setRequests] = useState<LeaveRequest[]>([])
    const [balances, setBalances] = useState<LeaveBalance[]>([])
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [statusFilter, setStatusFilter] = useState('')
    const [applyOpen, setApplyOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const pageSize = 15

    // Apply form state
    const [form, setForm] = useState({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
    })

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'hr_admin' || profile?.role === 'manager'

    const fetchRequests = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() })
            if (statusFilter) params.set('status', statusFilter)

            const res = await fetch(`/api/leave?${params}`)
            if (!res.ok) { setLoading(false); return }
            const json = await res.json()
            if (json.success && json.data) {
                const paginated = json.data as PaginatedResponse<LeaveRequest>
                setRequests(paginated.data)
                setTotalPages(paginated.totalPages)
                setTotal(paginated.total)
            }
        } catch (err) {
            console.error('Error fetching leave requests:', err)
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter])

    const fetchBalances = useCallback(async () => {
        try {
            const res = await fetch('/api/leave/balances')
            if (!res.ok) return
            const json = await res.json()
            if (json.success && json.data) {
                setBalances(json.data.balances || [])
                setLeaveTypes(json.data.leaveTypes || [])
            }
        } catch (err) {
            console.error('Error fetching leave balances:', err)
        }
    }, [])

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    useEffect(() => {
        fetchBalances()
    }, [fetchBalances])

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.leave_type_id || !form.start_date || !form.end_date) {
            toast.error('Please fill all required fields')
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch('/api/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const json = await res.json()
            if (json.success) {
                toast.success('Leave request submitted!')
                setApplyOpen(false)
                setForm({ leave_type_id: '', start_date: '', end_date: '', reason: '' })
                fetchRequests()
                fetchBalances()
            } else {
                toast.error(json.message)
            }
        } catch {
            toast.error('Failed to submit leave request')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const res = await fetch(`/api/leave/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            })
            const json = await res.json()
            if (json.success) {
                toast.success(`Leave request ${action}d`)
                fetchRequests()
            } else {
                toast.error(json.message)
            }
        } catch {
            toast.error(`Failed to ${action} request`)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-black tracking-tight">Leave</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">
                        {isAdmin ? `${total} requests` : 'Manage your leave'}
                    </p>
                </div>
                <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-black hover:bg-neutral-800 text-white" size="sm">
                            <Plus className="w-3.5 h-3.5" />
                            Apply for Leave
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Apply for Leave</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleApply} className="space-y-4 mt-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Leave Type</Label>
                                <Select value={form.leave_type_id} onValueChange={(v) => setForm({ ...form, leave_type_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leaveTypes.map((lt) => (
                                            <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">From</Label>
                                    <Input
                                        type="date"
                                        value={form.start_date}
                                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">To</Label>
                                    <Input
                                        type="date"
                                        value={form.end_date}
                                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Reason</Label>
                                <Textarea
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    placeholder="Optional reason..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={submitting} className="bg-black hover:bg-neutral-800 text-white">
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Leave Balance Cards */}
            {balances.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {balances.map((bal) => (
                        <Card key={bal.id} className="border-neutral-200">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                                    {bal.leave_type?.name || 'Leave'}
                                </p>
                                <div className="flex items-end gap-1">
                                    <span className="text-2xl font-bold text-black tracking-tight">{bal.remaining}</span>
                                    <span className="text-xs text-neutral-400 mb-1">/ {bal.total_allocated}</span>
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <span className="text-xs text-neutral-400">Used: {bal.used}</span>
                                    {bal.pending > 0 && (
                                        <span className="text-xs text-neutral-400">Pending: {bal.pending}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
                    <SelectTrigger className="w-[140px] h-9 bg-neutral-50 border-neutral-200">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    ) : requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <CalendarDays className="w-8 h-8 text-neutral-200 mb-3" />
                            <h3 className="text-sm font-semibold text-neutral-700">No leave requests</h3>
                            <p className="text-xs text-neutral-400 mt-1">
                                {statusFilter ? 'No requests with this status' : 'Leave requests will appear here'}
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
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Type</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Period</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Days</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Reason</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Status</TableHead>
                                        {isAdmin && (
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Actions</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((req) => (
                                        <TableRow key={req.id} className="border-neutral-100">
                                            {isAdmin && (
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="w-7 h-7">
                                                            <AvatarImage src={req.employee?.profile_photo_url || undefined} />
                                                            <AvatarFallback className="bg-black text-white text-[10px]">
                                                                {req.employee?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-black">{req.employee?.full_name}</span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <span className="text-sm text-neutral-600">{req.leave_type?.name || '—'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-black">
                                                    {formatDate(req.start_date)} – {formatDate(req.end_date)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-neutral-600">{req.total_days}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-neutral-500 truncate max-w-[200px] block">
                                                    {req.reason || '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-xs capitalize ${statusStyles[req.status]}`}>
                                                    {req.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell>
                                                    {req.status === 'pending' && (
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 text-neutral-500 hover:text-black"
                                                                onClick={() => handleAction(req.id, 'approve')}
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 text-neutral-500 hover:text-black"
                                                                onClick={() => handleAction(req.id, 'reject')}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            )}
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
