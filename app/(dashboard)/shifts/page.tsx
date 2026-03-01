'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Clock, Plus, Sun, Moon, Sunset } from 'lucide-react'
import { toast } from 'sonner'

interface Shift {
    id: string
    name: string
    start_time: string
    end_time: string
    department?: { id: string; name: string } | null
}

function getShiftIcon(name: string) {
    const lower = name.toLowerCase()
    if (lower.includes('morning') || lower.includes('day')) return Sun
    if (lower.includes('night') || lower.includes('graveyard')) return Moon
    return Sunset
}

function formatTime(time: string) {
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
}

export default function ShiftsPage() {
    const { profile } = useAuth()
    const [shifts, setShifts] = useState<Shift[]>([])
    const [loading, setLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({ name: '', start_time: '09:00', end_time: '17:00' })

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'hr_admin' || profile?.role === 'manager'

    const fetchShifts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/shifts')
            if (res.ok) {
                const json = await res.json()
                if (json.success) setShifts(json.data || [])
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchShifts() }, [fetchShifts])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name) { toast.error('Shift name is required'); return }
        setSubmitting(true)
        try {
            const res = await fetch('/api/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const json = await res.json()
            if (json.success) {
                toast.success('Shift created!')
                setCreateOpen(false)
                setForm({ name: '', start_time: '09:00', end_time: '17:00' })
                fetchShifts()
            } else {
                toast.error(json.message)
            }
        } catch { toast.error('Failed to create shift') }
        finally { setSubmitting(false) }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-black tracking-tight">Shifts & Rosters</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">{shifts.length} shifts defined</p>
                </div>
                {isAdmin && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-black hover:bg-neutral-800 text-white" size="sm">
                                <Plus className="w-3.5 h-3.5" /> New Shift
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader><DialogTitle>Create Shift</DialogTitle></DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Shift Name</Label>
                                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Morning Shift" required />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Start Time</Label>
                                        <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">End Time</Label>
                                        <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
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

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
                </div>
            ) : shifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Clock className="w-8 h-8 text-neutral-200 mb-3" />
                    <h3 className="text-sm font-semibold text-neutral-700">No shifts defined</h3>
                    <p className="text-xs text-neutral-400 mt-1">Create shifts to manage employee rosters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shifts.map((shift) => {
                        const Icon = getShiftIcon(shift.name)
                        return (
                            <Card key={shift.id} className="border-neutral-200 hover:border-neutral-400 transition-colors">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-semibold text-black flex items-center gap-2">
                                            <Icon className="w-4 h-4" /> {shift.name}
                                        </CardTitle>
                                        {shift.department && (
                                            <Badge variant="secondary" className="text-[10px] bg-neutral-100 text-neutral-600">
                                                {shift.department.name}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="text-center">
                                            <p className="text-xs text-neutral-400 uppercase">Start</p>
                                            <p className="text-lg font-bold text-black">{formatTime(shift.start_time)}</p>
                                        </div>
                                        <div className="w-12 h-px bg-neutral-200 mx-2" />
                                        <div className="text-center">
                                            <p className="text-xs text-neutral-400 uppercase">End</p>
                                            <p className="text-lg font-bold text-black">{formatTime(shift.end_time)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
