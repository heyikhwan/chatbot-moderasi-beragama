"use client";

import Brand from "@/components/brand";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const dynamic = 'force-dynamic';

const LoginPage = () => {
    const searchParams = useSearchParams();
    const errorMessage = searchParams.get("error");

    const handleGoogleLogin = () => {
        window.location.href = "/api/auth/google/login";
    };

    return (
        <main className="min-h-dvh flex flex-col lg:max-w-3xl mx-auto container px-4">
            <div className="flex flex-1 flex-col justify-center px-4 h-screen gap-5">
                <div className="flex flex-col gap-1">
                    <Brand />
                    <p className="text-muted-foreground text-pretty text-justify">
                        Silakan masuk terlebih dahulu
                    </p>
                </div>

                {errorMessage && (
                    <Alert variant="destructive">
                        <AlertDescription>{decodeURIComponent(errorMessage)}</AlertDescription>
                    </Alert>
                )}

                <Button
                    onClick={handleGoogleLogin}
                    className="flex items-center gap-2 py-5 cursor-pointer"
                    type="button"
                >
                    <Image
                        src="/google.svg"
                        width={20}
                        height={20}
                        alt="Google"
                        className="w-5 h-5"
                    />
                    Masuk dengan Google
                </Button>
            </div>
        </main>
    );
};

export default LoginPage;
