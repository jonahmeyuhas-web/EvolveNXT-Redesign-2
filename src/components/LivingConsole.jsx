import { useEffect, useRef } from 'react'

// The living console: a self-contained demo that plays a continuous ask-first
// loop the moment it lands. Ported verbatim from the console prototype's rAF
// timeline engine (scratchpad/mocks2/console/index.html). The DOM is rendered
// by React; the engine runs in a useEffect with full cleanup, respects
// prefers-reduced-motion (static console, no engine), and pauses on
// visibilitychange. Present at rest from first paint, no arrival transition.
export default function LivingConsole() {
  const rootRef = useRef(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return // static console, no engine

    const root = rootRef.current
    if (!root) return
    const q = (sel) => root.querySelector(sel)

    // ---- DOM handles ------------------------------------------------------
    const ghost = q('#ghost')
    const ring = ghost.querySelector('.ring')
    const consoleEl = q('#console')
    const rail = q('#rail')
    const ask = q('#ask')
    const askq = q('#askq')
    const compProg = q('#comp-prog')
    const compBar = compProg.querySelector('.bar')
    const scenes = { onb: q('#sc-onb'), comp: q('#sc-comp'), enr: q('#sc-enr') }
    const railBtns = rail.querySelectorAll('button[data-scene]')
    const QUESTION = ': which producers are ready to sell?'

    // ---- easing --------------------------------------------------------------
    const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3)
    const smootherstep = (u) => u * u * u * (u * (u * 6 - 15) + 10)
    const easeProg = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2)
    const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x)
    const HOP_DUR = (dist) => Math.min(1.15, Math.max(0.5, 0.22 + dist / 600)) * 1000

    // A tiny critically-tuned spring integrator for the "Ask Evolve" pill width.
    function Spring(value, k, d) {
      this.value = value
      this.target = value
      this.v = 0
      this.k = k
      this.d = d
    }
    Spring.prototype.step = function (dt) {
      const steps = dt > 0.032 ? 2 : 1
      const h = dt / steps
      for (let i = 0; i < steps; i++) {
        const a = -this.k * (this.value - this.target) - this.d * this.v
        this.v += a * h
        this.value += this.v * h
      }
      return this.value
    }
    const askWidth = new Spring(116, 190, 24) // rest 116px -> open 356px

    // CURSOR: continuous glide along a quadratic-bezier arc, distance-aware
    // duration, alternating arc side, controlled sub-pixel settle on presses.
    const cursor = {
      x: 40,
      y: 40,
      hop: null,
      side: 1,
      startHop(to, opts) {
        opts = opts || {}
        const from = { x: this.x, y: this.y }
        const dx = to.x - from.x
        const dy = to.y - from.y
        const dist = Math.hypot(dx, dy)
        let dur = HOP_DUR(dist)
        if (opts.dur) dur = opts.dur
        const mx = (from.x + to.x) / 2
        const my = (from.y + to.y) / 2
        const len = dist || 1
        const px = -dy / len
        const py = dx / len
        const arc = Math.min(dist * 0.16, 54) * this.side
        this.side *= -1
        this.hop = {
          from,
          to,
          cx: mx + px * arc,
          cy: my + py * arc,
          tx: dx / len,
          ty: dy / len,
          start: engine.clock,
          dur,
          press: !!opts.press,
        }
        return dur
      },
      update(clock) {
        const h = this.hop
        if (!h) return
        const u = clamp01((clock - h.start) / h.dur)
        const e = smootherstep(u)
        const mt = 1 - e
        let bx = mt * mt * h.from.x + 2 * mt * e * h.cx + e * e * h.to.x
        let by = mt * mt * h.from.y + 2 * mt * e * h.cy + e * e * h.to.y
        if (h.press && u > 0.66) {
          const s = (u - 0.66) / 0.34
          const sn = Math.sin(s * Math.PI)
          const bump = sn * sn * 1.8
          bx += h.tx * bump
          by += h.ty * bump
        }
        this.x = bx
        this.y = by
      },
    }

    // PRESS: ring bloom + cursor dip, sampled from the master clock.
    const press = { active: false, start: 0, dur: 500 }
    const firePress = () => {
      press.active = true
      press.start = engine.clock
    }

    function renderCursor() {
      let scale = 1
      let rOp = 0
      let rSc = 0.45
      if (press.active) {
        const p = (engine.clock - press.start) / press.dur
        if (p >= 1) {
          press.active = false
        } else {
          const d = Math.min(p / 0.58, 1)
          scale = 1 - 0.18 * Math.sin(d * Math.PI)
          const rp = easeOutCubic(p)
          rOp = 0.9 * (1 - rp)
          rSc = 0.45 + 1.1 * rp
        }
      }
      ghost.style.transform =
        'translate(' + (cursor.x - 6) + 'px,' + (cursor.y - 6) + 'px) scale(' + scale.toFixed(4) + ')'
      ring.style.opacity = rOp.toFixed(3)
      ring.style.transform = 'scale(' + rSc.toFixed(3) + ')'
    }

    // ---- discrete state helpers ---------------------------------------------
    function showScene(key) {
      for (const k in scenes) scenes[k].classList.toggle('on', k === key)
      railBtns.forEach((b) => b.classList.toggle('on', b.dataset.scene === key))
    }
    function flip(id) {
      const el = q('#' + id)
      el.classList.add('flip')
      el.classList.remove('warm')
      el.classList.add('ok')
    }
    function unflip(id, tone) {
      const el = q('#' + id)
      el.classList.remove('flip', 'ok', 'warm')
      if (tone) el.classList.add(tone)
    }

    // PROGRESS track: comp run bar as scaleX, eased on the master clock.
    const prog = { running: false, start: 0, dur: 2100 }
    function startProg() {
      prog.running = true
      prog.start = engine.clock
      compProg.classList.remove('done')
      compBar.style.transform = 'scaleX(0)'
    }
    function renderProg() {
      if (!prog.running) return
      const pp = clamp01((engine.clock - prog.start) / prog.dur)
      compBar.style.transform = 'scaleX(' + easeProg(pp).toFixed(4) + ')'
    }

    function typeReset() {
      consoleEl.classList.remove('asking')
      askq.textContent = ''
    }

    // TARGETS: measured ONCE per pass so the rAF loop never touches layout.
    function centerOf(el, dx, dy) {
      const c = consoleEl.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      const s = c.width / consoleEl.offsetWidth || 1
      return {
        x: (r.left - c.left + r.width / 2) / s + (dx || 0),
        y: (r.top - c.top + r.height / 2) / s + (dy || 0),
      }
    }
    const targets = {}
    const ASK_REST_W = 116
    function measure() {
      targets.rail0 = centerOf(railBtns[0])
      targets.rail1 = centerOf(railBtns[1])
      const c = consoleEl.getBoundingClientRect()
      const ar = ask.getBoundingClientRect()
      const s = c.width / consoleEl.offsetWidth || 1
      const rightX = (ar.right - c.left) / s
      const cy = (ar.top - c.top + ar.height / 2) / s
      const restCx = rightX - ASK_REST_W / 2
      targets.ask = { x: restCx - 34, y: cy }
      targets.askPark = { x: restCx + 26, y: cy + 48 }
      targets.askSubmit = { x: restCx + 42, y: cy }
      targets.home = { x: (targets.rail1.x + restCx) / 2, y: cy + 132 }
      win__.targets = targets
    }

    // SEQUENCER: ordered events {t, fn, done}; cursor arrivals are computed so
    // presses fire exactly when the cursor lands.
    let events = []
    let passLen = 10000
    const ev = (t, fn) => events.push({ t, fn, done: false })

    function buildPass() {
      events = []
      const hopDur = (from, to) => HOP_DUR(Math.hypot(to.x - from.x, to.y - from.y))
      let pos = targets.home

      // ACT 1 - LEAD WITH THE ASK
      const depAsk = 0
      const arrAsk = depAsk + hopDur(pos, targets.ask)
      pos = targets.ask
      ev(depAsk, () => {
        cursor.startHop(targets.ask, { press: true })
      })
      ev(arrAsk, () => {
        firePress()
      })
      ev(arrAsk + 100, () => {
        consoleEl.classList.add('asking')
        askq.textContent = ''
        askWidth.target = 356
      })

      const parkDep = arrAsk + 150
      const parkArr = parkDep + hopDur(pos, targets.askPark)
      pos = targets.askPark
      ev(parkDep, () => {
        cursor.startHop(targets.askPark)
      })

      const typeStart = parkArr + 70
      let t = typeStart
      const chars = []
      for (let i = 1; i <= QUESTION.length; i++) {
        t += 42 + Math.random() * 28
        chars.push({ at: t, n: i })
      }
      chars.forEach((ch) => {
        ev(ch.at, () => {
          askq.textContent = QUESTION.slice(0, ch.n)
        })
      })
      const typeEnd = t

      // ACT 2 - THE ANSWER
      const subDep = typeEnd + 150
      const subArr = subDep + hopDur(pos, targets.askSubmit)
      pos = targets.askSubmit
      ev(subDep, () => {
        cursor.startHop(targets.askSubmit, { press: true })
      })
      ev(subArr, () => {
        firePress()
      })
      ev(subArr + 100, () => {
        showScene('enr')
      })
      ev(subArr + 130, () => {
        unflip('onb-contract', 'warm')
        unflip('onb-bg', 'warm')
        unflip('onb-jit')
        unflip('comp-run', 'warm')
        prog.running = false
        compBar.style.transform = 'scaleX(0)'
        compProg.classList.remove('done')
      })

      // ACT 3 - FOLLOW-THROUGH
      const depComp = subArr + 820
      const arrComp = depComp + hopDur(pos, targets.rail1)
      pos = targets.rail1
      ev(depComp, () => {
        cursor.startHop(targets.rail1, { press: true })
        typeReset()
        askWidth.target = 116
      })
      ev(arrComp, () => {
        firePress()
      })
      ev(arrComp + 100, () => {
        showScene('comp')
        startProg()
      })
      ev(arrComp + 900, () => {
        flip('comp-run')
        compProg.classList.add('done')
      })

      const depOnb = arrComp + 780
      const arrOnb = depOnb + hopDur(pos, targets.rail0)
      pos = targets.rail0
      ev(depOnb, () => {
        cursor.startHop(targets.rail0, { press: true })
      })
      ev(arrOnb, () => {
        firePress()
      })
      ev(arrOnb + 100, () => {
        showScene('onb')
      })
      ev(arrOnb + 170, () => {
        flip('onb-bg')
      })
      ev(arrOnb + 400, () => {
        flip('onb-contract')
      })
      ev(arrOnb + 630, () => {
        flip('onb-jit')
      })

      // LOOP BACK to the seam (home)
      const depHome = arrOnb + 340
      const arrHome = depHome + hopDur(pos, targets.home)
      pos = targets.home
      ev(depHome, () => {
        cursor.startHop(targets.home)
      })
      passLen = arrHome + 640
    }

    // MASTER rAF LOOP: the single source of time.
    const engine = {
      clock: 0,
      last: 0,
      raf: 0,
      playing: false,
      running: false,
      advance(dtSec) {
        engine.clock += dtSec * 1000
        for (let i = 0; i < events.length; i++) {
          const e = events[i]
          if (!e.done && engine.clock >= e.t) {
            e.done = true
            e.fn()
          }
        }
        cursor.update(engine.clock)
        askWidth.step(dtSec)
        ask.style.width = askWidth.value.toFixed(2) + 'px'
        renderProg()
        renderCursor()
        win__.clock = engine.clock
        win__.x = cursor.x
        win__.y = cursor.y
        win__.playing = engine.playing
        if (engine.clock >= passLen) {
          engine.clock -= passLen
          cursor.hop = null
          cursor.x = targets.home.x
          cursor.y = targets.home.y
          cursor.side = 1
          buildPass()
          for (let j = 0; j < events.length; j++) {
            if (events[j].t <= engine.clock) {
              events[j].done = true
              events[j].fn()
            }
          }
          win__.pass++
        }
      },
      frame(now) {
        if (!engine.playing) return
        let dt = (now - engine.last) / 1000
        if (dt > 0.064) dt = 0.064
        engine.last = now
        engine.advance(dt)
        engine.raf = requestAnimationFrame(engine.frame)
      },
      play() {
        if (engine.playing) return
        engine.playing = true
        engine.last = performance.now()
        engine.raf = requestAnimationFrame(engine.frame)
      },
      pause() {
        engine.playing = false
        if (engine.raf) cancelAnimationFrame(engine.raf)
      },
    }

    const win__ = (window.__timeline = { clock: 0, x: 40, y: 40, playing: false, pass: 0 })
    win__.step = (dtSec) => {
      engine.advance(dtSec)
      win__.x = cursor.x
      win__.y = cursor.y
      return { clock: engine.clock, x: cursor.x, y: cursor.y, pass: win__.pass }
    }
    win__.reset = () => {
      engine.clock = 0
      buildPass()
      cursor.x = targets.home.x
      cursor.y = targets.home.y
      cursor.hop = null
      cursor.side = 1
      win__.pass = 0
      win__.x = cursor.x
      win__.y = cursor.y
    }
    win__.pause = () => engine.pause()
    win__.play = () => engine.play()

    // ---- boot ----------------------------------------------------------------
    function startEngine() {
      if (engine.running) return
      measure()
      cursor.x = targets.home.x
      cursor.y = targets.home.y
      cursor.hop = null
      cursor.side = 1
      showScene('onb')
      typeReset()
      askWidth.value = 116
      askWidth.target = 116
      prog.running = false
      compBar.style.transform = 'scaleX(0)'
      ghost.classList.add('show')
      engine.clock = 0
      buildPass()
      engine.running = true
      engine.play()
    }

    // scroll-linked continuation: depth layers keep settling over the first
    // 200px of scroll (parallax at two rates). Passive, transform only.
    const dwA = q('#dw-a')
    const dwB = q('#dw-b')
    let scrollQueued = false
    function parallax() {
      scrollQueued = false
      const s = Math.min(Math.max(window.scrollY || 0, 0), 200)
      if (dwA) dwA.style.transform = 'translate3d(0,' + (-s * 0.07).toFixed(1) + 'px,0)'
      if (dwB) dwB.style.transform = 'translate3d(0,' + (-s * 0.12).toFixed(1) + 'px,0)'
    }
    const onScroll = () => {
      if (!scrollQueued) {
        scrollQueued = true
        requestAnimationFrame(parallax)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (engine.running) engine.play()
      } else {
        engine.pause()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    let rsz
    const onResize = () => {
      clearTimeout(rsz)
      rsz = setTimeout(() => {
        if (engine.running) measure()
      }, 150)
    }
    window.addEventListener('resize', onResize)

    // Do not run on load. The demo boots only when the console scrolls into
    // view (past ~60% of the viewport, matching the hero film) and
    // pauses/resumes as it leaves/re-enters. Fonts must be ready first so the
    // cursor target geometry measures correctly.
    let started = false
    let fontsReady = false
    let inView = false
    let bootTimer
    const tryBoot = () => {
      if (!fontsReady || !inView) return
      if (started) {
        engine.play()
        return
      }
      started = true
      startEngine()
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fontsReady = true
        bootTimer = setTimeout(tryBoot, 80)
      })
    } else {
      fontsReady = true
    }
    const startIO = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          inView = true
          tryBoot()
        } else {
          inView = false
          if (started) engine.pause()
        }
      },
      { rootMargin: '0px 0px -40% 0px', threshold: 0 },
    )
    const startTarget = q('#console')
    if (startTarget) startIO.observe(startTarget)

    return () => {
      engine.pause()
      startIO.disconnect()
      clearTimeout(bootTimer)
      clearTimeout(rsz)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      if (window.__timeline === win__) delete window.__timeline
    }
  }, [])

  return (
    <div ref={rootRef}>
      <div className="depth-set" aria-hidden="true">
        <div className="dwrap a" id="dw-a">
          <div className="darr">
            <div className="dcard a">
              <div className="sk head w55"></div>
              <div className="sk w85"></div>
              <div className="sk royal w70"></div>
              <div className="sk w45"></div>
              <div className="sk w70"></div>
              <div className="sk w35"></div>
            </div>
          </div>
        </div>
        <div className="dwrap b" id="dw-b">
          <div className="darr">
            <div className="dcard b">
              <div className="sk head w45"></div>
              <div className="sk w85"></div>
              <div className="sk w70"></div>
              <div className="sk royal w55"></div>
              <div className="sk w70"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="win-scroll">
        <div className="win-wrap">
          <div className="console" id="console">
            <div className="ghost" id="ghost">
              <span className="ring"></span>
            </div>
            <div className="chrome">
              <span className="lead">
                <span className="win" aria-hidden="true">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
                <span className="sep" aria-hidden="true"></span>
                <span className="brand">
                  Evolve <span>DPM</span>
                </span>
              </span>
              <span className="tools">
                <svg
                  className="glass"
                  aria-hidden="true"
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="6.4" cy="6.4" r="4.7" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M10.1 10.1 L13.3 13.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span className="ask" id="ask">
                  Ask Evolve<span className="q" id="askq"></span>
                  <span className="caret"></span>
                </span>
                <span className="avatar" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="6" cy="4.1" r="2.4" />
                    <path d="M1.6 11c.6-2.3 2.3-3.5 4.4-3.5s3.8 1.2 4.4 3.5z" />
                  </svg>
                </span>
              </span>
            </div>
            <div className="body">
              <div className="rail" id="rail">
                <button className="on" data-scene="onb">
                  Onboarding
                </button>
                <button data-scene="comp">Compensation</button>
                <button data-scene="enr">Enrollment</button>
                <button>Portal</button>
                <button>Leads</button>
                <button>CRM</button>
              </div>
              <div className="stage">
                <div className="scene on" id="sc-onb">
                  <h2>Onboarding and contracting</h2>
                  <p className="hint">Producer lifecycle</p>
                  <div className="rows">
                    <div className="row">
                      <span className="name">Contracting</span>
                      <span className="st warm" id="onb-contract">
                        <i></i>
                        <span className="w">
                          <b>Sent</b>
                          <span className="next">Signed</span>
                        </span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="name">Background check</span>
                      <span className="st warm" id="onb-bg">
                        <i></i>
                        <span className="w">
                          <b>Clearing</b>
                          <span className="next">Cleared</span>
                        </span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="name">JIT appointments</span>
                      <span className="st" id="onb-jit">
                        <i></i>
                        <span className="w">
                          <b>Queued</b>
                          <span className="next">Appointed</span>
                        </span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="name">Training</span>
                      <span className="st warm">
                        <i></i>
                        <span className="w">
                          <b>In progress</b>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="scene" id="sc-comp">
                  <h2>Incentive compensation</h2>
                  <p className="hint">Commission engine</p>
                  <div className="rows">
                    <div className="row">
                      <span className="name">Commission run</span>
                      <span className="st warm" id="comp-run">
                        <i></i>
                        <span className="w">
                          <b>Processing</b>
                          <span className="next">Approved</span>
                        </span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="name">Bonus schedule</span>
                      <span className="st ok">
                        <i></i>
                        <span className="w">
                          <b>Active</b>
                        </span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="name">Chargebacks</span>
                      <span className="st ok">
                        <i></i>
                        <span className="w">
                          <b>Reconciled</b>
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="prog" id="comp-prog">
                    <div className="bar"></div>
                  </div>
                </div>

                <div className="scene" id="sc-enr">
                  <h2>Ready to sell</h2>
                  <p className="hint">Answering: which producers are ready to sell?</p>
                  <div className="rows">
                    <div className="row hot">
                      <span className="name">Enablement and training</span>
                      <span className="st royal">
                        <i></i>
                        <span className="w">
                          <b>Complete</b>
                        </span>
                      </span>
                    </div>
                    <div className="row hot">
                      <span className="name">Licensing</span>
                      <span className="st royal">
                        <i></i>
                        <span className="w">
                          <b>Verified</b>
                        </span>
                      </span>
                    </div>
                    <div className="row hot">
                      <span className="name">Certifications</span>
                      <span className="st royal">
                        <i></i>
                        <span className="w">
                          <b>Certified</b>
                        </span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="name">Appointments</span>
                      <span className="st ok">
                        <i></i>
                        <span className="w">
                          <b>Active</b>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
