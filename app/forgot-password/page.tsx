'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const supabase = createBrowserSupabaseClient()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
            })

            if (error) {
                toast.error(error.message)
                return
            }

            setSent(true)
            toast.success('Password reset email sent!')
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {sent ? (
                    <div className="text-center space-y-6">
                        <CheckCircle2 className="w-10 h-10 text-black mx-auto" />
                        <div>
                            <h1 className="text-2xl font-bold text-black tracking-tight">Check your email</h1>
                            <p className="text-neutral-500 text-sm mt-2">
                                If an account exists for <span className="text-black font-medium">{email}</span>,
                                you&apos;ll receive a password reset email shortly.
                            </p>
                        </div>
                        <Link href="/login">
                            <Button variant="outline" className="gap-2 border-neutral-200">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-black tracking-tight">Reset password</h1>
                            <p className="text-neutral-500 text-sm mt-1.5">
                                Enter your work email to receive a reset link
                            </p>
                        </div>

                        <form onSubmit={handleReset} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11 bg-neutral-50 border-neutral-200 focus:border-black focus:ring-black"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-black hover:bg-neutral-800 text-white font-medium text-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>
                            <div className="text-center">
                                <Link
                                    href="/login"
                                    className="text-xs text-neutral-500 hover:text-black transition-colors inline-flex items-center gap-1"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
