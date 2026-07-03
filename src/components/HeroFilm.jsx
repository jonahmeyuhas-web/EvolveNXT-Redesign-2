import { useEffect, useRef, useState } from 'react'

// Optional filmed layer for the hero media frame. Renders nothing until
// src/assets/hero-loop.mp4 exists in the repo (see docs/hero-film.md); the
// canvas atmosphere underneath remains the instant-load base, the fallback,
// and the reduced-motion state.
const films = import.meta.glob('../assets/hero-loop.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
})
const posters = import.meta.glob('../assets/hero-poster.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})
const filmSrc = Object.values(films)[0]
const posterSrc = Object.values(posters)[0]

export default function HeroFilm({ show = true }) {
  const ref = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const onReady = () => setReady(true)
    video.addEventListener('canplaythrough', onReady, { once: true })
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {})
      else video.pause()
    })
    io.observe(video)
    return () => {
      video.removeEventListener('canplaythrough', onReady)
      io.disconnect()
    }
  }, [])

  if (!filmSrc || !show) return null

  return (
    <video
      ref={ref}
      className={`hero-film${ready ? ' hero-film-ready' : ''}`}
      src={filmSrc}
      poster={posterSrc}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-hidden="true"
    />
  )
}
