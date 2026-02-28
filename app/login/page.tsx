'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createBrowserSupabaseClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)

            // Log failed attempt
            fetch('/api/auth/log', {
                method: 'POST',
                body: JSON.stringify({ email, success: false }),
            })
            return
        }

        // Log success
        fetch('/api/auth/log', {
            method: 'POST',
            body: JSON.stringify({ email, success: true, userId: data.user.id }),
        })

        // Check if user needs to change password
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase.from('profiles') as any)
            .select('password_changed')
            .eq('id', data.user.id)
            .single()

        if (profile && !profile.password_changed) {
            router.push('/change-password')
        } else {
            router.push('/')
        }
    }

    return (
        <div className="min-h-screen bg-white flex">
            {/* Left: Form */}
            <div className="flex-1 flex items-center justify-center px-6">
                <div className="w-full max-w-sm">
                    <div className="mb-10">
                        <h1 className="text-2xl font-bold tracking-tight text-black">
                            Sign in
                        </h1>
                        <p className="text-neutral-500 text-sm mt-1.5">
                            Enter your credentials to continue
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                required
                                className="h-11 bg-neutral-50 border-neutral-200 focus:border-black focus:ring-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                    Password
                                </Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-neutral-500 hover:text-black transition-colors"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="h-11 bg-neutral-50 border-neutral-200 focus:border-black focus:ring-black pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-black hover:bg-neutral-800 text-white font-medium text-sm"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Continue
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-xs text-neutral-400 mt-6">
                        Contact your administrator if you need access
                    </p>
                </div>
            </div>

            {/* Right: Brand panel */}
            <div className="hidden lg:flex flex-1 bg-black items-center justify-center">
                <div className="text-center px-12">
                    <h2 className="text-4xl font-bold text-white tracking-tight">
                        Employee<br />Portal
                    </h2>
                    <div className="w-12 h-[2px] bg-white/30 mx-auto mt-6 mb-4" />
                    <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                        Company operations dashboard for managing your workforce
                    </p>
                </div>
            </div>
        </div>
    )
}
