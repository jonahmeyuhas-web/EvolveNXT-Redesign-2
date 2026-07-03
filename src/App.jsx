import { useEffect } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import { useUnpinned } from './lib/useUnpinned'
import Nav from './components/Nav'
import Hero from './components/Hero'
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
  const { reducedMotion } = useUnpinned()

  const page = (
    <>
      <Nav />
      <main>
        <Hero />
        <Statement />
        <Lifecycle />
        <ModulesIndex />
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
