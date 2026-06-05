import { useState, useEffect } from 'react'

export default function CountdownTimer({ targetTimestamp, className = '' }) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!targetTimestamp) return
    const tick = () => {
      const diff = new Date(targetTimestamp).getTime() - Date.now()
      setRemaining(Math.max(0, diff))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetTimestamp])

  if (!targetTimestamp || remaining <= 0) return null

  const h = Math.floor(remaining / 3_600_000)
  const m = Math.floor((remaining % 3_600_000) / 60_000)
  const s = Math.floor((remaining % 60_000) / 1_000)
  const fmt = (n) => String(n).padStart(2, '0')

  return (
    <span className={`font-mono text-secondary ${className}`}>
      {fmt(h)}:{fmt(m)}:{fmt(s)}
    </span>
  )
}
