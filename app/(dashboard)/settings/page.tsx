'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Settings2, Plus, Building, MapPin, CalendarDays, Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Department, Branch, LeaveType, Shift, CompanySettings } from '@/lib/types/database'

type Tab = 'company' | 'departments' | 'branches' | 'leave_types' | 'shifts'

export default function SettingsPage() {
    const { profile } = useAuth()
    const [tab, setTab] = useState<Tab>('company')
    const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [branches, setBranches] = useState<Branch[]>([])
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
    const [shifts, setShifts] = useState<Shift[]>([])
    const [loading, setLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [createForm, setCreateForm] = useState<Record<string, string>>({})

    const isSuperAdmin = profile?.role === 'super_admin'

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/settings?tab=${tab}`)
            if (!res.ok) { setLoading(false); return }
            const json = await res.json()
            if (json.success) {
                if (tab === 'company') setCompanySettings(json.data)
                else if (tab === 'departments') setDepartments(json.data || [])
                else if (tab === 'branches') setBranches(json.data || [])
                else if (tab === 'leave_types') setLeaveTypes(json.data || [])
                else if (tab === 'shifts') setShifts(json.data || [])
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }, [tab])

    useEffect(() => { fetchData() }, [fetchData])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const typeMap: Record<string, string> = { departments: 'department', branches: 'branch', leave_types: 'leave_type' }
            const res = await fetch('/api/settings', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: typeMap[tab], ...createForm }),
            })
            const json = await res.json()
            if (json.success) { toast.success('Created!'); setCreateOpen(false); setCreateForm({}); fetchData() }
            else toast.error(json.message)
        } catch { toast.error('Failed to create') }
        finally { setSubmitting(false) }
    }

    const getCreateFields = () => {
        if (tab === 'departments') return [{ key: 'name', label: 'Department Name' }]
        if (tab === 'branches') return [{ key: 'name', label: 'Branch Name' }, { key: 'city', label: 'City' }, { key: 'country', label: 'Country' }]
        if (tab === 'leave_types') return [{ key: 'name', label: 'Leave Type Name' }, { key: 'annual_quota', label: 'Annual Quota' }]
        return []
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-black tracking-tight">Settings</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">Organization configuration</p>
                </div>
                {isSuperAdmin && ['departments', 'branches', 'leave_types'].includes(tab) && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-black hover:bg-neutral-800 text-white" size="sm"><Plus className="w-3.5 h-3.5" /> Add New</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader><DialogTitle>Create {tab.replace('_', ' ').replace(/s$/, '')}</DialogTitle></DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 mt-2">
                                {getCreateFields().map(f => (
                                    <div key={f.key} className="space-y-2">
                                        <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">{f.label}</Label>
                                        <Input value={createForm[f.key] || ''} onChange={(e) => setCreateForm({ ...createForm, [f.key]: e.target.value })} required={f.key === 'name'} />
                                    </div>
                                ))}
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={submitting} className="bg-black hover:bg-neutral-800 text-white">{submitting ? 'Creating...' : 'Create'}</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex items-center gap-0 border-b border-neutral-200 overflow-x-auto">
                {(['company', 'departments', 'branches', 'leave_types', 'shifts'] as Tab[]).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2.5 text-[13px] font-medium uppercase tracking-wide transition-colors relative whitespace-nowrap ${tab === t ? 'text-black' : 'text-neutral-400 hover:text-neutral-700'}`}>
                        {t.replace('_', ' ')}{tab === t && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-black" />}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : (
                <>
                    {tab === 'company' && (
                        <Card className="border-neutral-200">
                            <CardContent className="p-5">
                                {companySettings ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4"><Settings2 className="w-4 h-4 text-neutral-400" /><h2 className="text-sm font-semibold text-black">Company Info</h2></div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div><span className="text-neutral-400 text-xs uppercase tracking-wider">Name</span><p className="text-black font-medium mt-1">{companySettings.company_name}</p></div>
                                            <div><span className="text-neutral-400 text-xs uppercase tracking-wider">Timezone</span><p className="text-black font-medium mt-1">{companySettings.timezone}</p></div>
                                            <div><span className="text-neutral-400 text-xs uppercase tracking-wider">Currency</span><p className="text-black font-medium mt-1">{companySettings.currency}</p></div>
                                            <div><span className="text-neutral-400 text-xs uppercase tracking-wider">Financial Year Start</span><p className="text-black font-medium mt-1">Month {companySettings.financial_year_start_month}</p></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8"><p className="text-neutral-400 text-sm">No company settings configured</p></div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {tab === 'departments' && (
                        departments.length === 0 ? (
                            <div className="flex flex-col items-center py-16"><Building className="w-8 h-8 text-neutral-200 mb-3" /><h3 className="text-sm font-semibold text-neutral-700">No departments</h3></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {departments.map((d) => (
                                    <Card key={d.id} className="border-neutral-200">
                                        <CardContent className="p-4 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center"><Building className="w-4 h-4 text-white" /></div>
                                            <div>
                                                <p className="text-sm font-semibold text-black">{d.name}</p>
                                                {(d as any).manager && <p className="text-xs text-neutral-400">Head: {(d as any).manager.full_name}</p>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )
                    )}

                    {tab === 'branches' && (
                        branches.length === 0 ? (
                            <div className="flex flex-col items-center py-16"><MapPin className="w-8 h-8 text-neutral-200 mb-3" /><h3 className="text-sm font-semibold text-neutral-700">No branches</h3></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {branches.map((b) => (
                                    <Card key={b.id} className="border-neutral-200">
                                        <CardContent className="p-4 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center"><MapPin className="w-4 h-4 text-neutral-500" /></div>
                                            <div>
                                                <p className="text-sm font-semibold text-black">{b.name}</p>
                                                <p className="text-xs text-neutral-400">{[b.city, b.country].filter(Boolean).join(', ') || '—'}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )
                    )}

                    {tab === 'leave_types' && (
                        leaveTypes.length === 0 ? (
                            <div className="flex flex-col items-center py-16"><CalendarDays className="w-8 h-8 text-neutral-200 mb-3" /><h3 className="text-sm font-semibold text-neutral-700">No leave types</h3></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {leaveTypes.map((lt) => (
                                    <Card key={lt.id} className="border-neutral-200">
                                        <CardContent className="p-4">
                                            <p className="text-sm font-semibold text-black">{lt.name}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-xs text-neutral-400">{lt.annual_quota} days/year</span>
                                                {lt.carry_forward && <Badge variant="outline" className="text-[10px] bg-neutral-50">Carry Forward</Badge>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )
                    )}

                    {tab === 'shifts' && (
                        shifts.length === 0 ? (
                            <div className="flex flex-col items-center py-16"><Clock className="w-8 h-8 text-neutral-200 mb-3" /><h3 className="text-sm font-semibold text-neutral-700">No shifts configured</h3></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {shifts.map((s) => (
                                    <Card key={s.id} className="border-neutral-200">
                                        <CardContent className="p-4">
                                            <p className="text-sm font-semibold text-black">{s.name}</p>
                                            <p className="text-xs text-neutral-400 mt-1">{s.start_time} – {s.end_time}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    )
}
