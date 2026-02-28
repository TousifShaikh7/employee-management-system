'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createBrowserSupabaseClient()

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            })

            if (updateError) {
                toast.error(updateError.message)
                return
            }

            // Mark password as changed in profile
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('profiles') as any)
                    .update({ password_changed: true })
                    .eq('id', user.id)
            }

            toast.success('Password changed successfully!')
            router.push('/')
            router.refresh()
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const passwordStrength = (pwd: string) => {
        let strength = 0
        if (pwd.length >= 8) strength++
        if (/[A-Z]/.test(pwd)) strength++
        if (/[0-9]/.test(pwd)) strength++
        if (/[^A-Za-z0-9]/.test(pwd)) strength++
        return strength
    }

    const strength = passwordStrength(newPassword)
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
    const strengthColors = ['', 'bg-neutral-300', 'bg-neutral-400', 'bg-neutral-600', 'bg-black']

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-black tracking-tight">Set password</h1>
                    <p className="text-neutral-500 text-sm mt-1.5">
                        You must set a new password before continuing
                    </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                            New Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="new-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
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
                        {newPassword && (
                            <div className="space-y-1.5">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : 'bg-neutral-100'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-neutral-400">{strengthLabels[strength]}</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                            Confirm Password
                        </Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="h-11 bg-neutral-50 border-neutral-200 focus:border-black focus:ring-black"
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-600">Passwords do not match</p>
                        )}
                    </div>
                    <ul className="text-xs text-neutral-400 space-y-1">
                        <li className={newPassword.length >= 8 ? 'text-black' : ''}>
                            • At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(newPassword) ? 'text-black' : ''}>
                            • One uppercase letter
                        </li>
                        <li className={/[0-9]/.test(newPassword) ? 'text-black' : ''}>
                            • One number
                        </li>
                        <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-black' : ''}>
                            • One special character
                        </li>
                    </ul>
                    <Button
                        type="submit"
                        disabled={loading || newPassword !== confirmPassword || strength < 2}
                        className="w-full h-11 bg-black hover:bg-neutral-800 text-white font-medium text-sm"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Set New Password'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
