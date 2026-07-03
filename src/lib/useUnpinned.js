import { useEffect, useState } from 'react'

function useMediaFlag(query) {
  const [match, setMatch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatch(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return match
}

// Pinned scroll choreography is disabled on small viewports and under
// prefers-reduced-motion; sections render as clean stacked layouts instead.
export function useUnpinned() {
  const small = useMediaFlag('(max-width: 999px)')
  const reducedMotion = useMediaFlag('(prefers-reduced-motion: reduce)')
  return { unpinned: small || reducedMotion, small, reducedMotion }
}
