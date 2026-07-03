import { useEffect, useState } from 'react'
import { nav } from '../content/site'
import logo from '../assets/evolvenxt-logo-dark.png'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav${scrolled ? ' nav-scrolled' : ''}`}>
      <div className="nav-inner">
        <a className="nav-logo" href="https://evolvenxt.com/" aria-label="EvolveNXT home">
          <img src={logo} alt="EvolveNXT" />
        </a>
        <nav className="nav-links" aria-label="Primary">
          {nav.links.map((l) => (
            <a key={l.label} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <a className="nav-contact" href={nav.contact.href}>
            {nav.contact.label}
          </a>
          <a className="pill pill-royal nav-cta" href={nav.cta.href}>
            {nav.cta.label}
          </a>
        </div>
      </div>
    </header>
  )
}
