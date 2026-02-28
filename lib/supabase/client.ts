import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createBrowserSupabaseClient() {
    if (client) return client

    client = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                flowType: 'pkce',
                detectSessionInUrl: true,
                persistSession: true,
                autoRefreshToken: true,
                // Use lock with steal to prevent orphaned locks from hanging
                lock: async <R>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
                    if (typeof navigator === 'undefined' || !navigator.locks) {
                        // Fallback: no lock API available
                        return fn()
                    }
                    return await navigator.locks.request(
                        name,
                        { mode: 'exclusive', ifAvailable: true },
                        async (lock) => {
                            if (lock) {
                                return await fn()
                            } else {
                                // Lock not available, try with steal after timeout
                                return await new Promise<R>((resolve, reject) => {
                                    const timeout = setTimeout(() => {
                                        fn().then(resolve).catch(reject)
                                    }, Math.min(acquireTimeout, 1000))
                                    navigator.locks.request(
                                        name,
                                        { mode: 'exclusive' },
                                        async () => {
                                            clearTimeout(timeout)
                                            try {
                                                const result = await fn()
                                                resolve(result)
                                            } catch (err) {
                                                reject(err)
                                            }
                                        }
                                    ).catch((err) => {
                                        clearTimeout(timeout)
                                        reject(err)
                                    })
                                })
                            }
                        }
                    )
                }
            },
        }
    )

    return client
}
