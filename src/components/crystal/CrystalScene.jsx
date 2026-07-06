import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import Crystal, { FROZEN, TURN_END, DOCK_START } from './Crystal.jsx'

// ------------------------------------------------------------------
// Ported from the approved Round 9 prototype (Scene.jsx). The ONLY
// behavioral change is the scroll source: the prototype owned its own
// Lenis and drove raf from the r3f loop; here we reuse the SITE's Lenis
// (window.__lenis, created by ReactLenis in App.jsx). We never call
// lenis.raf() (the site's ReactLenis autoRafs) and never create a second
// Lenis. p is derived from the shared instance's smoothed scroll each
// frame, measured against the crystal track element (not the whole
// document, so the rest of the homepage below does not stretch the
// choreography). One smoothing layer only.
// ------------------------------------------------------------------

const FROZEN_TIME = 100

function clamp01(x) {
  return Math.min(1, Math.max(0, x))
}
function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3)
}
function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

// Round 7 act boundaries (see Crystal.jsx)
const ACT1_END = 0.14
const ACT2_END = 0.56

// Canvas-generated radial texture: light spilled through glass, NOT a UI
// gradient. Built once, in code, so there is no CSS gradient anywhere.
function makeCausticTexture() {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const cx = size / 2
  const img = ctx.createImageData(size, size)
  const royal = [27, 76, 193]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / cx
      const dy = (y - cx) / cx
      let d = Math.sqrt(dx * dx + dy * dy)
      const ripple = 0.06 * Math.sin(Math.atan2(dy, dx) * 6 + d * 8)
      d = clamp01(d + ripple)
      const a = Math.pow(1 - clamp01(d), 2.4)
      const idx = (y * size + x) * 4
      img.data[idx] = royal[0]
      img.data[idx + 1] = royal[1]
      img.data[idx + 2] = royal[2]
      img.data[idx + 3] = Math.round(a * 255)
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function CausticPool({ causticRef }) {
  const matRef = useRef()
  const meshRef = useRef()
  const tex = useMemo(() => makeCausticTexture(), [])
  useFrame(() => {
    const c = causticRef.current
    if (!c) return
    if (matRef.current) matRef.current.opacity = c.opacity
    if (meshRef.current) meshRef.current.scale.setScalar(4.1 * c.scale)
  })
  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -1.9, 0]}
      scale={3.4}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={matRef}
        map={tex}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

function CameraRig({ pSmoothRef }) {
  const { camera } = useThree()
  useFrame((state) => {
    const p = pSmoothRef.current
    const t = FROZEN ? FROZEN_TIME : state.clock.elapsedTime
    const a1 = easeInOutCubic(clamp01(p / ACT1_END))
    const a2 = easeInOutCubic(clamp01((p - ACT1_END) / (ACT2_END - ACT1_END)))
    const a3raw = clamp01((p - ACT2_END) / (TURN_END - ACT2_END))
    const a3 = easeInOutCubic(a3raw)
    const a3decel = easeOutCubic(a3raw)

    const dk = easeInOutCubic(clamp01((p - DOCK_START) / (1 - DOCK_START)))

    const radius = 7.2 - 0.9 * a2 - 1.1 * a3

    const az =
      -0.34 +
      0.1 * a1 +
      THREE.MathUtils.degToRad(30) * a2 +
      THREE.MathUtils.degToRad(12) * a3decel +
      Math.sin(t * 0.11) * 0.014 * (1 - dk)

    const el =
      -0.17 +
      0.09 * a1 +
      0.11 * a2 +
      0.15 * a3 +
      Math.sin(t * 0.09) * 0.008 * (1 - dk)

    camera.position.set(
      Math.sin(az) * Math.cos(el) * radius,
      Math.sin(el) * radius,
      Math.cos(az) * Math.cos(el) * radius,
    )

    const fov = 38 - 5 * a3
    if (Math.abs(camera.fov - fov) > 0.001) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    camera.lookAt(0, 0, 0)
  })
  return null
}

