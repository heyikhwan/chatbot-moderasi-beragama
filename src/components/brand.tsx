import { Bot } from 'lucide-react'
import React from 'react'

const Brand = () => {
    return (
        <div className="flex items-center gap-2">
            <Bot className="h-14 w-14" />
            <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl">
                Modera AI
            </h1>
        </div>
    )
}

export default Brand
