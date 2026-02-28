'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Search, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { Profile, Notification } from '@/lib/types/database'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'

interface TopBarProps {
    profile: Profile | null
    onSignOut: () => Promise<void>
    onOpenCommandPalette: () => void
}

export function TopBar({ profile, onSignOut, onOpenCommandPalette }: TopBarProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifications, setShowNotifications] = useState(false)
    const supabase = createBrowserSupabaseClient()

    const fetchNotifications = useCallback(async () => {
        if (!profile) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from('notifications') as any)
            .select('*')
            .eq('recipient_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(20)
        if (data) {
            setNotifications(data as Notification[])
            setUnreadCount((data as Notification[]).filter((n: Notification) => !n.read).length)
        }
    }, [supabase, profile])

    useEffect(() => {
        fetchNotifications()

        if (!profile) return

        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${profile.id}`,
                },
                (payload) => {
                    const newNotif = payload.new as Notification
                    setNotifications((prev) => [newNotif, ...prev])
                    setUnreadCount((prev) => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, profile, fetchNotifications])

    const markAsRead = async (id: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('notifications') as any).update({ read: true }).eq('id', id)
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    const markAllRead = async () => {
        if (!profile) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('notifications') as any)
            .update({ read: true })
            .eq('recipient_id', profile.id)
            .eq('read', false)
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    const initials = profile?.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'

    return (
        <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 sticky top-0 z-30">
            {/* Logo + Search */}
            <div className="flex items-center gap-6">
                <Link href="/" className="text-[15px] font-bold tracking-tight text-black uppercase">
                    Employee Portal
                </Link>
                <button
                    onClick={onOpenCommandPalette}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-[13px] text-neutral-400 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors w-64"
                >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search...</span>
                    <kbd className="ml-auto text-[10px] bg-white px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-400 font-mono">
                        ⌘K
                    </kbd>
                </button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-neutral-500 hover:text-black h-8 w-8">
                            <Bell className="w-4 h-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <div className="flex items-center justify-between px-3 py-2">
                            <span className="font-semibold text-sm">Notifications</span>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-neutral-500 hover:text-black"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <DropdownMenuSeparator />
                        <ScrollArea className="max-h-80">
                            {notifications.length === 0 ? (
                                <div className="px-3 py-8 text-center text-sm text-neutral-400">
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <DropdownMenuItem
                                        key={notif.id}
                                        className="px-3 py-3 cursor-pointer"
                                        onClick={() => markAsRead(notif.id)}
                                    >
                                        <div className="flex gap-2 w-full">
                                            {!notif.read && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm truncate ${notif.read ? 'text-neutral-500' : 'text-black font-medium'}`}>
                                                    {notif.title}
                                                </p>
                                                {notif.message && (
                                                    <p className="text-xs text-neutral-400 truncate mt-0.5">{notif.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </DropdownMenuItem>
                                ))
                            )}
                        </ScrollArea>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 hover:bg-neutral-100 rounded-md px-2 py-1.5 transition-colors">
                            <Avatar className="w-7 h-7">
                                <AvatarImage src={profile?.profile_photo_url || undefined} />
                                <AvatarFallback className="bg-black text-white text-[11px] font-medium">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-[13px] font-medium text-black hidden sm:block">
                                {profile?.full_name || 'User'}
                            </span>
                            <ChevronDown className="w-3 h-3 text-neutral-400" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <div className="px-3 py-2">
                            <p className="text-sm font-medium">{profile?.full_name}</p>
                            <p className="text-xs text-neutral-500">{profile?.work_email}</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/employees/${profile?.id}`} className="cursor-pointer">
                                <User className="w-4 h-4 mr-2" />
                                Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="cursor-pointer">
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
