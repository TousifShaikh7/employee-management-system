'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Monitor, Plus, Laptop, Smartphone, Car, Key, Package } from 'lucide-react'
import { toast } from 'sonner'

interface Asset {
    id: string
    name: string
    type: string
    serial_number: string | null
    status: string
    assigned_to: { id: string; full_name: string; profile_photo_url: string | null } | null
    created_at: string
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    laptop: Laptop,
    phone: Smartphone,
    monitor: Monitor,
    vehicle: Car,
    access_card: Key,
    other: Package,
}

const statusStyles: Record<string, string> = {
    available: 'bg-green-50 text-green-700 border-green-200',
    assigned: 'bg-neutral-100 text-black border-neutral-200',
    maintenance: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    retired: 'bg-neutral-100 text-neutral-500 border-neutral-200',
}

export default function AssetsPage() {
    const { profile } = useAuth()
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({ name: '', type: 'laptop', serial_number: '', status: 'available' })

    const fetchAssets = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/assets')
            if (res.ok) {
                const json = await res.json()
                if (json.success) setAssets(json.data || [])
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchAssets() }, [fetchAssets])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name) { toast.error('Asset name is required'); return }
        setSubmitting(true)
        try {
            const res = await fetch('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const json = await res.json()
            if (json.success) {
                toast.success('Asset registered!')
                setCreateOpen(false)
                setForm({ name: '', type: 'laptop', serial_number: '', status: 'available' })
                fetchAssets()
            } else {
                toast.error(json.message)
            }
        } catch { toast.error('Failed to register asset') }
        finally { setSubmitting(false) }
    }

    const available = assets.filter(a => a.status === 'available').length
    const assigned = assets.filter(a => a.status === 'assigned').length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-black tracking-tight">Asset Management</h1>
                    <p className="text-neutral-500 text-sm mt-0.5">{assets.length} assets · {available} available · {assigned} assigned</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-black hover:bg-neutral-800 text-white" size="sm">
                            <Plus className="w-3.5 h-3.5" /> Register Asset
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Register Asset</DialogTitle></DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 mt-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Asset Name</Label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. MacBook Pro 16 inch" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Type</Label>
                                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="laptop">Laptop</SelectItem>
                                            <SelectItem value="phone">Phone</SelectItem>
                                            <SelectItem value="monitor">Monitor</SelectItem>
                                            <SelectItem value="vehicle">Vehicle</SelectItem>
                                            <SelectItem value="access_card">Access Card</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Serial No.</Label>
                                    <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} placeholder="Optional" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={submitting} className="bg-black hover:bg-neutral-800 text-white">
                                    {submitting ? 'Registering...' : 'Register'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Monitor className="w-8 h-8 text-neutral-200 mb-3" />
                    <h3 className="text-sm font-semibold text-neutral-700">No assets registered</h3>
                    <p className="text-xs text-neutral-400 mt-1">Register company assets to track assignments</p>
                </div>
            ) : (
                <Card className="border-neutral-200">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-neutral-200">
                                    <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Asset</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Type</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Serial No.</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Assigned To</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assets.map((asset) => {
                                    const Icon = typeIcons[asset.type] || Package
                                    return (
                                        <TableRow key={asset.id} className="border-neutral-100">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-sm font-medium text-black">{asset.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><span className="text-sm text-neutral-600 capitalize">{asset.type.replace('_', ' ')}</span></TableCell>
                                            <TableCell><span className="text-sm text-neutral-500 font-mono">{asset.serial_number || '—'}</span></TableCell>
                                            <TableCell>
                                                {asset.assigned_to ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="w-6 h-6">
                                                            <AvatarImage src={asset.assigned_to.profile_photo_url || undefined} />
                                                            <AvatarFallback className="bg-black text-white text-[8px]">
                                                                {asset.assigned_to.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-black">{asset.assigned_to.full_name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-neutral-400">Unassigned</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-xs capitalize ${statusStyles[asset.status] || ''}`}>
                                                    {asset.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
