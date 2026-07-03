import { useEffect, useRef, useState } from 'react'
import loopSrc from '../assets/hero-loop.mp4'
import posterSrc from '../assets/hero-poster.jpg'
import HeroFilm from './HeroFilm'

// Interactive hero surface. A WebGL2 height-field water simulation runs over
// the hero film: moving the cursor across the lower "sand" region raises a
// gentle blue wake, and a click sends a strong wave out. The waves both
// refract the footage and light it with blue. Masked to the sand so the
// headline is never touched. Any failure falls back to the plain film.

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

// Damped wave equation on a height field. R = height(t), G = height(t-1).
// Only a click disturbs it; plain cursor movement never makes waves.
const SIM = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uGrid;
uniform vec2 uPointer;
uniform float uClick;
uniform float uDamp;
void main() {
  vec2 uv = vUv;
  vec4 s = texture(uState, uv);
  float h = s.r;
  float hp = s.g;
  float l = texture(uState, uv - vec2(uTexel.x, 0.0)).r;
  float r = texture(uState, uv + vec2(uTexel.x, 0.0)).r;
  float u = texture(uState, uv - vec2(0.0, uTexel.y)).r;
  float d = texture(uState, uv + vec2(0.0, uTexel.y)).r;
  float lap = l + r + u + d - 4.0 * h;
  float hn = (2.0 * h - hp + 0.32 * lap) * uDamp;
  vec2 dcell = (uv - uPointer) * uGrid;
  float dist = length(dcell);
  hn += uClick * smoothstep(uGrid.x * 0.06, 0.0, dist);
  hn = clamp(hn, -2.0, 2.0);
  frag = vec4(hn, h, 0.0, 1.0);
}`

const COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uState;
uniform sampler2D uVideo;
uniform vec2 uTexel;
uniform vec2 uCoverScale;
uniform vec2 uCoverOffset;
uniform float uRefract;
uniform float uGlow;
uniform float uScrim;
uniform vec3 uWarm;
uniform vec3 uBlue;
uniform vec2 uCursor;
uniform float uCursorGlow;
uniform float uAspect;
void main() {
  vec2 uv = vUv;
  float hL = texture(uState, uv - vec2(uTexel.x, 0.0)).r;
  float hR = texture(uState, uv + vec2(uTexel.x, 0.0)).r;
  float hU = texture(uState, uv - vec2(0.0, uTexel.y)).r;
  float hD = texture(uState, uv + vec2(0.0, uTexel.y)).r;
  vec2 grad = vec2(hR - hL, hD - hU);
  float h = texture(uState, uv).r;
  vec2 vuv = uv * uCoverScale + uCoverOffset;
  // Refraction comes only from the wave field, which only a click disturbs.
  vec2 refr = grad * uRefract;
  vec3 col = texture(uVideo, clamp(vuv + refr, 0.001, 0.999)).rgb;
  col = mix(col, uWarm, uScrim);
  // Wave glow (from a click), driven by slope so it reads as water, not a flash.
  float energy = min(abs(h) * 0.10 + length(grad) * 5.0, 0.7);
  col += uBlue * energy * uGlow;
  // Soft water-blue light that illuminates under the cursor. Screen blend so
  // it brightens the sand rather than painting over it. Small and gentle.
  float cd = length((uv - uCursor) * vec2(uAspect, 1.0));
  float halo = smoothstep(0.11, 0.0, cd);
  halo = pow(halo, 1.6) * uCursorGlow;
  col = 1.0 - (1.0 - col) * (1.0 - uBlue * halo);
  frag = vec4(col, 1.0);
}`

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) || 'shader compile failed')
  }
  return sh
}

function program(gl, vsrc, fsrc) {
  const p = gl.createProgram()
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vsrc))
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fsrc))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || 'link failed')
  }
  return p
}

const WARM = [0.984, 0.98, 0.972]
// Soft water blue sampled to match the caustic light in the film.
const BLUE = [0.44, 0.62, 0.9]
const GRID_W = 220

