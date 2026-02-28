'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Building2,
    Briefcase,
    Shield,
    Clock,
    FileText,
    User,
    Users,
} from 'lucide-react'
import type { Profile, EmployeeTimeline, EmployeeDocument } from '@/lib/types/database'
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

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { profile: currentUser } = useAuth()
    const router = useRouter()
    const [employee, setEmployee] = useState<Profile | null>(null)
    const [timeline, setTimeline] = useState<EmployeeTimeline[]>([])
    const [documents, setDocuments] = useState<EmployeeDocument[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserSupabaseClient()

    const fetchEmployee = useCallback(async () => {
        setLoading(true)
        const res = await fetch(`/api/employees/${id}`)
        const json = await res.json()
        if (json.success) {
            setEmployee(json.data)
        }
        setLoading(false)
    }, [id])

    const fetchTimeline = useCallback(async () => {
        const { data } = await supabase
            .from('employee_timeline')
            .select('*')
            .eq('employee_id', id)
            .order('effective_date', { ascending: false })
        if (data) setTimeline(data as unknown as EmployeeTimeline[])
    }, [supabase, id])

    const fetchDocuments = useCallback(async () => {
        const { data } = await supabase
            .from('employee_documents')
            .select('*')
            .eq('employee_id', id)
            .order('uploaded_at', { ascending: false })
        if (data) setDocuments(data as unknown as EmployeeDocument[])
    }, [supabase, id])

    useEffect(() => {
        fetchEmployee()
        fetchTimeline()
        fetchDocuments()
    }, [fetchEmployee, fetchTimeline, fetchDocuments])

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-neutral-500">Employee not found</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/employees')}>
                    Back to Directory
                </Button>
            </div>
        )
    }

    const initials = employee.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-xl font-bold text-black tracking-tight">Profile</h1>
            </div>

            {/* Profile Card */}
            <Card className="border-neutral-200 overflow-hidden">
                <div className="h-20 bg-black" />
                <CardContent className="relative pt-0 pb-6 px-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
                        <Avatar className="w-20 h-20 border-4 border-white">
                            <AvatarImage src={employee.profile_photo_url || undefined} />
                            <AvatarFallback className="bg-neutral-800 text-white text-xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 sm:pb-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-xl font-bold text-black">{employee.full_name}</h2>
                                <Badge variant="outline" className={statusStyles[employee.status]}>
                                    {employee.status.replace('_', ' ')}
                                </Badge>
                            </div>
                            <p className="text-neutral-500 text-sm mt-0.5">
                                {employee.job_title || 'No title'} · {employee.employee_id}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-neutral-100">
                    <TabsTrigger value="overview" className="gap-2 text-xs uppercase tracking-wider">
                        <User className="w-3.5 h-3.5" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="gap-2 text-xs uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5" /> Documents
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="gap-2 text-xs uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" /> Timeline
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Personal Details */}
                        <Card className="border-neutral-200">
                            <CardHeader>
                                <CardTitle className="text-xs font-medium uppercase tracking-wider text-neutral-400">Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <InfoRow icon={Mail} label="Work Email" value={employee.work_email} />
                                <InfoRow icon={Mail} label="Personal Email" value={employee.personal_email || '—'} />
                                <InfoRow icon={Phone} label="Phone" value={employee.phone || '—'} />
                                <InfoRow icon={Shield} label="Emergency Contact" value={
                                    employee.emergency_contact_name
                                        ? `${employee.emergency_contact_name} (${employee.emergency_contact_phone || '—'})`
                                        : '—'
                                } />
                            </CardContent>
                        </Card>

                        {/* Work Details */}
                        <Card className="border-neutral-200">
                            <CardHeader>
                                <CardTitle className="text-xs font-medium uppercase tracking-wider text-neutral-400">Work Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <InfoRow icon={Building2} label="Department" value={employee.department?.name || '—'} />
                                <InfoRow icon={Briefcase} label="Employment Type" value={typeLabels[employee.employment_type]} />
                                <InfoRow icon={MapPin} label="Work Location" value={employee.work_location} />
                                <InfoRow icon={Calendar} label="Date of Joining" value={
                                    employee.date_of_joining
                                        ? new Date(employee.date_of_joining).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                        : '—'
                                } />
                                <InfoRow icon={Users} label="Role" value={employee.role.replace('_', ' ')} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Skills */}
                    {employee.skills && employee.skills.length > 0 && (
                        <Card className="border-neutral-200">
                            <CardHeader>
                                <CardTitle className="text-xs font-medium uppercase tracking-wider text-neutral-400">Skills</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {employee.skills.map((skill, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs bg-neutral-100 text-neutral-700">{skill}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="documents">
                    <Card className="border-neutral-200">
                        <CardHeader>
                            <CardTitle className="text-xs font-medium uppercase tracking-wider text-neutral-400">Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {documents.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-center">
                                    <FileText className="w-8 h-8 text-neutral-200 mb-3" />
                                    <p className="text-sm text-neutral-400">No documents uploaded yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-md bg-neutral-50">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-neutral-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-black">{doc.file_name}</p>
                                                    <p className="text-xs text-neutral-400 capitalize">{doc.document_type.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-neutral-400">
                                                {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="timeline">
                    <Card className="border-neutral-200">
                        <CardHeader>
                            <CardTitle className="text-xs font-medium uppercase tracking-wider text-neutral-400">Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {timeline.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-center">
                                    <Clock className="w-8 h-8 text-neutral-200 mb-3" />
                                    <p className="text-sm text-neutral-400">No timeline events yet</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-200" />
                                    <div className="space-y-6">
                                        {timeline.map((event) => (
                                            <div key={event.id} className="relative flex gap-4 pl-10">
                                                <div className="absolute left-2.5 w-3 h-3 rounded-full bg-black border-2 border-white" />
                                                <div>
                                                    <p className="text-sm font-medium text-black">{event.description}</p>
                                                    <p className="text-xs text-neutral-400 mt-0.5">
                                                        {new Date(event.effective_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
}) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-neutral-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-400">{label}</p>
                <p className="text-sm text-black capitalize truncate">{value}</p>
            </div>
        </div>
    )
}