function LightRig({ pSmoothRef, causticRef }) {
  const keyRef = useRef()
  const rimRef = useRef()
  const scene = useThree((s) => s.scene)
  useFrame(() => {
    const p = pSmoothRef.current
    const mul = (causticRef.current && causticRef.current.lightMul) || 1
    // Bright, crisp directional keys are what actually deliver sharp mirror
    // glints on the low-roughness facets (the lightformer env reflections
    // wash out under transmission over the warm-white background; punctual
    // lights give a guaranteed razor-sharp specular hotspot that sweeps
    // across facets as the crystal turns). Uniform-only changes, no passes.
    if (keyRef.current) keyRef.current.intensity = 3.4 * mul
    if (rimRef.current) rimRef.current.intensity = 2.6 * mul
    scene.environmentIntensity = 1.0 * mul
    const a3 = easeInOutCubic(clamp01((p - ACT2_END) / (TURN_END - ACT2_END)))
    scene.environmentRotation.y = 0.7 * a3
    const dk = (causticRef.current && causticRef.current.dock) || 0
    if (scene.fog) {
      scene.fog.near = 7 + 30 * dk
      scene.fog.far = 15.5 + 40 * dk
    }
  })
  return (
    <>
      <directionalLight
        ref={keyRef}
        position={[4, 6, 5]}
        intensity={3.4}
        color="#ffffff"
      />
      <directionalLight
        ref={rimRef}
        position={[-4, 3, -2]}
        intensity={2.6}
        color="#e6edff"
      />
    </>
  )
}

// Bridge: derives p from the SITE's Lenis (window.__lenis) each frame,
// measured against the track element. Does NOT drive lenis.raf (the site's
// ReactLenis owns the raf loop). window.__pOverride lets the verification
// harness pin progress while the window stays unscrolled.
function ScrollBridge({ pSmoothRef, trackRef, onReady }) {
  const readyRef = useRef(false)
  useFrame(() => {
    const track = trackRef.current
    let p = 0
    if (track) {
      const end = Math.max(1, track.offsetHeight - window.innerHeight)
      const lenis = window.__lenis
      const scroll = lenis ? lenis.scroll : window.scrollY
      p = clamp01(scroll / end)
    }
    pSmoothRef.current = p
    if (typeof window.__pOverride === 'number')
      pSmoothRef.current = clamp01(window.__pOverride)
    window.__p = pSmoothRef.current

    if (!readyRef.current) {
      readyRef.current = true
      if (onReady) onReady()
    }
  })
  return null
}

// Perf instrumentation, exposes window.__bench / window.__avgFrameMs.
function PerfProbe() {
  const gl = useThree((s) => s.gl)
  const advance = useThree((s) => s.advance)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const last = useRef(0)
  const samples = useRef([])

  useEffect(() => {
    gl.info.autoReset = false
    window.__gl = gl
    window.__dbg = () => ({
      cam: camera.position.toArray().map((v) => Number(v.toFixed(3))),
      fov: camera.fov,
      aspect: Number(camera.aspect.toFixed(3)),
      children: scene.children.map((c) => ({
        type: c.type,
        visible: c.visible,
        pos: c.position.toArray().map((v) => Number(v.toFixed(2))),
      })),
    })
    window.__bench = (n = 60) => {
      const ctx = gl.getContext()
      const step = 1000 / 60
      let t = performance.now()
      t += step
      advance(t, true)
      const px = new Uint8Array(4)
      ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px)
      gl.info.reset()
      t += step
      advance(t, true)
      const info = {
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        textures: gl.info.memory.textures,
        geometries: gl.info.memory.geometries,
        programs: gl.info.programs ? gl.info.programs.length : 0,
      }
      const t0 = performance.now()
      for (let i = 0; i < n; i++) {
        t += step
        advance(t, true)
      }
      ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px)
      return { msPerFrame: (performance.now() - t0) / n, info }
    }
    return () => {
      delete window.__bench
      delete window.__gl
    }
  }, [gl, advance, scene, camera])

  useFrame(() => {
    const now = performance.now()
    const dt = now - last.current
    last.current = now
    if (dt > 0 && dt < 250) {
      samples.current.push(dt)
      if (samples.current.length > 120) samples.current.shift()
      window.__avgFrameMs =
        samples.current.reduce((a, b) => a + b, 0) / samples.current.length
    }
    window.__renderInfo = {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      textures: gl.info.memory.textures,
      geometries: gl.info.memory.geometries,
      programs: gl.info.programs ? gl.info.programs.length : 0,
    }
    gl.info.reset()
  })
  return null
}

