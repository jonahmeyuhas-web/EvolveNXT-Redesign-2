import { useEffect, useRef } from 'react'

// The hero media surface: slow pools of blue-hour light drifting over a warm
// stone field, with a faint film grain. Pure code; this surface is also the
// slot a filmed loop can occupy later. DPR-capped, first frame painted
// synchronously, pauses offscreen or when the tab is hidden.

const POOLS = [
  { c: [8, 18, 64], a: 0.34, r: 0.8, x: 0.88, y: 0.06, dx: 0.06, dy: 0.08, s: 0.7, ph: 4.1 },
  { c: [27, 76, 193], a: 0.3, r: 0.62, x: 0.72, y: 0.22, dx: 0.09, dy: 0.07, s: 0.9, ph: 1.2 },
  { c: [140, 165, 212], a: 0.5, r: 0.58, x: 0.4, y: 0.5, dx: 0.08, dy: 0.06, s: 1.05, ph: 2.6 },
  { c: [240, 234, 222], a: 0.5, r: 0.52, x: 0.55, y: 0.82, dx: 0.07, dy: 0.05, s: 0.85, ph: 3.4 },
  { c: [253, 249, 239], a: 0.8, r: 0.62, x: 0.08, y: 0.92, dx: 0.05, dy: 0.08, s: 0.75, ph: 5.3 },
]

export default function Atmosphere({ animate = true }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf = 0
    let inView = true
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const rect = canvas.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const grain = document.createElement('canvas')
    grain.width = 128
    grain.height = 128
    const gctx = grain.getContext('2d')
    const noise = gctx.createImageData(128, 128)
    for (let i = 0; i < noise.data.length; i += 4) {
      const v = (110 + Math.random() * 30) | 0
      noise.data[i] = v
      noise.data[i + 1] = v
      noise.data[i + 2] = v
      noise.data[i + 3] = 10
    }
    gctx.putImageData(noise, 0, 0)
    const pattern = ctx.createPattern(grain, 'repeat')

    const draw = (t) => {
      const time = t * 0.000055
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#e7e3d8'
      ctx.fillRect(0, 0, w, h)
      for (const p of POOLS) {
        const px = (p.x + Math.sin(time * p.s * Math.PI * 2 + p.ph) * p.dx) * w
        const py = (p.y + Math.cos(time * p.s * Math.PI * 2 + p.ph * 1.7) * p.dy) * h
        const pr = p.r * Math.max(w, h)
        const g = ctx.createRadialGradient(px, py, 0, px, py, pr)
        g.addColorStop(0, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${p.a})`)
        g.addColorStop(1, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},0)`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }
      if (pattern) {
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, w, h)
      }
    }

    const loop = (t) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      cancelAnimationFrame(raf)
      if (animate && inView && document.visibilityState === 'visible') {
        raf = requestAnimationFrame(loop)
      }
    }

    resize()
    draw(0)
    start()

    const ro = new ResizeObserver(() => {
      resize()
      draw(performance.now())
    })
    ro.observe(canvas)

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) start()
      else cancelAnimationFrame(raf)
    })
    io.observe(canvas)

    const onVis = () => start()
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [animate])

  return <canvas ref={canvasRef} className="atmosphere" aria-hidden="true" />
}
