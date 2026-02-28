'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Briefcase, Plus, ChevronLeft, ChevronRight, Users, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import type { JobOpening, Candidate, PaginatedResponse } from '@/lib/types/database'

const statusStyles: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    published: 'bg-neutral-900 text-white border-neutral-900',
    closed: 'bg-neutral-200 text-neutral-700 border-neutral-300',
    on_hold: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    new: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    screening: 'bg-neutral-200 text-neutral-700 border-neutral-300',
    interviewing: 'bg-neutral-200 text-neutral-800 border-neutral-300',
    offered: 'bg-neutral-900 text-white border-neutral-900',
    hired: 'bg-neutral-100 text-black border-neutral-200',
    rejected: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    withdrawn: 'bg-neutral-100 text-neutral-400 border-neutral-200',
}

type Tab = 'openings' | 'candidates'

export default function HiringPage() {
    const { profile } = useAuth()
    const [tab, setTab] = useState<Tab>('openings')
    const [openings, setOpenings] = useState<JobOpening[]>([])
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [statusFilter, setStatusFilter] = useState('')
    const [createOpen, setCreateOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const pageSize = 15
    const [form, setForm] = useState({ title: '', job_description: '', employment_type: 'full_time', openings_count: '1' })

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ tab, page: page.toString(), pageSize: pageSize.toString() })
            if (statusFilter) params.set('status', statusFilter)
            const res = await fetch(`/api/hiring?${params}`)
            if (!res.ok) { setLoading(false); return }
            const json = await res.json()
            if (json.success && json.data) {
                if (tab === 'openings') {
                    setOpenings(json.data.data || [])
                } else {
                    setCandidates(json.data.data || [])
                }
                setTotal(json.data.total || 0)
                setTotalPages(json.data.totalPages || 1)
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }, [tab, page, statusFilter])

    useEffect(() => { fetchData() }, [fetchData])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/hiring', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, openings_count: parseInt(form.openings_count) }),
            })
            const json = await res.json()
            if (json.success) { toast.success('Job opening created!'); setCreateOpen(false); fetchData() }
            else toast.error(json.message)
        } catch { toast.error('Failed to create opening') }
        finally { setSubmitting(false) }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-black tracking-tight">Hiring</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">{total} {tab}</p>
                </div>
                {tab === 'openings' && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-black hover:bg-neutral-800 text-white" size="sm"><Plus className="w-3.5 h-3.5" /> New Opening</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader><DialogTitle>Create Job Opening</DialogTitle></DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Title</Label>
                                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Description</Label>
                                    <Textarea value={form.job_description} onChange={(e) => setForm({ ...form, job_description: e.target.value })} rows={3} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Type</Label>
                                        <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="full_time">Full Time</SelectItem>
                                                <SelectItem value="part_time">Part Time</SelectItem>
                                                <SelectItem value="contract">Contract</SelectItem>
                                                <SelectItem value="intern">Intern</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Openings</Label>
                                        <Input type="number" min="1" value={form.openings_count} onChange={(e) => setForm({ ...form, openings_count: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={submitting} className="bg-black hover:bg-neutral-800 text-white">{submitting ? 'Creating...' : 'Create'}</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex items-center gap-0 border-b border-neutral-200">
                {(['openings', 'candidates'] as Tab[]).map((t) => (
                    <button key={t} onClick={() => { setTab(t); setPage(1); setStatusFilter('') }}
                        className={`px-4 py-2.5 text-[13px] font-medium uppercase tracking-wide transition-colors relative ${tab === t ? 'text-black' : 'text-neutral-400 hover:text-neutral-700'}`}>
                        {t}{tab === t && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-black" />}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : tab === 'openings' ? (
                openings.length === 0 ? (
                    <div className="flex flex-col items-center py-16">
                        <Briefcase className="w-8 h-8 text-neutral-200 mb-3" />
                        <h3 className="text-sm font-semibold text-neutral-700">No job openings</h3>
                        <p className="text-xs text-neutral-400 mt-1">Create an opening to start hiring</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {openings.map((o) => (
                            <Card key={o.id} className="border-neutral-200 hover:border-neutral-400 transition-colors">
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-sm font-semibold text-black">{o.title}</h3>
                                        <Badge variant="outline" className={`text-[10px] capitalize shrink-0 ml-2 ${statusStyles[o.status]}`}>{o.status}</Badge>
                                    </div>
                                    {o.department && <p className="text-xs text-neutral-500">{o.department.name}</p>}
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[10px] capitalize bg-neutral-50">{o.employment_type.replace('_', ' ')}</Badge>
                                        <span className="text-xs text-neutral-400 flex items-center gap-1"><Users className="w-3 h-3" />{o.openings_count} {o.openings_count > 1 ? 'positions' : 'position'}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            ) : (
                candidates.length === 0 ? (
                    <div className="flex flex-col items-center py-16">
                        <Users className="w-8 h-8 text-neutral-200 mb-3" />
                        <h3 className="text-sm font-semibold text-neutral-700">No candidates</h3>
                    </div>
                ) : (
                    <Card className="border-neutral-200"><CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-200">
                                    <th className="text-left text-xs uppercase tracking-wider text-neutral-400 font-medium px-4 py-3">Name</th>
                                    <th className="text-left text-xs uppercase tracking-wider text-neutral-400 font-medium px-4 py-3">Position</th>
                                    <th className="text-left text-xs uppercase tracking-wider text-neutral-400 font-medium px-4 py-3">Source</th>
                                    <th className="text-left text-xs uppercase tracking-wider text-neutral-400 font-medium px-4 py-3">Status</th>
                                    <th className="text-left text-xs uppercase tracking-wider text-neutral-400 font-medium px-4 py-3">Applied</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates.map((c) => (
                                    <tr key={c.id} className="border-b border-neutral-100">
                                        <td className="px-4 py-3"><span className="text-sm font-medium text-black">{c.full_name}</span><br /><span className="text-xs text-neutral-400">{c.email}</span></td>
                                        <td className="px-4 py-3 text-sm text-neutral-600">{c.job_opening?.title || '—'}</td>
                                        <td className="px-4 py-3"><Badge variant="outline" className="text-[10px] capitalize bg-neutral-50">{c.source}</Badge></td>
                                        <td className="px-4 py-3"><Badge variant="outline" className={`text-xs capitalize ${statusStyles[c.overall_status]}`}>{c.overall_status.replace('_', ' ')}</Badge></td>
                                        <td className="px-4 py-3 text-sm text-neutral-500">{new Date(c.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent></Card>
                )
            )}

            {total > pageSize && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</p>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-7 w-7 p-0"><ChevronLeft className="w-4 h-4" /></Button>
                        <span className="text-xs text-neutral-500 px-2">{page}/{totalPages}</span>
                        <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-7 w-7 p-0"><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                </div>
            )}
        </div>
    )
}
