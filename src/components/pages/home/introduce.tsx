import { Bot } from 'lucide-react'

const Introduce = () => {
    return (
        <div className="mb-12">
            <div className="flex items-center justify-center gap-2 mb-5">
                <Bot className="h-10 w-10" />
                <h1 className="font-bold text-4xl">Modera AI</h1>
            </div>
            <p className="text-muted-foreground">
                Hai, aku <span className="font-semibold">Modera AI</span>. Tugasku adalah
                menjadi teman ngobrolmu tentang moderasi beragama — mendukung sikap toleran,
                inklusif, dan saling menghargai di tengah keberagaman.
            </p>
        </div>
    )
}

export default Introduce
