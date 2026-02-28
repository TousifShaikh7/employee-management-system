'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, DollarSign, FileText } from 'lucide-react'
import type { Payslip, PayrollRun, SalaryComponentRecord } from '@/lib/types/database'

const statusStyles: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    processing: 'bg-neutral-200 text-neutral-700 border-neutral-300',
    completed: 'bg-neutral-100 text-black border-neutral-200',
    failed: 'bg-neutral-200 text-neutral-700 border-neutral-300',
}

type Tab = 'payslips' | 'runs' | 'salary'

export default function PayrollPage() {
    const { profile } = useAuth()
    const [tab, setTab] = useState<Tab>('payslips')
    const [payslips, setPayslips] = useState<Payslip[]>([])
    const [runs, setRuns] = useState<PayrollRun[]>([])
    const [salaryComponents, setSalaryComponents] = useState<SalaryComponentRecord[]>([])
    const [loading, setLoading] = useState(true)

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'hr_admin'

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/payroll?tab=${tab}`)
            if (!res.ok) { setLoading(false); return }
            const json = await res.json()
            if (json.success) {
                if (tab === 'payslips') setPayslips(json.data || [])
                else if (tab === 'runs') setRuns(json.data || [])
                else if (tab === 'salary') setSalaryComponents(json.data || [])
            }
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }, [tab])

    useEffect(() => { fetchData() }, [fetchData])

    const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

    const tabs: Tab[] = isAdmin ? ['payslips', 'runs', 'salary'] : ['payslips']

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-black tracking-tight">Payroll</h1>
                <p className="text-neutral-500 text-sm mt-0.5">Salary, payslips & compensation</p>
            </div>

            <div className="flex items-center gap-0 border-b border-neutral-200">
                {tabs.map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2.5 text-[13px] font-medium uppercase tracking-wide transition-colors relative ${tab === t ? 'text-black' : 'text-neutral-400 hover:text-neutral-700'}`}>
                        {t === 'salary' ? 'Salary Components' : t}
                        {tab === t && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-black" />}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : (
                <>
                    {tab === 'payslips' && (
                        payslips.length === 0 ? (
                            <div className="flex flex-col items-center py-16">
                                <FileText className="w-8 h-8 text-neutral-200 mb-3" />
                                <h3 className="text-sm font-semibold text-neutral-700">No payslips</h3>
                                <p className="text-xs text-neutral-400 mt-1">Payslips will appear here after payroll processing</p>
                            </div>
                        ) : (
                            <Card className="border-neutral-200"><CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-neutral-200">
                                            {isAdmin && <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Employee</TableHead>}
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Month</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Gross</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Deductions</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Net Pay</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payslips.map((p) => (
                                            <TableRow key={p.id} className="border-neutral-100">
                                                {isAdmin && (
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="w-7 h-7"><AvatarFallback className="bg-black text-white text-[10px]">{(p as any).employee?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                                                            <span className="text-sm text-black">{(p as any).employee?.full_name}</span>
                                                        </div>
                                                    </TableCell>
                                                )}
                                                <TableCell><span className="text-sm font-medium text-black">{p.month}</span></TableCell>
                                                <TableCell><span className="text-sm text-neutral-600">{formatCurrency(p.gross_pay)}</span></TableCell>
                                                <TableCell><span className="text-sm text-neutral-500">{formatCurrency(p.total_deductions)}</span></TableCell>
                                                <TableCell><span className="text-sm font-semibold text-black">{formatCurrency(p.net_pay)}</span></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent></Card>
                        )
                    )}

                    {tab === 'runs' && (
                        runs.length === 0 ? (
                            <div className="flex flex-col items-center py-16">
                                <Wallet className="w-8 h-8 text-neutral-200 mb-3" />
                                <h3 className="text-sm font-semibold text-neutral-700">No payroll runs</h3>
                            </div>
                        ) : (
                            <Card className="border-neutral-200"><CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-neutral-200">
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Month</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Status</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Completed</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {runs.map((r) => (
                                            <TableRow key={r.id} className="border-neutral-100">
                                                <TableCell><span className="text-sm font-medium text-black">{r.month}</span></TableCell>
                                                <TableCell><Badge variant="outline" className={`text-xs capitalize ${statusStyles[r.status]}`}>{r.status}</Badge></TableCell>
                                                <TableCell><span className="text-sm text-neutral-500">{r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '—'}</span></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent></Card>
                        )
                    )}

                    {tab === 'salary' && (
                        salaryComponents.length === 0 ? (
                            <div className="flex flex-col items-center py-16">
                                <DollarSign className="w-8 h-8 text-neutral-200 mb-3" />
                                <h3 className="text-sm font-semibold text-neutral-700">No salary records</h3>
                            </div>
                        ) : (
                            <Card className="border-neutral-200"><CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-neutral-200">
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Employee</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Component</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Amount</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Effective From</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {salaryComponents.map((s) => (
                                            <TableRow key={s.id} className="border-neutral-100">
                                                <TableCell><span className="text-sm text-black">{(s as any).employee?.full_name || '—'}</span></TableCell>
                                                <TableCell><span className="text-sm text-neutral-600 capitalize">{s.component_name.replace('_', ' ')}</span></TableCell>
                                                <TableCell><span className="text-sm font-medium text-black">{formatCurrency(s.amount)}</span></TableCell>
                                                <TableCell><span className="text-sm text-neutral-500">{new Date(s.effective_from).toLocaleDateString()}</span></TableCell>
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
