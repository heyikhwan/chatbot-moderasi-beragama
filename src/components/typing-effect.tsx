import { useEffect, useState } from "react"

export function TypingEffect({ text, speed = 40 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState("")

  useEffect(() => {
    let isCancelled = false

    async function typeText() {
      setDisplayedText("")
      for (let i = 0; i < text.length; i++) {
        if (isCancelled) break
        setDisplayedText((prev) => prev + text[i])
        await new Promise((resolve) => setTimeout(resolve, speed))
      }
    }

    typeText()

    return () => {
      isCancelled = true
    }
  }, [text, speed])

  return <span>{displayedText}</span>
}
