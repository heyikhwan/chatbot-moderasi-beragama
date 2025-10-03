import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LineBot } from "@/components/pages/home/line-bot"
import { Bot } from "lucide-react"

export function Hero() {
    return (
        <section className="w-full">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2 md:gap-10 md:py-16">
                <div className="flex flex-col items-start gap-6">
                    <div className="flex items-center gap-2">
                        <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm font-medium text-muted-foreground">Chatbot Edukasi Moderasi Beragama</span>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Bot className="h-14 w-14" />
                            <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl">
                                Modera AI
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-pretty text-justify">
                            Hai, aku <span className="font-semibold">Modera AI</span> — <span className="font-semibold">Universitas Islam Negeri Sultan Syarif Kasim Riau</span>. Teman dialogmu tentang moderasi beragama. Aku mendukung
                            sikap toleran, inklusif, dan saling menghargai di tengah keberagaman.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/chat" aria-label="Mulai chat dengan Modera AI">
                            <Button size="lg" className="cursor-pointer">
                                Mulai Chat
                            </Button>
                        </Link>
                        <Link href="#fitur" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                            Kenapa ini penting?
                        </Link>
                    </div>
                </div>

                <div className="relative ml-auto aspect-square w-full max-w-[420px]">
                    <LineBot />
                </div>
            </div>
        </section>
    )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            fill="none"
            role="img"
            aria-label="ikon cek"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}
