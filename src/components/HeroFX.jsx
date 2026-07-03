import { useEffect, useRef } from 'react'

// Interactive hero overlay drawn on a 2D canvas that screen-blends onto the
// film so it illuminates rather than covers. Two effects, both active only
// over the sand (lower area):
//   - a very small deep-electric-blue torch that leaves a fading light trail
//     along the path the cursor takes
//   - a click fires 2-3 short jagged lightning bolts that flash and fade
// Falls back to nothing (plain film shows through) if it can't run.

const SAND_Y = 0.52 // activate only below this fraction of the hero (top = 0)

export default function HeroFX({ sectionRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const section = sectionRef?.current
    if (!canvas || !section) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let disposed = false
    let visible = true
    let W = 0
    let H = 0
    let lastBusy = 0
    let cleared = true

    const ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, px: 0.5, py: 0.5, active: false, seen: false }
    const bolts = []

    const resize = () => {
      const rect = section.getBoundingClientRect()
      // The glow/lightning is soft, so a 1x backing store looks the same and
      // is far cheaper to fill and blend than 2x on retina.
      const dpr = 1
      W = rect.width
      H = rect.height
      canvas.width = Math.max(2, Math.round(W * dpr))
      canvas.height = Math.max(2, Math.round(H * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    // start hidden so there is no blend cost until the user interacts
    canvas.hidden = true

    const inSand = (yFrac) => yFrac > SAND_Y

    const onMove = (e) => {
      if (e.target && e.target.closest && e.target.closest('a, button')) {
        ptr.active = false
        return
      }
      const rect = section.getBoundingClientRect()
      ptr.tx = e.clientX - rect.left
      ptr.ty = e.clientY - rect.top
      if (!ptr.seen) {
        ptr.x = ptr.px = ptr.tx
        ptr.y = ptr.py = ptr.ty
        ptr.seen = true
      }
      ptr.active = inSand(ptr.ty / rect.height)
    }
    const onLeave = () => {
      ptr.active = false
    }
    const onDown = (e) => {
      if (e.target && e.target.closest && e.target.closest('a, button')) return
      const rect = section.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (!inSand(y / rect.height)) return
      const n = 2 + Math.floor(Math.random() * 2) // 2 or 3
      for (let i = 0; i < n; i++) {
        bolts.push({
          x,
          y,
          angle: Math.random() * Math.PI * 2,
          len: 42 + Math.random() * 70, // tiny to mid
          steps: 5 + Math.floor(Math.random() * 3),
          life: 1,
        })
      }
      if (bolts.length > 24) bolts.splice(0, bolts.length - 24)
    }

    section.addEventListener('pointermove', onMove)
    section.addEventListener('pointerleave', onLeave)
    section.addEventListener('pointerdown', onDown)

    let roTimer
    const ro = new ResizeObserver(() => {
      clearTimeout(roTimer)
      roTimer = setTimeout(resize, 120)
    })
    ro.observe(section)

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(section)

    // one crackling bolt: jagged polyline from origin along angle
    const drawBolt = (b) => {
      const dx = Math.cos(b.angle)
      const dy = Math.sin(b.angle)
      const nx = -dy
      const ny = dx
      const stepLen = b.len / b.steps
      let cx = b.x
      let cy = b.y
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      for (let i = 1; i <= b.steps; i++) {
        const jitter = (Math.random() - 0.5) * stepLen * 1.0
        const taper = 1 - i / (b.steps + 1)
        cx += dx * stepLen + nx * jitter * taper
        cy += dy * stepLen + ny * jitter * taper
        ctx.lineTo(cx, cy)
      }
      const a = b.life
      ctx.shadowBlur = 10
      ctx.shadowColor = `rgba(24,63,176,${0.8 * a})`
      ctx.strokeStyle = `rgba(120,170,255,${0.95 * a})`
      ctx.lineWidth = 1.6
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    const step = () => {
      if (disposed) return
      raf = requestAnimationFrame(step)
      if (!visible || document.visibilityState !== 'visible') return

      // Idle short-circuit: when there is nothing to draw (no hover, no bolts,
      // trail already faded), clear once and do no per-frame work at all.
      const now = performance.now()
      if (ptr.active || bolts.length) lastBusy = now
      if (now - lastBusy > 480) {
        if (!cleared) {
          ctx.clearRect(0, 0, W, H)
          cleared = true
          // hide the layer so it stops blending over the playing video too
          canvas.hidden = true
        }
        return
      }
      if (cleared) canvas.hidden = false
      cleared = false

      // fade the whole canvas a little each frame -> trails decay
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,0.10)'
      ctx.fillRect(0, 0, W, H)

      ctx.globalCompositeOperation = 'lighter'

      // torch: ease toward the pointer, draw a trail segment + a small head
      ptr.px = ptr.x
      ptr.py = ptr.y
      ptr.x += (ptr.tx - ptr.x) * 0.28
      ptr.y += (ptr.ty - ptr.y) * 0.28
      if (ptr.active && ptr.seen) {
        // continuous trail line from last position to current
        ctx.strokeStyle = 'rgba(30,84,200,0.34)'
        ctx.lineWidth = 20
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(ptr.px, ptr.py)
        ctx.lineTo(ptr.x, ptr.y)
        ctx.stroke()
        // bright small head (the torch itself)
        const r = 26
        const g = ctx.createRadialGradient(ptr.x, ptr.y, 0, ptr.x, ptr.y, r)
        g.addColorStop(0, 'rgba(90,150,255,0.55)')
        g.addColorStop(0.45, 'rgba(28,80,205,0.3)')
        g.addColorStop(1, 'rgba(18,63,176,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(ptr.x, ptr.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      // bolts: crackle and fade fast
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i]
        b.life -= 0.09
        if (b.life <= 0) {
          bolts.splice(i, 1)
          continue
        }
        drawBolt(b)
      }
    }

    raf = requestAnimationFrame(step)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      section.removeEventListener('pointerdown', onDown)
      ro.disconnect()
      io.disconnect()
      clearTimeout(roTimer)
    }
  }, [sectionRef])

  return <canvas ref={canvasRef} className="hero-fx" aria-hidden="true" />
}
