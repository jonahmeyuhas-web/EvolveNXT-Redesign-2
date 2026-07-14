import { useEffect } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import { useUnpinned } from './lib/useUnpinned'
import { useHomepageMotion } from './lib/useHomepageMotion'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Proof from './components/Proof'
import Credibility from './components/Credibility'
import Statement from './components/Statement'
import PlatformTour from './components/PlatformTour'
import LinesOfBusiness from './components/LinesOfBusiness'
import CtaBookend from './components/CtaBookend'
import Footer from './components/Footer'

function LenisExposer() {
  const lenis = useLenis()
  useEffect(() => {
    window.__lenis = lenis
  }, [lenis])
  return null
}

// Owns the ported GSAP + ScrollTrigger choreography, bridged to the single
// ReactLenis root. Renders nothing.
function MotionRoot() {
  const lenis = useLenis()
  useHomepageMotion(lenis)
  return null
}

export default function App() {
  const { reducedMotion } = useUnpinned()

  const page = (
    <>
      <Nav />
      <main>
        <Hero />
        <Proof />
        <Credibility />
        <Statement />
        <PlatformTour />
        <LinesOfBusiness />
        <CtaBookend />
      </main>
      <Footer />
    </>
  )

  // Reduced motion: no Lenis, no GSAP. The .motion class (set in index.html)
  // is absent, so every reveal renders in its visible resting state.
  if (reducedMotion) return page

  return (
    <ReactLenis root options={{ autoRaf: false, lerp: 0.09, smoothWheel: true }}>
      <LenisExposer />
      <MotionRoot />
      {page}
    </ReactLenis>
  )
}
