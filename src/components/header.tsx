import { Bot } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

const Header = () => {
    return (
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4 z-50">
            {/* <SidebarTrigger className="-ml-1 cursor-pointer" />
            <Separator orientation="vertical" className="h-6" /> */}

            <div className="flex items-center justify-between w-full px-2">
                <Link href="/" className="flex items-center justify-center gap-2">
                    <Bot className="h-6 w-6" />
                    <h1 className="font-bold text-xl">Modera AI</h1>
                </Link>
                <div>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}

export default Header
