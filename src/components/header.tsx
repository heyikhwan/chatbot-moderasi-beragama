import { Bot } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

const Header = () => {
    return (
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4 z-50">
            {/* <SidebarTrigger className="-ml-1 cursor-pointer" />
            <Separator orientation="vertical" className="h-6" /> */}

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
                <div>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}

export default Header
