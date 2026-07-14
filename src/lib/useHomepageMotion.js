import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// The approved homepage motion system, ported 1:1 from the mock's GSAP branch.
// Scroll-LINKED, never scroll-CAPTURED. Text / headline / card / row reveals
// are TRIGGERED play-once with completion latches so nothing ends hidden on
// fast scroll or jumps; the only SCRUBBED motion is the Push-to-Focus dolly
// (scale + opacity + position only - no rotation, perspective or blur).
//
// The site's single ReactLenis root is REUSED (passed in): we bridge it to
// ScrollTrigger and drive its rAF from the gsap ticker. ReactLenis is mounted
// with autoRaf:false so there is exactly one rAF driving Lenis.
export function useHomepageMotion(lenis) {
  useEffect(() => {
    if (!lenis) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const cleanups = []
    const intervals = []
    const timeouts = []

    // Reveal helper: mark on, and arm any lazy film inside.
    function reveal(el) {
      el.classList.add('on')
      const lazy = el.querySelector('video.film[data-lazy]')
      if (lazy) armFilm(lazy)
    }

    // ---------- Films: autoplay kick + lazy CTA film + visibility resume ----
    const films = [].slice.call(document.querySelectorAll('video.film'))
    function playFilm(v) {
      if (document.visibilityState === 'hidden') return
      if (v.paused) {
        v.muted = true
        const p = v.play()
        if (p && p.catch) p.catch(() => {})
      }
    }
    function armFilm(v) {
      if (v.dataset.armed) return
      v.dataset.armed = '1'
      playFilm(v)
      v.addEventListener('canplay', () => {
        if (v.dataset.armed) playFilm(v)
      })
    }
    const onVisibility = () => {
      films.forEach((v) => {
        if (v.dataset.armed) playFilm(v)
      })
    }
    document.addEventListener('visibilitychange', onVisibility)
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility))
    films.forEach((v) => {
      if (!v.dataset.lazy) armFilm(v)
    })

    // ---------- SMOOTHING FOUNDATION ----------
    // Lenis is the single source of scroll motion. GSAP's ticker drives Lenis'
    // rAF, Lenis' scroll event drives ScrollTrigger. The page never captures
    // the wheel beyond Lenis' own inertia; keyboard + native scrolling work.
    const onLenisScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onLenisScroll)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    cleanups.push(() => {
      lenis.off('scroll', onLenisScroll)
      gsap.ticker.remove(tick)
    })

    // Anchor navigation stays working, routed through Lenis.
    const anchorHandlers = []
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      const handler = (e) => {
        const id = a.getAttribute('href')
        if (id === '#' || id === '#!') {
          e.preventDefault()
          lenis.scrollTo(0)
          return
        }
        const target = document.querySelector(id)
        if (target) {
          e.preventDefault()
          lenis.scrollTo(target, { offset: -90 })
        }
      }
      a.addEventListener('click', handler)
      anchorHandlers.push([a, handler])
    })
    cleanups.push(() => anchorHandlers.forEach(([a, h]) => a.removeEventListener('click', h)))

    const EASE = 'expo.out' // GSAP match for cubic-bezier(0.16,1,0.3,1)
    const DUR = 0.9
    const SCRUB = 1

    // ============================================================
    // TRIGGERED reveals (time-based, play-once).
    // ============================================================
    const rvs = [].slice.call(document.querySelectorAll('.rv'))
    rvs
      .filter(
        (el) =>
          !el.classList.contains('m-card') &&
          !el.classList.contains('lob-row') &&
          !el.classList.contains('cta-panel'),
      )
      .forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
          reveal(el)
        } else {
          ScrollTrigger.create({
            trigger: el,
            start: 'top 88%',
            once: true,
            onEnter: () => reveal(el),
          })
        }
      })

    // ---------- Masked headline reveal (triggered, latched) ----------
    function maskReveal(head) {
      const lines = [].slice.call(head.querySelectorAll('.mline-s'))
      lines.forEach((l) => (l.style.transition = 'none'))
      gsap.set(lines, { y: 0, yPercent: 110 })
      const tl = gsap.timeline({ paused: true })
      tl.to(lines, { yPercent: 0, duration: 0.95, ease: EASE, stagger: 0.1 })
      let done = false
      function finish() {
        done = true
        tl.progress(1).pause()
      }
      ScrollTrigger.create({
        trigger: head,
        start: 'top 82%',
        once: true,
        onEnter: () => {
          if (!done) tl.play()
        },
      })
      ScrollTrigger.create({ trigger: head, start: 'top 48%', onEnter: finish, onEnterBack: finish })
      if (head.getBoundingClientRect().top < window.innerHeight * 0.48) finish()
    }
    ;[].slice.call(document.querySelectorAll('.maskhead')).forEach(maskReveal)

    // ============================================================
    // CONTINUOUS SPATIAL MOTION - the ONLY scrubbed set (Push to Focus).
    // Transform + opacity ONLY. Centre origin, force3D.
    // ============================================================

    // (1) HEADLINE DOLLY.
    gsap.fromTo(
      '.hero-inner',
      { scale: 1, opacity: 1, y: 0, force3D: true },
      {
        scale: 1.08,
        opacity: 0,
        y: -90,
        ease: 'none',
        force3D: true,
        transformOrigin: '50% 50%',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=82%', scrub: SCRUB },
      },
    )

    // (2) Hero film settles from a touch oversized to rest.
    gsap.fromTo(
      '.panel .panel-media',
      { scale: 1.04 },
      {
        scale: 1,
        ease: 'none',
        force3D: true,
        scrollTrigger: { trigger: '.panel', start: 'top 92%', end: 'top 18%', scrub: SCRUB },
      },
    )

    // (3) CONSOLE PUSH TO FOCUS + recede (one scrubbed timeline owns the scale).
    gsap
      .timeline({
        defaults: { ease: 'none', force3D: true, transformOrigin: '50% 50%' },
        scrollTrigger: { trigger: '.panel', start: 'top bottom', end: 'bottom top', scrub: SCRUB },
      })
      .fromTo('.win-scroll', { scale: 0.92, opacity: 0.5 }, { scale: 1, opacity: 1 })
      .to('.win-scroll', { scale: 1, opacity: 1 })
      .to('.win-scroll', { scale: 0.96 })

    // ============================================================
    // TRIGGERED section sequences.
    // ============================================================

    // Platform tour: each card rises 48px and settles on a fixed-duration tween.
    ;[].slice.call(document.querySelectorAll('.m-card')).forEach((card, i) => {
      card.style.transition = 'none'
      const right = i % 2 === 1
      gsap.set(card, { y: 48, opacity: 0, scale: 0.99 })
      ScrollTrigger.create({
        trigger: card,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(card, {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: DUR,
            ease: EASE,
            delay: right ? 0.08 : 0,
          })
        },
      })
    })

    // Lines of business: mist tone sweep, then rows cascade with hairline draws.
    ;(function () {
      const bg = document.querySelector('.lob-bg')
      if (bg) {
        gsap.set(bg, { y: 0, yPercent: 101 })
        ScrollTrigger.create({
          trigger: '.lob',
          start: 'top 85%',
          once: true,
          onEnter: () => gsap.to(bg, { y: 0, yPercent: 0, duration: 1.0, ease: EASE }),
        })
      }
      const rows = [].slice.call(document.querySelectorAll('.lob-row'))
      rows.forEach((row) => (row.style.transition = 'none'))
      gsap.set(rows, { y: 44, opacity: 0, '--line': 0 })
      ScrollTrigger.create({
        trigger: '.lob-rows',
        start: 'top 82%',
        once: true,
        onEnter: () => {
          gsap.to(rows, { y: 0, opacity: 1, '--line': 1, duration: DUR, ease: EASE, stagger: 0.11 })
        },
      })
    })()

    // CTA bookend: film static; only the content cascades in.
    ;(function () {
      const cta = document.querySelector('.cta-panel')
      if (!cta) return
      let opened = false
      const open = () => {
        if (opened) return
        opened = true
        reveal(cta)
      }
      ScrollTrigger.create({ trigger: cta, start: 'top 85%', once: true, onEnter: open })
      ScrollTrigger.create({ trigger: cta, start: 'top 55%', onEnter: open, onEnterBack: open })
      if (cta.getBoundingClientRect().top < window.innerHeight * 0.85) open()
    })()

    // Footer settles in on a triggered tween.
    ;(function () {
      const fc = document.querySelector('.footer .container')
      if (!fc) return
      gsap.set(fc, { y: 30, opacity: 0.001 })
      ScrollTrigger.create({
        trigger: '.footer',
        start: 'top 92%',
        once: true,
        onEnter: () => gsap.to(fc, { y: 0, opacity: 1, duration: DUR, ease: EASE }),
      })
    })()

    // Recompute once fonts / films settle so triggers sit on true offsets.
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    cleanups.push(() => window.removeEventListener('load', onLoad))
    // Also refresh after fonts resolve (they shift layout).
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh())
    }

    // ---------- Fragment micro-life: offset word flips (words only) ----------
    ;[].slice.call(document.querySelectorAll('[data-flip]')).forEach((el) => {
      const a = el.textContent
      const b = el.getAttribute('data-flip')
      const period = parseInt(el.getAttribute('data-period'), 10) || 8000
      const offset = parseInt(el.getAttribute('data-offset'), 10) || 0
      let state = 0
      const to = setTimeout(() => {
        const iv = setInterval(() => {
          el.style.opacity = '0'
          const to2 = setTimeout(() => {
            state = 1 - state
            el.textContent = state ? b : a
            el.style.opacity = '1'
          }, 360)
          timeouts.push(to2)
        }, period)
        intervals.push(iv)
      }, offset)
      timeouts.push(to)
    })

    // ---------- Hover parallax on atmosphere cards (pointer: fine only) ------
    const parallaxHandlers = []
    if (window.matchMedia('(pointer: fine)').matches) {
      ;[].slice.call(document.querySelectorAll('.m-field')).forEach((field) => {
        const kb = field.querySelector('.m-kb')
        if (!kb) return
        const onMove = (e) => {
          const r = field.getBoundingClientRect()
          const mx = ((e.clientX - r.left) / r.width - 0.5) * -10
          const my = ((e.clientY - r.top) / r.height - 0.5) * -8
          kb.style.transform = 'translate3d(' + mx.toFixed(2) + 'px,' + my.toFixed(2) + 'px,0)'
        }
        const onLeave = () => {
          kb.style.transform = 'translate3d(0,0,0)'
        }
        field.addEventListener('pointermove', onMove)
        field.addEventListener('pointerleave', onLeave)
        parallaxHandlers.push([field, 'pointermove', onMove], [field, 'pointerleave', onLeave])
      })

      // ---------- Cursor-position parallax on the hero console ----------
      const panel = document.querySelector('.panel')
      const wrap = document.querySelector('.win-wrap')
      if (panel && wrap) {
        let tx = 0
        let ty = 0
        let cx = 0
        let cy = 0
        let raf = null
        const tickParallax = () => {
          cx += (tx - cx) * 0.07
          cy += (ty - cy) * 0.07
          wrap.style.transform = 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)'
          if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
            raf = requestAnimationFrame(tickParallax)
          } else {
            raf = null
          }
        }
        const onMove = (e) => {
          const r = panel.getBoundingClientRect()
          tx = ((e.clientX - r.left) / r.width - 0.5) * -10
          ty = ((e.clientY - r.top) / r.height - 0.5) * -8
          if (!raf) raf = requestAnimationFrame(tickParallax)
        }
        const onLeave = () => {
          tx = 0
          ty = 0
          if (!raf) raf = requestAnimationFrame(tickParallax)
        }
        panel.addEventListener('pointermove', onMove)
        panel.addEventListener('pointerleave', onLeave)
        parallaxHandlers.push([panel, 'pointermove', onMove], [panel, 'pointerleave', onLeave])
        cleanups.push(() => {
          if (raf) cancelAnimationFrame(raf)
        })
      }
    }
    cleanups.push(() =>
      parallaxHandlers.forEach(([el, type, h]) => el.removeEventListener(type, h)),
    )

    // Trigger a first refresh on the next frame so triggers measure real layout.
    const refreshTO = setTimeout(() => ScrollTrigger.refresh(), 60)
    timeouts.push(refreshTO)

    return () => {
      cleanups.forEach((fn) => fn())
      intervals.forEach((iv) => clearInterval(iv))
      timeouts.forEach((t) => clearTimeout(t))
      ScrollTrigger.getAll().forEach((st) => st.kill())
      gsap.killTweensOf('.hero-inner')
      gsap.killTweensOf('.panel .panel-media')
      gsap.killTweensOf('.win-scroll')
    }
  }, [lenis])
}
