'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Target, Plus, Star, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import type { Goal, ReviewCycle, PerformanceReview } from '@/lib/types/database'

const statusStyles: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    active: 'bg-neutral-900 text-white border-neutral-900',
    review: 'bg-neutral-200 text-neutral-700 border-neutral-300',
    completed: 'bg-neutral-100 text-black border-neutral-200',
    not_started: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    in_progress: 'bg-neutral-200 text-neutral-700 border-neutral-300',
    pending: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    submitted: 'bg-neutral-200 text-neutral-800 border-neutral-300',
    finalized: 'bg-neutral-100 text-black border-neutral-200',
    acknowledged: 'bg-neutral-50 text-neutral-500 border-neutral-200',
}

type Tab = 'reviews' | 'goals' | 'cycles'

export default function PerformancePage() {
    const { profile } = useAuth()
    const [tab, setTab] = useState<Tab>('reviews')
    const [reviews, setReviews] = useState<PerformanceReview[]>([])
    const [goals, setGoals] = useState<Goal[]>([])
    const [cycles, setCycles] = useState<ReviewCycle[]>([])
    const [loading, setLoading] = useState(true)
    const [goalOpen, setGoalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [goalForm, setGoalForm] = useState({ title: '', description: '', due_date: '', level: 'individual' })

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'hr_admin' || profile?.role === 'manager'

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/performance?tab=${tab}`)
            if (!res.ok) { setLoading(false); return }
            const json = await res.json()
            if (json.success) {
                if (tab === 'reviews') setReviews(json.data || [])
                else if (tab === 'goals') setGoals(json.data || [])
                else if (tab === 'cycles') setCycles(json.data || [])
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }, [tab])

    useEffect(() => { fetchData() }, [fetchData])

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/performance', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'goal', ...goalForm }),
            })
            const json = await res.json()
            if (json.success) { toast.success('Goal created!'); setGoalOpen(false); fetchData() }
            else toast.error(json.message)
        } catch { toast.error('Failed to create goal') }
        finally { setSubmitting(false) }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-black tracking-tight">Performance</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">Reviews, goals & OKRs</p>
                </div>
                {isAdmin && tab === 'goals' && (
                    <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-black hover:bg-neutral-800 text-white" size="sm"><Plus className="w-3.5 h-3.5" /> New Goal</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader><DialogTitle>Create Goal</DialogTitle></DialogHeader>
                            <form onSubmit={handleCreateGoal} className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Title</Label>
                                    <Input value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Due Date</Label>
                                        <Input type="date" value={goalForm.due_date} onChange={(e) => setGoalForm({ ...goalForm, due_date: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Level</Label>
                                        <Select value={goalForm.level} onValueChange={(v) => setGoalForm({ ...goalForm, level: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="individual">Individual</SelectItem>
                                                <SelectItem value="team">Team</SelectItem>
                                                <SelectItem value="department">Department</SelectItem>
                                                <SelectItem value="company">Company</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setGoalOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={submitting} className="bg-black hover:bg-neutral-800 text-white">{submitting ? 'Creating...' : 'Create'}</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0 border-b border-neutral-200">
                {(['reviews', 'goals', 'cycles'] as Tab[]).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2.5 text-[13px] font-medium uppercase tracking-wide transition-colors relative ${tab === t ? 'text-black' : 'text-neutral-400 hover:text-neutral-700'}`}>
                        {t}
                        {tab === t && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-black" />}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : (
                <>
                    {/* Reviews */}
                    {tab === 'reviews' && (
                        reviews.length === 0 ? (
                            <div className="flex flex-col items-center py-16">
                                <Star className="w-8 h-8 text-neutral-200 mb-3" />
                                <h3 className="text-sm font-semibold text-neutral-700">No reviews yet</h3>
                                <p className="text-xs text-neutral-400 mt-1">Performance reviews will appear here</p>
                            </div>
                        ) : (
                            <Card className="border-neutral-200"><CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-neutral-200">
                                            {isAdmin && <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Employee</TableHead>}
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Cycle</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Type</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Rating</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reviews.map((r) => (
                                            <TableRow key={r.id} className="border-neutral-100">
                                                {isAdmin && (
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="w-7 h-7"><AvatarFallback className="bg-black text-white text-[10px]">{r.employee?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                                                            <span className="text-sm text-black">{r.employee?.full_name}</span>
                                                        </div>
                                                    </TableCell>
                                                )}
                                                <TableCell><span className="text-sm text-neutral-600">{r.cycle?.name || '—'}</span></TableCell>
                                                <TableCell><span className="text-sm text-neutral-600 capitalize">{r.review_type}</span></TableCell>
                                                <TableCell><span className="text-sm font-medium text-black">{r.overall_rating ? `${r.overall_rating}/5` : '—'}</span></TableCell>
                                                <TableCell><Badge variant="outline" className={`text-xs capitalize ${statusStyles[r.status]}`}>{r.status.replace('_', ' ')}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent></Card>
                        )
                    )}

                    {/* Goals */}
                    {tab === 'goals' && (
                        goals.length === 0 ? (
                            <div className="flex flex-col items-center py-16">
                                <Target className="w-8 h-8 text-neutral-200 mb-3" />
                                <h3 className="text-sm font-semibold text-neutral-700">No goals set</h3>
                                <p className="text-xs text-neutral-400 mt-1">Create goals to track progress</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {goals.map((g) => (
                                    <Card key={g.id} className="border-neutral-200">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <h3 className="text-sm font-semibold text-black">{g.title}</h3>
                                                <Badge variant="outline" className={`text-[10px] capitalize ${statusStyles[g.status]}`}>{g.status.replace('_', ' ')}</Badge>
                                            </div>
                                            {g.description && <p className="text-xs text-neutral-500 line-clamp-2">{g.description}</p>}
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-neutral-400">Progress</span>
                                                <span className="text-black font-medium">{g.current_progress}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-black rounded-full" style={{ width: `${g.current_progress}%` }} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className="text-[10px] capitalize bg-neutral-50">{g.level}</Badge>
                                                {g.due_date && <span className="text-[10px] text-neutral-400">Due {new Date(g.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )
                    )}

                    {/* Cycles */}
                    {tab === 'cycles' && (
                        cycles.length === 0 ? (
                            <div className="flex flex-col items-center py-16">
                                <TrendingUp className="w-8 h-8 text-neutral-200 mb-3" />
                                <h3 className="text-sm font-semibold text-neutral-700">No review cycles</h3>
                                <p className="text-xs text-neutral-400 mt-1">Review cycles will appear here</p>
                            </div>
                        ) : (
                            <Card className="border-neutral-200"><CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-neutral-200">
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Name</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Type</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Period</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cycles.map((c) => (
                                            <TableRow key={c.id} className="border-neutral-100">
                                                <TableCell><span className="text-sm font-medium text-black">{c.name}</span></TableCell>
                                                <TableCell><span className="text-sm text-neutral-600 capitalize">{c.type}</span></TableCell>
                                                <TableCell><span className="text-sm text-neutral-600">{new Date(c.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(c.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></TableCell>
                                                <TableCell><Badge variant="outline" className={`text-xs capitalize ${statusStyles[c.status]}`}>{c.status}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent></Card>
                        )
                    )}
                </>
            )}
        </div>
    )
}
