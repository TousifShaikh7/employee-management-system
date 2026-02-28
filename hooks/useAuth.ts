'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    profile: Profile | null
    loading: boolean
    signOut: () => Promise<void>
}

export function useAuth(): AuthState {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const supabaseRef = useRef(createBrowserSupabaseClient())
    const supabase = supabaseRef.current

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase.from('profiles') as any)
                .select('*, department:departments!department_id(*), branch:branches!branch_id(*)')
                .eq('id', userId)
                .single()
            setProfile(data as Profile | null)
        } catch (err) {
            console.error('Error fetching profile:', err)
        }
    }, [supabase])

    useEffect(() => {
        let cancelled = false

        const getInitialSession = async () => {
            try {
                // Use getSession() instead of getUser() — it doesn't require the
                // web lock and reads from the local cache first, avoiding the hang.
                const { data: { session } } = await supabase.auth.getSession()
                if (cancelled) return

                const currentUser = session?.user ?? null
                setUser(currentUser)
                if (currentUser) {
                    await fetchProfile(currentUser.id)
                }
            } catch (err) {
                console.error('Auth initialization error:', err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        // Add a safety timeout — if auth doesn't resolve in 5 seconds,
        // stop loading to prevent infinite white screen
        const safetyTimeout = setTimeout(() => {
            if (!cancelled) {
                setLoading(false)
            }
        }, 5000)

        getInitialSession().then(() => clearTimeout(safetyTimeout))

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (cancelled) return
                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user)
                    await fetchProfile(session.user.id)
                    setLoading(false)
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                    setProfile(null)
                    setLoading(false)
                } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                    setUser(session.user)
                } else if (event === 'INITIAL_SESSION') {
                    const currentUser = session?.user ?? null
                    setUser(currentUser)
                    if (currentUser) {
                        await fetchProfile(currentUser.id)
                    }
                    setLoading(false)
                }
            }
        )

        return () => {
            cancelled = true
            clearTimeout(safetyTimeout)
            subscription.unsubscribe()
        }
    }, [supabase, fetchProfile])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        window.location.href = '/login'
    }, [supabase])

    return { user, profile, loading, signOut }
}
