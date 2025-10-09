import Brand from "@/components/brand"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

const LoginPage = () => {
    return (
        <main className="min-h-dvh flex flex-col lg:max-w-3xl mx-auto container px-4">
            <div className="flex flex-1 flex-col justify-center px-4 h-screen gap-5">
                <div className="flex flex-col gap-1">
                    <Brand />
                    <p className="text-muted-foreground text-pretty text-justify">Silahkan masuk terlebih dahulu</p>
                </div>

                <Link href="/api/auth/google/login">
                    <Button className="flex items-center gap-2 py-5 cursor-pointer" variant="outline" type="button">
                        <Image src="/google.svg" width={16} height={16} alt="Google" className="w-5 h-5" />Masuk dengan Google
                    </Button>
                </Link>
            </div>
        </main>
    )
}

export default LoginPage
