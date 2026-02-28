'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { Department, Branch } from '@/lib/types/database'

export default function NewEmployeePage() {
    const { profile } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [departments, setDepartments] = useState<Department[]>([])
    const [branches, setBranches] = useState<Branch[]>([])
    const supabase = createBrowserSupabaseClient()

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        job_title: '',
        department_id: '',
        branch_id: '',
        employment_type: 'full_time',
        work_location: 'office',
        role: 'employee',
        date_of_joining: '',
    })

    useEffect(() => {
        const fetch = async () => {
            const [deptRes, branchRes] = await Promise.all([
                supabase.from('departments').select('*').order('name'),
                supabase.from('branches').select('*').order('name'),
            ])
            if (deptRes.data) setDepartments(deptRes.data as unknown as Department[])
            if (branchRes.data) setBranches(branchRes.data as unknown as Branch[])
        }
        fetch()
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.full_name || !form.email) {
            toast.error('Name and email are required')
            return
        }
        setLoading(true)

        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const json = await res.json()

            if (json.success) {
                toast.success('Employee created successfully!')
                router.push('/employees')
            } else {
                toast.error(json.message || 'Failed to create employee')
            }
        } catch {
            toast.error('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'hr_admin'
    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-neutral-500">You do not have permission to create employees.</p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-black tracking-tight">Add Employee</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">Create a new employee account</p>
                </div>
            </div>

            <Card className="border-neutral-200">
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Info */}
                        <div>
                            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name *</Label>
                                    <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required placeholder="John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Work Email *</Label>
                                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="john@company.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date_of_joining">Date of Joining</Label>
                                    <Input id="date_of_joining" type="date" value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Work Info */}
                        <div>
                            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">Work Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="job_title">Job Title</Label>
                                    <Input id="job_title" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="Software Engineer" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                        <SelectContent>
                                            {departments.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Branch</Label>
                                    <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                                        <SelectContent>
                                            {branches.map((b) => (
                                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Employment Type</Label>
                                    <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full_time">Full Time</SelectItem>
                                            <SelectItem value="part_time">Part Time</SelectItem>
                                            <SelectItem value="contractor">Contractor</SelectItem>
                                            <SelectItem value="intern">Intern</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Work Location</Label>
                                    <Select value={form.work_location} onValueChange={(v) => setForm({ ...form, work_location: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="office">Office</SelectItem>
                                            <SelectItem value="remote">Remote</SelectItem>
                                            <SelectItem value="hybrid">Hybrid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="employee">Employee</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="hr_admin">HR Admin</SelectItem>
                                            {profile?.role === 'super_admin' && (
                                                <SelectItem value="super_admin">Super Admin</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="gap-2 bg-black hover:bg-neutral-800 text-white"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                {loading ? 'Creating...' : 'Create Employee'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
