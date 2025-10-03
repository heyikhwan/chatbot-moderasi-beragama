import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Hero } from "@/components/pages/home/hero"
import { Features } from "@/components/pages/home/features"

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col">
      <Hero />
      <Features />
      <section className="border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-balance text-2xl font-semibold md:text-3xl">Siap memulai percakapan yang bermakna?</h2>
            <p className="text-muted-foreground max-w-2xl text-pretty">
              Eksplorasi nilai toleransi, inklusif, dan saling menghargai bersama Modera AI. Tanyakan apa saja tentang
              moderasi beragama—aku siap membantu.
            </p>
            <div>
              <Link href="/chat" aria-label="Mulai chat dengan Modera AI">
                <Button size="lg" className="rounded-lg">
                  Mulai Chat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
