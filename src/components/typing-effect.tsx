import { useEffect, useState } from "react"

export function TypingEffect({ text, speed = 22 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState("")
  const [isSkipped, setIsSkipped] = useState(false)

  useEffect(() => {
    setDisplayedText("")
    setIsSkipped(false)

    if (!text) return

    let i = 0
    const interval = setInterval(() => {
      i += 1
      setDisplayedText(text.slice(0, i))

      if (i >= text.length) {
        clearInterval(interval)
      }
    }, speed)

    return () => {
      clearInterval(interval)
    }
  }, [text, speed])

  useEffect(() => {
    if (isSkipped) {
      setDisplayedText(text)
    }
  }, [isSkipped, text])

  return (
    <span onClick={() => setIsSkipped(true)} className="cursor-text">
      {displayedText}
    </span>
  )
}