export default function HeroRipple({ sectionRef }) {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    const section = sectionRef?.current
    if (!canvas || !video || !section) return

    let gl
    try {
      gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false })
      if (!gl) throw new Error('no webgl2')
      if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('no float buffers')
    } catch (e) {
      setFailed(true)
      return
    }

    let disposed = false
    let raf = 0
    let simProg, compProg, quad, videoTex
    let fbos = []
    let cur = 0
    let gridW = GRID_W
    let gridH = 124
    let coverScale = [1, 1]
    let coverOffset = [0, 0]
    let aspect = 1.6

    // pointer state (uv, y up: 1 = top). tx/ty = raw target, x/y = smoothed
    // glow position, glow = eased hover intensity, click* = last click point.
    const ptr = {
      tx: 0.5, ty: 0.3, x: 0.5, y: 0.3,
      glow: 0, click: 0, clickX: 0.5, clickY: 0.3, hovering: false,
    }

    try {
      simProg = program(gl, VERT, SIM)
      compProg = program(gl, VERT, COMPOSITE)
    } catch (e) {
      setFailed(true)
      return
    }

    quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )

    const bindQuad = (prog) => {
      const loc = gl.getAttribLocation(prog, 'aPos')
      gl.bindBuffer(gl.ARRAY_BUFFER, quad)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    }

    const makeStateTex = (w, h) => {
      const t = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const fb = gl.createFramebuffer()
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
      return { tex: t, fb }
    }

    const buildFbos = () => {
      fbos.forEach((f) => {
        gl.deleteTexture(f.tex)
        gl.deleteFramebuffer(f.fb)
      })
      fbos = [makeStateTex(gridW, gridH), makeStateTex(gridW, gridH)]
      // clear both to zero
      fbos.forEach((f) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, f.fb)
        gl.viewport(0, 0, gridW, gridH)
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
      })
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }

    videoTex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, videoTex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([230, 226, 216, 255]))

    const computeCover = () => {
      const rect = section.getBoundingClientRect()
      const Ac = rect.width / rect.height
      aspect = Ac
      const vw = video.videoWidth || 1600
      const vh = video.videoHeight || 895
      const Av = vw / vh
      const posX = 0.5
      const posY = 0.62
      if (Ac >= Av) {
        const s = Av / Ac
        coverScale = [1, s]
        // uv.y is flipped (0 bottom). object-position posY from top -> from bottom = 1-posY
        coverOffset = [0, (1 - s) * (1 - posY)]
      } else {
        const s = Ac / Av
        coverScale = [s, 1]
        coverOffset = [(1 - s) * posX, 0]
      }
    }

    const resize = () => {
      const rect = section.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.max(2, Math.round(rect.width * dpr))
      canvas.height = Math.max(2, Math.round(rect.height * dpr))
      gridH = Math.max(60, Math.round(GRID_W * (rect.height / rect.width)))
      gridW = GRID_W
      buildFbos()
      computeCover()
    }

    // uniform locations
    const simU = {
      uState: gl.getUniformLocation(simProg, 'uState'),
      uTexel: gl.getUniformLocation(simProg, 'uTexel'),
      uGrid: gl.getUniformLocation(simProg, 'uGrid'),
      uPointer: gl.getUniformLocation(simProg, 'uPointer'),
      uClick: gl.getUniformLocation(simProg, 'uClick'),
      uDamp: gl.getUniformLocation(simProg, 'uDamp'),
    }
    const compU = {
      uState: gl.getUniformLocation(compProg, 'uState'),
      uVideo: gl.getUniformLocation(compProg, 'uVideo'),
      uTexel: gl.getUniformLocation(compProg, 'uTexel'),
      uCoverScale: gl.getUniformLocation(compProg, 'uCoverScale'),
      uCoverOffset: gl.getUniformLocation(compProg, 'uCoverOffset'),
      uRefract: gl.getUniformLocation(compProg, 'uRefract'),
      uGlow: gl.getUniformLocation(compProg, 'uGlow'),
      uScrim: gl.getUniformLocation(compProg, 'uScrim'),
      uWarm: gl.getUniformLocation(compProg, 'uWarm'),
      uBlue: gl.getUniformLocation(compProg, 'uBlue'),
      uCursor: gl.getUniformLocation(compProg, 'uCursor'),
      uCursorGlow: gl.getUniformLocation(compProg, 'uCursorGlow'),
      uAspect: gl.getUniformLocation(compProg, 'uAspect'),
    }

    resize()

    let visible = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(section)

    const onReady = () => {
      setReady(true)
      computeCover()
    }
    video.addEventListener('loadeddata', onReady, { once: true })

    // pointer -> uv (y up). Hover lights a soft glow in the sand; only a
    // click disturbs the wave field.
    const onMove = (e) => {
      if (e.target && e.target.closest && e.target.closest('a, button')) {
        ptr.hovering = false
        return
      }
      const rect = section.getBoundingClientRect()
      ptr.tx = (e.clientX - rect.left) / rect.width
      ptr.ty = 1 - (e.clientY - rect.top) / rect.height
      ptr.hovering = true
    }
    const onLeave = () => {
      ptr.hovering = false
    }
    const onDown = (e) => {
      if (e.target && e.target.closest && e.target.closest('a, button')) return
      const rect = section.getBoundingClientRect()
      ptr.clickX = (e.clientX - rect.left) / rect.width
      ptr.clickY = 1 - (e.clientY - rect.top) / rect.height
      ptr.click = 0.85
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

    const step = () => {
      if (disposed) return
      raf = requestAnimationFrame(step)
      if (!visible || document.visibilityState !== 'visible') return

      // upload current video frame
      if (video.readyState >= 2) {
        gl.bindTexture(gl.TEXTURE_2D, videoTex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
      }

      // two simulation substeps for livelier propagation
      for (let i = 0; i < 2; i++) {
        const src = fbos[cur]
        const dst = fbos[1 - cur]
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb)
        gl.viewport(0, 0, gridW, gridH)
        gl.useProgram(simProg)
        bindQuad(simProg)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, src.tex)
        gl.uniform1i(simU.uState, 0)
        gl.uniform2f(simU.uTexel, 1 / gridW, 1 / gridH)
        gl.uniform2f(simU.uGrid, gridW, gridH)
        gl.uniform2f(simU.uPointer, ptr.clickX, ptr.clickY)
        gl.uniform1f(simU.uClick, i === 0 ? ptr.click : 0)
        // Higher damping keeps the ripple local to where it was clicked.
        gl.uniform1f(simU.uDamp, 0.975)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        cur = 1 - cur
      }
      ptr.click = 0
      // ease the cursor light: position follows the pointer, intensity fades
      // in while hovering and out when the cursor leaves.
      ptr.x += (ptr.tx - ptr.x) * 0.2
      ptr.y += (ptr.ty - ptr.y) * 0.2
      ptr.glow += ((ptr.hovering ? 1 : 0) - ptr.glow) * 0.1

      // composite to screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(compProg)
      bindQuad(compProg)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, fbos[cur].tex)
      gl.uniform1i(compU.uState, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, videoTex)
      gl.uniform1i(compU.uVideo, 1)
      gl.uniform2f(compU.uTexel, 1 / gridW, 1 / gridH)
      gl.uniform2f(compU.uCoverScale, coverScale[0], coverScale[1])
      gl.uniform2f(compU.uCoverOffset, coverOffset[0], coverOffset[1])
      gl.uniform1f(compU.uRefract, 0.17)
      gl.uniform1f(compU.uGlow, 0.42)
      gl.uniform1f(compU.uScrim, 0.5)
      gl.uniform3f(compU.uWarm, WARM[0], WARM[1], WARM[2])
      gl.uniform3f(compU.uBlue, BLUE[0], BLUE[1], BLUE[2])
      gl.uniform2f(compU.uCursor, ptr.x, ptr.y)
      gl.uniform1f(compU.uCursorGlow, ptr.glow * 0.22)
      gl.uniform1f(compU.uAspect, aspect)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    video.play().catch(() => {})
    raf = requestAnimationFrame(step)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      clearTimeout(roTimer)
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      section.removeEventListener('pointerdown', onDown)
      video.removeEventListener('loadeddata', onReady)
      fbos.forEach((f) => {
        gl.deleteTexture(f.tex)
        gl.deleteFramebuffer(f.fb)
      })
      if (videoTex) gl.deleteTexture(videoTex)
    }
  }, [sectionRef])

  if (failed) {
    return (
      <>
        <HeroFilm show />
        <div className="hero-scrim" />
      </>
    )
  }

  return (
    <>
      <video
        ref={videoRef}
        className="hero-ripple-video"
        src={loopSrc}
        poster={posterSrc}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        aria-hidden="true"
      />
      <canvas
        ref={canvasRef}
        className={`hero-ripple-canvas${ready ? ' is-ready' : ''}`}
        aria-hidden="true"
      />
    </>
  )
}
