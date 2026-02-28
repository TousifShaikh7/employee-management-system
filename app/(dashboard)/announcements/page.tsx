'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Megaphone, Plus, Pin, FileText, Shield } from 'lucide-react'
import { toast } from 'sonner'
import type { Announcement, Policy } from '@/lib/types/database'

type Tab = 'announcements' | 'policies'

export default function AnnouncementsPage() {
    const { profile } = useAuth()
    const [tab, setTab] = useState<Tab>('announcements')
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [policies, setPolicies] = useState<Policy[]>([])
    const [loading, setLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({ title: '', body: '', is_pinned: false })

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'hr_admin'

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/announcements?tab=${tab}`)
            if (!res.ok) { setLoading(false); return }
            const json = await res.json()
            if (json.success) {
                if (tab === 'announcements') setAnnouncements(json.data || [])
                else setPolicies(json.data || [])
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }, [tab])

    useEffect(() => { fetchData() }, [fetchData])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/announcements', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'announcement', ...form }),
            })
            const json = await res.json()
            if (json.success) { toast.success('Announcement posted!'); setCreateOpen(false); setForm({ title: '', body: '', is_pinned: false }); fetchData() }
            else toast.error(json.message)
        } catch { toast.error('Failed to post announcement') }
        finally { setSubmitting(false) }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-black tracking-tight">Announcements</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">Company news & policies</p>
                </div>
                {isAdmin && tab === 'announcements' && (
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-black hover:bg-neutral-800 text-white" size="sm"><Plus className="w-3.5 h-3.5" /> New Announcement</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Title</Label>
                                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Content</Label>
                                    <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} required />
                                </div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} className="accent-black" />
                                    Pin this announcement
                                </label>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={submitting} className="bg-black hover:bg-neutral-800 text-white">{submitting ? 'Posting...' : 'Post'}</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex items-center gap-0 border-b border-neutral-200">
                {(['announcements', 'policies'] as Tab[]).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2.5 text-[13px] font-medium uppercase tracking-wide transition-colors relative ${tab === t ? 'text-black' : 'text-neutral-400 hover:text-neutral-700'}`}>
                        {t}{tab === t && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-black" />}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : tab === 'announcements' ? (
                announcements.length === 0 ? (
                    <div className="flex flex-col items-center py-16">
                        <Megaphone className="w-8 h-8 text-neutral-200 mb-3" />
                        <h3 className="text-sm font-semibold text-neutral-700">No announcements</h3>
                        <p className="text-xs text-neutral-400 mt-1">Company announcements will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((a) => (
                            <Card key={a.id} className={`border-neutral-200 ${a.is_pinned ? 'border-l-2 border-l-black' : ''}`}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {a.is_pinned && <Pin className="w-3.5 h-3.5 text-black" />}
                                            <h3 className="text-sm font-semibold text-black">{a.title}</h3>
                                        </div>
                                        <span className="text-[10px] text-neutral-400 shrink-0 ml-4">
                                            {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-600 whitespace-pre-line">{a.body}</p>
                                    {a.author && (
                                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-100">
                                            <Avatar className="w-5 h-5">
                                                <AvatarImage src={a.author.profile_photo_url || undefined} />
                                                <AvatarFallback className="bg-black text-white text-[8px]">{a.author.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs text-neutral-400">{a.author.full_name}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            ) : (
                policies.length === 0 ? (
                    <div className="flex flex-col items-center py-16">
                        <Shield className="w-8 h-8 text-neutral-200 mb-3" />
                        <h3 className="text-sm font-semibold text-neutral-700">No policies</h3>
                        <p className="text-xs text-neutral-400 mt-1">Company policies will appear here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {policies.map((p) => (
                            <Card key={p.id} className="border-neutral-200">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                                        <div>
                                            <h3 className="text-sm font-semibold text-black">{p.title}</h3>
                                            {p.description && <p className="text-xs text-neutral-500 mt-1">{p.description}</p>}
                                            <div className="flex items-center gap-3 mt-2">
                                                <Badge variant="outline" className="text-[10px] bg-neutral-50">v{p.version}</Badge>
                                                <span className="text-[10px] text-neutral-400">{new Date(p.published_at).toLocaleDateString()}</span>
                                                {p.requires_acknowledgement && <Badge variant="outline" className="text-[10px] bg-neutral-100">Requires Ack</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            )}
        </div>
    )
}
