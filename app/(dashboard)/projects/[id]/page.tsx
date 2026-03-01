'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    ChevronLeft, Calendar, User, AlignLeft, Activity, ListTodo, Users
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

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

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const { id } = resolvedParams
    const { profile } = useAuth()
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchProject = useCallback(async () => {
        try {
            const res = await fetch(`/api/projects/${id}`)
            if (res.ok) {
                const json = await res.json()
                if (json.success && json.data) {
                    setProject(json.data)
                }
            }
        } catch (err) {
            console.error('Error fetching project:', err)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchProject()
    }, [fetchProject])

    if (loading) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-[300px] md:col-span-2 rounded-xl" />
                    <Skeleton className="h-[300px] rounded-xl" />
                </div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <h3 className="text-xl font-bold text-black">Project Not Found</h3>
                <p className="text-neutral-500">The project you're looking for doesn't exist or you don't have access.</p>
                <Link href="/projects">
                    <Button variant="outline" className="mt-4"><ChevronLeft className="w-4 h-4 mr-2" /> Back to Projects</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header & Breadcrumb */}
            <div>
                <Link href="/projects" className="inline-flex items-center text-xs text-neutral-500 hover:text-black mb-4 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Back to Projects
                </Link>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-black tracking-tight">{project.name}</h1>
                        <div className="flex items-center gap-3 mt-3">
                            <Badge variant="outline" className={`text-[10px] capitalize ${statusStyles[project.status]}`}>
                                {project.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] capitalize ${priorityStyles[project.priority]}`}>
                                {project.priority} Priority
                            </Badge>
                            {project.department && (
                                <Badge variant="secondary" className="text-[10px] bg-neutral-100 text-neutral-600">
                                    {project.department.name}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column (Overview & Tasks) */}
                <div className="md:col-span-2 space-y-6">
                    {/* Progress Overview */}
                    <Card className="border-neutral-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-neutral-100 bg-neutral-50/50">
                            <CardTitle className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Progress Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-3xl font-black text-black">{project.progress_percentage}%</p>
                                    <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Completion</p>
                                </div>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${project.health === 'on_track' ? 'bg-green-100 text-green-700' :
                                        project.health === 'at_risk' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {project.health?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden mt-4">
                                <div className="h-full bg-black rounded-full transition-all" style={{ width: `${project.progress_percentage}%` }} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Description */}
                    <Card className="border-neutral-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-neutral-100 bg-neutral-50/50">
                            <CardTitle className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2">
                                <AlignLeft className="w-4 h-4" /> Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5 flex flex-col gap-4">
                            <p className="text-sm text-neutral-600 whitespace-pre-wrap leading-relaxed">
                                {project.description || 'No description provided.'}
                            </p>
                            <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-neutral-100">
                                <div>
                                    <p className="text-xs uppercase text-neutral-400 font-semibold mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Start Date</p>
                                    <p className="text-sm text-black font-medium">{project.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-neutral-400 font-semibold mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Deadline</p>
                                    <p className="text-sm text-black font-medium">{project.deadline ? format(new Date(project.deadline), 'MMM d, yyyy') : 'Not set'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tasks */}
                    <Card className="border-neutral-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-neutral-100 bg-neutral-50/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2">
                                <ListTodo className="w-4 h-4" /> Tasks
                            </CardTitle>
                            <Badge variant="outline" className="font-mono text-[10px]">{project.tasks?.length || 0}</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(!project.tasks || project.tasks.length === 0) ? (
                                <div className="p-8 text-center text-sm text-neutral-500">No tasks created yet.</div>
                            ) : (
                                <div className="divide-y divide-neutral-100 relative">
                                    <div className="absolute top-0 bottom-0 left-[27px] w-px bg-neutral-100" />
                                    {project.tasks.map((task: any) => (
                                        <div key={task.id} className="p-4 flex gap-4 hover:bg-neutral-50 transition-colors relative z-10">
                                            <div className={`mt-1 w-3.5 h-3.5 rounded-full border-2 bg-white shrink-0 ${task.status === 'completed' ? 'border-black bg-black' : task.status === 'in_progress' ? 'border-blue-500' : 'border-neutral-300'}`} />
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-neutral-400 line-through' : 'text-black'}`}>{task.title}</p>
                                                    {task.assignee && (
                                                        <Avatar className="w-5 h-5 ml-2 shrink-0">
                                                            <AvatarFallback className="text-[8px] bg-neutral-100 text-neutral-600">
                                                                {task.assignee.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Team) */}
                <div className="space-y-6">
                    <Card className="border-neutral-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-neutral-100 bg-neutral-50/50">
                            <CardTitle className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4" /> Project Lead
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                            {project.lead ? (
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-neutral-200">
                                        <AvatarImage src={project.lead.profile_photo_url || undefined} />
                                        <AvatarFallback className="bg-black text-white text-xs">
                                            {project.lead.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-semibold text-black">{project.lead.full_name}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-500 italic">No lead assigned.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-neutral-100 bg-neutral-50/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-4 h-4" /> Team Members
                            </CardTitle>
                            <Badge variant="outline" className="font-mono text-[10px]">{project.members?.length || 0}</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(!project.members || project.members.length === 0) ? (
                                <div className="p-6 text-center text-sm text-neutral-500">No members assigned.</div>
                            ) : (
                                <div className="divide-y divide-neutral-100">
                                    {project.members.map((member: any) => (
                                        <div key={member.id} className="p-4 flex items-center justify-between hover:bg-neutral-50">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.employee?.profile_photo_url || undefined} />
                                                    <AvatarFallback className="bg-neutral-100 text-neutral-600 text-[10px]">
                                                        {member.employee?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium text-black line-clamp-1">{member.employee?.full_name || 'Unknown'}</p>
                                                    <p className="text-xs text-neutral-500">{member.role?.replace('_', ' ').replace(/\b\w/g, (char: string) => char.toUpperCase()) || 'Member'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
