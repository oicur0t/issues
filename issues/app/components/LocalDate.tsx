'use client'

import { useEffect, useState } from 'react'

const FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

/**
 * Renders a date/time in the viewer's local timezone without a hydration mismatch.
 * The server (usually UTC) and the browser disagree on local time, so the first render is
 * deterministic (UTC) and switches to local time after mount.
 */
export function LocalDate({ date }: Readonly<{ date: Date | string }>) {
  const time = new Date(date).getTime()
  const [text, setText] = useState(() =>
    new Intl.DateTimeFormat('en-US', { ...FORMAT, timeZone: 'UTC' }).format(time)
  )

  useEffect(() => {
    setText(new Intl.DateTimeFormat('en-US', FORMAT).format(time))
  }, [time])

  return <span suppressHydrationWarning>{text}</span>
}
