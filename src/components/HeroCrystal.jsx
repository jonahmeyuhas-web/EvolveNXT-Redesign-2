import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useLenis } from 'lenis/react'
import { hero } from '../content/site'
import { useUnpinned } from '../lib/useUnpinned'
import { hasWebGL2 } from '../lib/webgl'
import posterUrl from '../assets/hero-crystal-poster.jpg'

// The three/@react-three bundle is code-split behind React.lazy so it is NOT
// in the initial chunk and never blocks first paint. It is imported ONLY when
// the full crystal experience runs (large viewport + motion allowed + WebGL2).
// Under any fallback condition the import statement below is never reached, so
// the 3D chunk is never fetched.
const CrystalScene = lazy(() => import('./crystal/CrystalScene.jsx'))

function clamp01(x) {
  return Math.min(1, Math.max(0, x))
}
function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

// Real hero copy (site headline / sub / CTAs) in the site's Switzer type and
// .hero-copy patterns, shared by the pinned crystal overlay and the static
// poster fallback.
function HeroCopy() {
  return (
    <div className="hero-copy">
      <h1 className="h-display">
        {hero.headline.map((line) => (
          <span className="mask" key={line}>
            <span className="mask-line">{line}</span>
          </span>
        ))}
      </h1>
      <p className="hero-sub">{hero.sub}</p>
      <div className="hero-ctas">
        <a className="pill pill-royal" href={hero.cta.href}>
          {hero.cta.label}
        </a>
        <a className="quiet-link" href={hero.secondary.href}>
          {hero.secondary.label}
        </a>
      </div>
    </div>
  )
}

// Static poster hero: a still of the seated crystal over the warm-white field
// with the real headline. No pin, no canvas, no 3D chunk. Used on small
// viewports, under prefers-reduced-motion, and when WebGL2 is unavailable.
function PosterHero() {
  return (
    <section className="hero crystal-poster-hero">
      <div
        className="crystal-poster"
        style={{ backgroundImage: `url(${posterUrl})` }}
        aria-hidden="true"
      />
      {/* Warm scrim (flat fill, no gradient) lifts the poster so the copy
          stays crisp, mirroring the site's existing .hero-scrim pattern. */}
      <div className="crystal-poster-scrim" aria-hidden="true" />
      <HeroCopy />
    </section>
  )
}

export default function HeroCrystal() {
  const { unpinned, reducedMotion } = useUnpinned()
  // WebGL2 probe runs once; if it fails we take the poster path and never
  // load the 3D chunk.
  const [webgl] = useState(() => hasWebGL2())
  const fallback = unpinned || reducedMotion || !webgl

  const trackRef = useRef(null)
  const headlineRef = useRef(null)
  const hintRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)

  // Drive the HTML hero copy (headline lift/fade) from the SITE's Lenis, the
  // single smoothing layer. p is measured against the crystal track (not the
  // document) so the sections below do not stretch the choreography.
  const lenis = useLenis((inst) => {
    if (fallback || !trackRef.current) return
    const end = Math.max(1, trackRef.current.offsetHeight - window.innerHeight)
    const p = clamp01(inst.scroll / end)

    if (headlineRef.current) {
      const t = clamp01((p - 0.02) / 0.11)
      const e = easeInOutCubic(t)
      headlineRef.current.style.opacity = String(1 - e)
      headlineRef.current.style.transform = `translateY(${-e * 60}px)`
      headlineRef.current.style.filter = `blur(${e * 10}px)`
    }
    if (hintRef.current) {
      const t = clamp01((p - 0.015) / 0.07)
      hintRef.current.style.opacity = String((1 - t) * 0.4)
    }
  })

  // Keep the doc scrollable to the track even before Lenis is ready.
  useEffect(() => {
    if (fallback) return
    // no-op: ReactLenis (App.jsx) owns raf; we only read from it above.
    void lenis
  }, [fallback, lenis])

  if (fallback) return <PosterHero />

  return (
    <>
      {/* Fixed pinned canvas layer. Poster shows immediately; the live canvas
          cross-fades in once its first frame is drawn (no pop, no flash). */}
      <div className="crystal-pin">
        <div
          className="crystal-poster crystal-poster-fixed"
          style={{
            backgroundImage: `url(${posterUrl})`,
            opacity: canvasReady ? 0 : 1,
          }}
          aria-hidden="true"
        />
        <div
          className="crystal-canvas"
          style={{ opacity: canvasReady ? 1 : 0 }}
        >
          <Suspense fallback={null}>
            <CrystalScene
              trackRef={trackRef}
              onReady={() => setCanvasReady(true)}
            />
          </Suspense>
        </div>
      </div>

      {/* Real hero copy over the scene; lifts away with blur + fade in Act 1. */}
      <div className="crystal-headline" ref={headlineRef}>
        <HeroCopy />
      </div>
      <div className="crystal-hint" ref={hintRef} aria-hidden="true">
        scroll
      </div>

      {/* Scroll track: the tall spacer that gives the pinned canvas its
          travel. The Statement section overlaps its final viewport (see
          sections.css) and the crystal docks into the Statement's mark
          anchor. */}
      <div className="crystal-track" ref={trackRef} aria-hidden="true" />
    </>
  )
}
