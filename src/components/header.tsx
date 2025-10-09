"use client"

import { ArrowDown, Bot, ChevronDown, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useUser } from '@/hooks/useUser'
import Image from 'next/image'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Button } from './ui/button'
import Link from 'next/link'

const Header = () => {
    const { user } = useUser()

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "GET" });
        window.location.href = "/";
    };

    return (
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4 z-50">
            {user && (
                <>
                    <SidebarTrigger className="-ml-1 cursor-pointer" />
                    <Separator orientation="vertical" className="h-6" />
                </>
            )}

            <div className="flex items-center justify-between w-full px-2">
                <div>
                    <div className="flex items-center justify-center gap-3">
                        <Bot className="h-10 w-10" />
                        <div className="flex flex-col gap-0">
                            <h1 className="font-bold text-xl">Modera AI</h1>
                            <small className="text-muted-foreground -mt-1">Universitas Islam Negeri Sultan Syarif Kasim Riau</small>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />

                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" asChild>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-3">
                                            <Image src={user.image} alt={user.name} width={32} height={32} className="w-8 h-8 rounded-full" />
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{user.name}</span>
                                                <small className="text-muted-foreground">{user.email}</small>
                                            </div>
                                        </div>

                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="start">
                                <DropdownMenuItem className="flex items-center gap-2 !text-destructive cursor-pointer" onClick={handleLogout}>
                                    <LogOut className="w-4 h-4 text-destructive" />
                                    Keluar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header
