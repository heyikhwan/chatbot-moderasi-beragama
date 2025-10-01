"use client"

import { useState } from "react"

const Chat = () => {
    const [message, setMessage] = useState([
        {
            content: "Halo, apa kabar?",
            role: "user"
        },
        {
            content: "Halo, aku Modera AI. Ada yang bisa aku bantu?",
            role: "bot"
        }
    ])

    return (
        <div className="mb-2">
            {message.map((item, index) => (
                <div key={index} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"} mb-2`}>
                    <div className={`flex flex-col ${item.role === "user" ? "items-end" : "items-start"}`}>
                        <div className={`${item.role === "user" ? "bg-input" : "bg-none"} rounded-4xl py-2.5 px-4`}>
                            <p>{item.content}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Chat
