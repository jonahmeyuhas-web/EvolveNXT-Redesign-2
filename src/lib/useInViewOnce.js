import { useEffect, useRef, useState } from 'react'

// One-shot in-view trigger built on a plain IntersectionObserver.
// Used instead of Motion's whileInView, which proved unreliable when the
// trigger fires mid-scroll; the animate prop path is deterministic.
export function useInViewOnce(margin = '-10% 0px') {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        // Reveal when the element intersects, OR when it has already been
        // carried above the viewport top. A fast scroll can enter and leave
        // an element between two observer samples; the single batched callback
        // then reports only the final, non-intersecting state, which would
        // otherwise leave the text stuck hidden. Checking boundingClientRect
        // catches that fly-past (and elements already scrolled past on load).
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [margin, inView])

  return [ref, inView]
}
