"use client"

import { useEffect, useState } from "react"

export function LineBot() {
    return (
        <div className="relative h-full w-full text-primary" aria-label="Ilustrasi Modera AI">
            {/* Aura ring halus */}
            <div aria-hidden="true" className="absolute inset-0 rounded-full bg-secondary/60" />

            {/* SVG Bot */}
            <svg
                viewBox="0 0 240 240"
                className="relative z-10 h-full w-full"
                role="img"
                aria-labelledby="modera-bot-title"
                stroke="currentColor"
                fill="none"
            >
                <title id="modera-bot-title">Modera AI line art animation</title>

                {/* Kepala */}
                <rect x="40" y="50" width="160" height="120" rx="18" className="animate-stroke" />
                {/* Antena */}
                <line x1="120" y1="20" x2="120" y2="50" className="animate-stroke" />
                <circle cx="120" cy="18" r="6" className="animate-stroke" />

                {/* Wajah */}
                <g>
                    {/* Mata */}
                    <>
                        <circle cx="90" cy="96" r="8" className="animate-stroke" />
                        <circle cx="150" cy="96" r="8" className="animate-stroke" />
                    </>
                    {/* Mulut */}
                    <path d="M86 132c14 10 54 10 68 0" className="animate-stroke" />
                </g>

                {/* Badan */}
                <rect x="70" y="170" width="100" height="26" rx="8" className="animate-stroke" />

                {/* Gelembung chat kiri */}
                <g className="bubble float-slow" aria-hidden="true">
                    <path
                        d="M30 70h50a10 10 0 0 1 10 10v14a10 10 0 0 1-10 10H56l-12 10v-10H30a10 10 0 0 1-10-10V80A10 10 0 0 1 30 70Z"
                        className="animate-stroke"
                    />
                    <circle cx="45" cy="87" r="3" className="animate-stroke" />
                    <circle cx="55" cy="87" r="3" className="animate-stroke" />
                    <circle cx="65" cy="87" r="3" className="animate-stroke" />
                </g>

                {/* Gelembung chat kanan */}
                <g className="bubble-right float-slower" aria-hidden="true">
                    <path
                        d="M210 120h-50a10 10 0 0 0-10 10v14a10 10 0 0 0 10 10h24l12 10v-10h14a10 10 0 0 0 10-10v-14a10 10 0 0 0-10-10Z"
                        className="animate-stroke"
                    />
                    <rect x="168" y="136" width="14" height="4" rx="2" className="animate-stroke" />
                    <rect x="186" y="136" width="22" height="4" rx="2" className="animate-stroke" />
                </g>
            </svg>
        </div>
    )
}
