import { Users, Flower2, BookOpen, Handshake } from "lucide-react"
import CardFeature from "./card-feature"

export function Features() {
    return (
        <section id="fitur" className="w-full">
            <div className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
                <div className="mb-8 flex flex-col items-center text-center">
                    <h2 className="text-balance text-2xl font-semibold md:text-3xl">
                        Kenapa moderasi beragama itu penting?
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
                        Moderasi beragama mengingatkan kita bahwa kedamaian tidak lahir dari keseragaman,
                        tapi dari keberanian untuk saling menghormati dalam perbedaan.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <CardFeature
                        title="Hidup Rukun"
                        description="Perbedaan itu pasti ada. Dengan sikap moderat, kita bisa tetap saling menghargai."
                        Icon={Users}
                    />
                    <CardFeature
                        title="Menjaga Kedamaian"
                        description="Sikap adil dan seimbang membuat kita terhindar dari konflik yang tidak perlu."
                        Icon={Flower2}
                    />
                    <CardFeature
                        title="Belajar dari Perbedaan"
                        description="Keberagaman adalah kekayaan, bukan ancaman."
                        Icon={BookOpen}
                    />
                    <CardFeature
                        title="Bersama Lebih Kuat"
                        description="Dengan saling menghormati, kita bisa membangun masa depan yang lebih baik untuk semua."
                        Icon={Handshake}
                    />
                </div>
            </div>
        </section>
    )
}