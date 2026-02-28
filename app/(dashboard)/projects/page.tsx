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
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
    FolderKanban, Plus, ChevronLeft, ChevronRight, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Project, PaginatedResponse } from '@/lib/types/database'
import Link from 'next/link'

const statusStyles: Record<string, string> = {
    planning: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    active: 'bg-neutral-900 text-white border-neutral-900',
    on_hold: 'bg-neutral-200 text-neutral-700 border-neutral-300',
    completed: 'bg-neutral-100 text-black border-neutral-200',
    cancelled: 'bg-neutral-100 text-neutral-500 border-neutral-200',
}

const priorityStyles: Record<string, string> = {
    low: 'bg-neutral-50 text-neutral-500 border-neutral-200',
    medium: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    high: 'bg-neutral-200 text-neutral-800 border-neutral-300',
    critical: 'bg-black text-white border-black',
}

const healthLabels: Record<string, string> = {
    on_track: '● On Track',
    at_risk: '● At Risk',
    off_track: '● Off Track',
}

export default function ProjectsPage() {
    const { profile } = useAuth()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [createOpen, setCreateOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const pageSize = 12

    const [form, setForm] = useState({
        name: '', description: '', priority: 'medium', start_date: '', deadline: '',
    })

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'hr_admin' || profile?.role === 'manager'

    const fetchProjects = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() })
            if (search) params.set('search', search)
            if (statusFilter) params.set('status', statusFilter)
            if (priorityFilter) params.set('priority', priorityFilter)

            const res = await fetch(`/api/projects?${params}`)
            if (!res.ok) { setLoading(false); return }
            const json = await res.json()
            if (json.success && json.data) {
                const paginated = json.data as PaginatedResponse<Project>
                setProjects(paginated.data)
                setTotalPages(paginated.totalPages)
                setTotal(paginated.total)
            }
        } catch (err) {
            console.error('Error fetching projects:', err)
        } finally {
            setLoading(false)
        }
    }, [page, search, statusFilter, priorityFilter])

    useEffect(() => { fetchProjects() }, [fetchProjects])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name) { toast.error('Project name is required'); return }
        setSubmitting(true)
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const json = await res.json()
            if (json.success) {
                toast.success('Project created!')
                setCreateOpen(false)
                setForm({ name: '', description: '', priority: 'medium', start_date: '', deadline: '' })
                fetchProjects()
            } else {
                toast.error(json.message)
            }
        } catch { toast.error('Failed to create project') }
        finally { setSubmitting(false) }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-black tracking-tight">Projects</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">{total} projects</p>
                </div>
                {isAdmin && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-black hover:bg-neutral-800 text-white" size="sm">
                                <Plus className="w-3.5 h-3.5" /> New Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Name</Label>
                                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Description</Label>
                                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Priority</Label>
                                        <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Start</Label>
                                        <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Deadline</Label>
                                        <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={submitting} className="bg-black hover:bg-neutral-800 text-white">
                                        {submitting ? 'Creating...' : 'Create'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                    <Input
                        value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        placeholder="Search projects..."
                        className="pl-9 w-[220px] h-9 bg-neutral-50 border-neutral-200"
                    />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
                    <SelectTrigger className="w-[130px] h-9 bg-neutral-50 border-neutral-200"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v === 'all' ? '' : v); setPage(1) }}>
                    <SelectTrigger className="w-[130px] h-9 bg-neutral-50 border-neutral-200"><SelectValue placeholder="Priority" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Project Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-lg" />)}
                </div>
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FolderKanban className="w-8 h-8 text-neutral-200 mb-3" />
                    <h3 className="text-sm font-semibold text-neutral-700">No projects found</h3>
                    <p className="text-xs text-neutral-400 mt-1">Create a project to get started</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map((project) => (
                            <Link key={project.id} href={`/projects/${project.id}`}>
                                <Card className="border-neutral-200 hover:border-neutral-400 transition-colors cursor-pointer h-full">
                                    <CardContent className="p-5 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-sm font-semibold text-black line-clamp-1">{project.name}</h3>
                                            <Badge variant="outline" className={`text-[10px] capitalize shrink-0 ml-2 ${statusStyles[project.status]}`}>
                                                {project.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        {project.description && (
                                            <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{project.description}</p>
                                        )}
                                        {/* Progress */}
                                        <div className="mt-auto space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-neutral-400">Progress</span>
                                                <span className="text-black font-medium">{project.progress_percentage}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-black rounded-full transition-all" style={{ width: `${project.progress_percentage}%` }} />
                                            </div>
                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`text-[10px] capitalize ${priorityStyles[project.priority]}`}>
                                                        {project.priority}
                                                    </Badge>
                                                    <span className="text-[10px] text-neutral-400">{healthLabels[project.health]}</span>
                                                </div>
                                                {project.lead && (
                                                    <Avatar className="w-5 h-5">
                                                        <AvatarImage src={project.lead.profile_photo_url || undefined} />
                                                        <AvatarFallback className="bg-black text-white text-[8px]">
                                                            {project.lead.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>
                                            {project.deadline && (
                                                <p className="text-[10px] text-neutral-400">
                                                    Due {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-neutral-500">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</p>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-7 w-7 p-0"><ChevronLeft className="w-4 h-4" /></Button>
                            <span className="text-xs text-neutral-500 px-2">{page} / {totalPages}</span>
                            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-7 w-7 p-0"><ChevronRight className="w-4 h-4" /></Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