export default function CrystalScene({ trackRef, onReady }) {
  const causticRef = useRef({ opacity: 0, scale: 1, lightMul: 1 })
  const pSmoothRef = useRef(0)

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [0.9, -0.75, 6.6], fov: 38, near: 0.1, far: 50 }}
      onCreated={({ gl }) => {
        gl.setClearColor('#fbfaf8', 1)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        if ('transmissionResolutionScale' in gl)
          gl.transmissionResolutionScale = 1.0
      }}
    >
      <fog attach="fog" args={['#fbfaf8', 7, 15.5]} />
      <color attach="background" args={['#fbfaf8']} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[-5, 2, -3]} intensity={0.45} color="#e8ecf7" />

      {/* Round 9 lightformer rig. Small hot cool-white/warm-white bars on a
          mid surround (#525a70), each aimed at the origin so they land as real
          hotspots in the captured env map and give the facets a contrasty
          reflection base. The dominant jewel read at this object scale comes
          from the tinted transmissive body (thickness + periwinkle
          attenuation, which darkens the facets enough that the punctual key
          and env reflections show as bright/dark facet variation) plus the
          two crisp directional keys in LightRig. The page background stays
          warm white; env and background are independent. frames=1, so zero
          per-frame passes. Cool-white with a whisper of warm, no colored gels. */}
      <Environment resolution={1024} frames={1}>
        <color attach="background" args={['#525a70']} />
        {/* Small hot bars ringing the object, each explicitly aimed at the
            origin (target 0,0,0) so they actually appear as bright hotspots in
            the captured env map. Contrasting angles so whatever way a facet
            points it catches a crisp glint and adjacent facets swing
            bright-to-mid. */}
        <Lightformer form="rect" intensity={30} color="#ffffff" position={[2, 4, 4]} target={[0, 0, 0]} scale={[2, 0.55, 1]} />
        <Lightformer form="rect" intensity={26} color="#dce7ff" position={[-5, 2, 3]} target={[0, 0, 0]} scale={[1.8, 0.5, 1]} />
        <Lightformer form="rect" intensity={24} color="#fff2e0" position={[5, 0, 2]} target={[0, 0, 0]} scale={[1.6, 0.45, 1]} />
        <Lightformer form="rect" intensity={34} color="#ffffff" position={[-2, 4.5, -2]} target={[0, 0, 0]} scale={[1.4, 0.55, 1]} />
        <Lightformer form="rect" intensity={20} color="#eaf0ff" position={[1, -4, 3]} target={[0, 0, 0]} scale={[1.8, 0.5, 1]} />
        <Lightformer form="rect" intensity={22} color="#ffffff" position={[-4, -1, 4]} target={[0, 0, 0]} scale={[1.3, 0.4, 1]} />
      </Environment>

      <PerfProbe />
      <ScrollBridge pSmoothRef={pSmoothRef} trackRef={trackRef} onReady={onReady} />
      <CameraRig pSmoothRef={pSmoothRef} />
      <LightRig pSmoothRef={pSmoothRef} causticRef={causticRef} />

      <Crystal pSmoothRef={pSmoothRef} causticRef={causticRef} />
      <CausticPool causticRef={causticRef} />
    </Canvas>
  )
}
