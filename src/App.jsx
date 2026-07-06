import { useEffect } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import { useUnpinned } from './lib/useUnpinned'
import { hasWebGL2 } from './lib/webgl'
import Nav from './components/Nav'
import HeroCrystal from './components/HeroCrystal'
import ProductShowcase from './components/ProductShowcase'
import Statement from './components/Statement'
import Lifecycle from './components/Lifecycle'
import ModulesIndex from './components/ModulesIndex'
import LinesOfBusiness from './components/LinesOfBusiness'
import Credibility from './components/Credibility'
import CtaBookend from './components/CtaBookend'
import Footer from './components/Footer'

function LenisExposer() {
  const lenis = useLenis()
  useEffect(() => {
    window.__lenis = lenis
  }, [lenis])
  return null
}

export default function App() {
  const { unpinned, reducedMotion } = useUnpinned()
  // The crystal hero runs (and docks into the Statement) only when the full
  // experience is active: large viewport, motion allowed, WebGL2 present.
  // Otherwise the poster hero and a normal-flow Statement are used.
  const crystalActive = !unpinned && !reducedMotion && hasWebGL2()

  const page = (
    <>
      <Nav />
      <main>
        <HeroCrystal />
        <Statement dock={crystalActive} />
        <Lifecycle />
        <ModulesIndex />
        <ProductShowcase />
        <LinesOfBusiness />
        <Credibility />
        <CtaBookend />
      </main>
      <Footer />
    </>
  )

  if (reducedMotion) return page

  return (
    <ReactLenis root options={{ lerp: 0.09, smoothWheel: true }}>
      <LenisExposer />
      {page}
    </ReactLenis>
  )
}
