import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ConvexGeometry } from 'three-stdlib'

// ------------------------------------------------------------------
// Ported verbatim from the approved Round 9 prototype
// (evolvenxt-crystal-proto/src/Crystal.jsx). The object, its material,
// the fragments/assembly/turn/dock choreography and all tuning are the
// approved behavior; do not re-choreograph. Only the surrounding wiring
// (scene, scroll source, fallback) differs in the site.
// ------------------------------------------------------------------

// Deterministic seeded RNG. NOT Math.random at module scope, so hot
// reload and re-mounts produce the identical crystal every time.
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEED = 20260703
const SHARD_COUNT = 10
const OBJECT_SCALE = 1.15

// Debug: load with ?freeze to pin all time-based idle motion, so two
// screenshots taken seconds apart differ only by scroll state.
export const FROZEN =
  typeof location !== 'undefined' && location.search.indexOf('freeze') >= 0
const FROZEN_TIME = 100

// Hull: LOW-poly cut with character. 12 icosahedron vertices, strongly
// jittered and slightly elongated, through a convex hull: ~20 large
// triangular facets, each big enough to carry its own value under the
// lightformer environment. The crystal is never cut or split.
function buildHullData() {
  const rand = mulberry32(SEED)
  const base = new THREE.IcosahedronGeometry(1, 0)
  const pos = base.attributes.position
  const seen = new Map()
  const points = []
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`
    if (seen.has(key)) continue
    seen.set(key, true)
    const jitter = 0.7 + rand() * 0.65
    const v = new THREE.Vector3(x, y, z).multiplyScalar(jitter)
    v.x += (rand() - 0.5) * 0.3
    v.y += (rand() - 0.5) * 0.3
    v.z += (rand() - 0.5) * 0.3
    v.y *= 1.22
    v.z *= 0.94
    points.push(v)
  }
  base.dispose()

  const hull = new ConvexGeometry(points)
  hull.computeVertexNormals()
  return hull
}

// Split hull triangles into SHARD_COUNT clusters (farthest-point seeded,
// deterministic) for the assembly act. Each cluster becomes a shard
// geometry re-centered on its centroid, with an inner cap so it reads as a
// solid sliver.
function buildShards(hull) {
  const rand = mulberry32(SEED + 99)
  const posAttr = hull.attributes.position
  const triCount = posAttr.count / 3

  const triCentroids = []
  for (let t = 0; t < triCount; t++) {
    const a = t * 3
    const cx = (posAttr.getX(a) + posAttr.getX(a + 1) + posAttr.getX(a + 2)) / 3
    const cy = (posAttr.getY(a) + posAttr.getY(a + 1) + posAttr.getY(a + 2)) / 3
    const cz = (posAttr.getZ(a) + posAttr.getZ(a + 1) + posAttr.getZ(a + 2)) / 3
    triCentroids.push(new THREE.Vector3(cx, cy, cz))
  }

  const count = Math.min(SHARD_COUNT, triCount)
  const seeds = []
  seeds.push(Math.floor(rand() * triCount))
  while (seeds.length < count) {
    let best = -1
    let bestDist = -1
    for (let t = 0; t < triCount; t++) {
      let d = Infinity
      for (const s of seeds)
        d = Math.min(d, triCentroids[t].distanceToSquared(triCentroids[s]))
      if (d > bestDist) {
        bestDist = d
        best = t
      }
    }
    seeds.push(best)
  }

  const buckets = Array.from({ length: count }, () => [])
  for (let t = 0; t < triCount; t++) {
    let best = 0
    let bestDist = Infinity
    for (let s = 0; s < count; s++) {
      const d = triCentroids[t].distanceToSquared(triCentroids[seeds[s]])
      if (d < bestDist) {
        bestDist = d
        best = s
      }
    }
    buckets[best].push(t)
  }

  const shards = []
  for (let s = 0; s < count; s++) {
    const tris = buckets[s]
    if (tris.length === 0) continue

    const home = new THREE.Vector3()
    for (const t of tris) home.add(triCentroids[t])
    home.multiplyScalar(1 / tris.length)

    const verts = []
    const inner = 0.5
    for (const t of tris) {
      const a = t * 3
      const p0 = new THREE.Vector3(posAttr.getX(a), posAttr.getY(a), posAttr.getZ(a))
      const p1 = new THREE.Vector3(posAttr.getX(a + 1), posAttr.getY(a + 1), posAttr.getZ(a + 1))
      const p2 = new THREE.Vector3(posAttr.getX(a + 2), posAttr.getY(a + 2), posAttr.getZ(a + 2))
      pushTri(verts, p0, p1, p2, home)
      const q0 = p0.clone().multiplyScalar(inner)
      const q1 = p1.clone().multiplyScalar(inner)
      const q2 = p2.clone().multiplyScalar(inner)
      pushTri(verts, q2, q1, q0, home)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    geo.computeVertexNormals()

    const dir = home.clone().normalize()
    const scatterR = 2.1 + rand() * 1.1
    const scatterPos = dir
      .clone()
      .multiplyScalar(scatterR)
      .add(
        new THREE.Vector3(
          (rand() - 0.5) * 1.6,
          (rand() - 0.5) * 1.6,
          (rand() - 0.5) * 1.6,
        ),
      )
    const scatterRot = new THREE.Euler(
      (rand() - 0.5) * Math.PI * 2.2,
      (rand() - 0.5) * Math.PI * 2.2,
      (rand() - 0.5) * Math.PI * 2.2,
    )
    const phase = rand() * Math.PI * 2
    const phase2 = rand() * Math.PI * 2

    shards.push({ geo, home, scatterPos, scatterRot, phase, phase2 })
  }
  return shards
}

function pushTri(arr, a, b, c, home) {
  arr.push(a.x - home.x, a.y - home.y, a.z - home.z)
  arr.push(b.x - home.x, b.y - home.y, b.z - home.z)
  arr.push(c.x - home.x, c.y - home.y, c.z - home.z)
}

// Easings
function clamp01(x) {
  return Math.min(1, Math.max(0, x))
}
function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3)
}
function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
function easeOutBack(x, s = 1.35) {
  const c1 = s
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

// Round 7 act map (430vh track = 330vh of scrollable travel), the approved
// fragments/assembly/turn feel with the Open removed and the tail
// tightened: fragments 0-0.14, assembly 0.14-0.56 (seat 0.545), turn
// 0.56-0.80, THE DOCK 0.80-1.0.
const ASSEMBLY_START = 0.14
const ASSEMBLY_END = 0.545
const PER_SHARD_STAGGER = 0.021
export const SWAP_P = 0.56
const TURN_START = 0.56
export const TURN_END = 0.8
export const DOCK_START = 0.8

// Dock tuning (Round 8): the hero crystal becomes a small living mark seated
// at the VISUAL CENTER of the statement panel. The descent is driven as an
// explicit eased SCREEN-SPACE lerp from the hero on-screen position straight
// DOWN to a fixed resting point, so the vertical travel is monotonic downward
// (no dip-then-rise); the mark binds to the live DOM anchor rect only in the
// final beat for pixel-accurate centering. DOCK_DEPTH is the world distance
// from the camera at which the screen target is unprojected.
const DOCK_SCALE = 0.14
const DOCK_DEPTH = 5.2
// The fixed resting screen point (NDC), straight below the hero point. NDC
// y is +1 at the TOP, so a NEGATIVE value sits BELOW screen center: the
// crystal descends from the hero pose (screen center, NDC y ~0) down to this
// point.
const REST_NDC_Y = -0.151
// The descent adds a graceful full tumble on top of the base idle spin:
// ~1.25 turns, easeInOutCubic, decelerating into the calm idle at rest.
const DOCK_SPIN = THREE.MathUtils.degToRad(450)

// ONE MeshPhysicalMaterial for shards and hull (no MTM anywhere; the
// renderer's single shared transmission pass covers every glass mesh).
export default function Crystal({ pSmoothRef, causticRef }) {
  const hull = useMemo(() => buildHullData(), [])
  const shards = useMemo(() => buildShards(hull), [hull])

  // Round 9 material pass: cut jewel, not frosted plastic. Sparkle is real
  // specular from ONE shared MeshPhysicalMaterial against a hard-edged
  // lightformer rig (no MTM anywhere; no bloom).
  const glassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        transmission: 1,
        thickness: 1.25,
        roughness: 0.015,
        ior: 1.72,
        color: new THREE.Color('#eef2fc'),
        attenuationColor: new THREE.Color('#7c96d8'),
        attenuationDistance: 1.95,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        specularIntensity: 1,
        envMapIntensity: 2.2,
        dispersion: 0.18,
        flatShading: true,
      }),
    [],
  )

  const groupRef = useRef()
  const wholeRef = useRef()
  const shardGroupRef = useRef()
  const coreRef = useRef()
  const shardRefs = useRef([])
  const anchorElRef = useRef(null)

  const tmp = useMemo(() => new THREE.Vector3(), [])
  const tmpRot = useMemo(() => new THREE.Euler(), [])
  const tmpQ = useMemo(() => new THREE.Quaternion(), [])
  const tmpQ2 = useMemo(() => new THREE.Quaternion(), [])
  const anchorWorld = useMemo(() => new THREE.Vector3(), [])
  const ndc = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    // p comes straight from the site's Lenis (ONE smoothing layer)
    const p = pSmoothRef.current
    const time = FROZEN ? FROZEN_TIME : state.clock.elapsedTime

    const assembly = clamp01(
      (p - ASSEMBLY_START) / (ASSEMBLY_END - ASSEMBLY_START),
    )
    const idleAmp = (1 - clamp01(p / ASSEMBLY_START)) * 0.9 + 0.02

    // ---- per-shard motion ----
    for (let i = 0; i < shards.length; i++) {
      const sh = shards[i]
      const ref = shardRefs.current[i]
      if (!ref) continue

      const t0 = ASSEMBLY_START + i * PER_SHARD_STAGGER
      const dur = ASSEMBLY_END - t0
      const local = clamp01((p - t0) / Math.max(0.0001, dur))
      const seat = easeOutBack(local, 1.2)

      tmp.copy(sh.scatterPos).lerp(sh.home, seat)
      const bob = idleAmp * (1 - local)
      tmp.x += Math.sin(time * 0.4 + sh.phase) * 0.18 * bob
      tmp.y += Math.cos(time * 0.33 + sh.phase2) * 0.18 * bob
      tmp.z += Math.sin(time * 0.28 + sh.phase) * 0.12 * bob
      ref.position.copy(tmp)

      tmpRot.copy(sh.scatterRot)
      tmpQ.setFromEuler(tmpRot)
      tmpQ2.identity()
      ref.quaternion.copy(tmpQ).slerp(tmpQ2, seat)
      if (bob > 0.001) {
        ref.rotation.x += Math.sin(time * 0.5 + sh.phase) * 0.0015 * bob * 60 * dt
        ref.rotation.y += Math.cos(time * 0.4 + sh.phase2) * 0.0015 * bob * 60 * dt
      }
    }

    // ---- hard swap at SWAP_P: geometry-only flip, same shared material,
    // cannot change color ----
    const hullLive = p >= SWAP_P
    if (shardGroupRef.current) shardGroupRef.current.visible = !hullLive
    if (wholeRef.current) {
      wholeRef.current.visible = hullLive
      const swap = clamp01((p - SWAP_P) / 0.05)
      wholeRef.current.scale.setScalar(
        OBJECT_SCALE * (1 + 0.008 * easeOutCubic(swap)),
      )
    }

    // ---- Act 3 turn: ~140deg + constant idle spin. The idle spin CONTINUES
    // through the dock and into the docked end state (a living mark, never
    // frozen), so the turn-to-dock boundary is continuous by construction.
    const turn = clamp01((p - TURN_START) / (TURN_END - TURN_START))
    const turnEased = 0.55 * turn + 0.45 * easeInOutCubic(turn)
    const turnRad = turnEased * THREE.MathUtils.degToRad(140)
    const idleSpin = time * 0.06

    // ---- THE DOCK (Round 8): one clean easeInOutCubic descent. The whole
    // crystal group simultaneously (1) scales to a small mark, (2) SPINS a
    // graceful ~1.25 turns on top of the idle, decelerating into the calm
    // idle, and (3) travels straight DOWN the screen from its hero on-screen
    // position to a fixed resting point below center. In the final beat we
    // cross-fade the fixed target to the LIVE DOM anchor for pixel-accurate
    // centering.
    const dkRaw = clamp01((p - DOCK_START) / (1 - DOCK_START))
    const dk = easeInOutCubic(dkRaw)
    if (groupRef.current) {
      const dockSpin = DOCK_SPIN * dk
      groupRef.current.rotation.y = turnRad + idleSpin + dockSpin
      groupRef.current.rotation.x =
        Math.sin(time * 0.2) * 0.03 + turnEased * 0.08
      groupRef.current.scale.setScalar(1 - (1 - DOCK_SCALE) * dk)

      if (dkRaw > 0) {
        tmp.set(0, 0, 0).project(state.camera)
        const heroX = tmp.x
        let targetX = heroX
        let targetY = REST_NDC_Y

        const bind = easeInOutCubic(clamp01((dkRaw - 0.95) / 0.05))
        if (bind > 0) {
          if (!anchorElRef.current)
            anchorElRef.current = document.querySelector('.mark-anchor')
          const el = anchorElRef.current
          if (el) {
            const rect = el.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            const aX = (cx / window.innerWidth) * 2 - 1
            const aY = -((cy / window.innerHeight) * 2 - 1)
            targetX = targetX + (aX - targetX) * bind
            targetY = targetY + (aY - targetY) * bind
          }
        }

        ndc.set(targetX, targetY, 0.5)
        ndc.unproject(state.camera)
        ndc.sub(state.camera.position).normalize()
        anchorWorld
          .copy(state.camera.position)
          .add(ndc.multiplyScalar(DOCK_DEPTH))
        groupRef.current.position.copy(anchorWorld).multiplyScalar(dk)
      } else {
        groupRef.current.position.set(0, 0, 0)
      }
    }

    // debug-only: expose the crystal group's screen-space center (pixels)
    // and world position, so verification can prove the dock descent is
    // monotonic downward without relying on stale computed styles.
    if (groupRef.current) {
      groupRef.current.getWorldPosition(tmp)
      const worldY = tmp.y
      ndc.copy(tmp).project(state.camera)
      window.__crystal = {
        p,
        worldY: Number(worldY.toFixed(4)),
        screenX: Number((((ndc.x + 1) / 2) * window.innerWidth).toFixed(1)),
        screenY: Number((((1 - ndc.y) / 2) * window.innerHeight).toFixed(1)),
        scale: Number(groupRef.current.scale.x.toFixed(4)),
        rotY: Number(groupRef.current.rotation.y.toFixed(4)),
      }
    }

    // core: machined metal, counter-rotating gently, alive forever
    if (coreRef.current) {
      coreRef.current.rotation.y = -time * 0.18 - turnRad * 0.5
      coreRef.current.rotation.x = time * 0.11
    }

    // ---- caustic pool + light choreography ----
    // the pool fades out across the dock (a docked mark sits on the page,
    // not in a pool of light); nothing pulses during the dock
    if (causticRef) {
      const still = easeInOutCubic(clamp01((p - DOCK_START) / 0.04))
      const breathe =
        (0.5 + 0.5 * Math.sin(time * 0.7)) * (1 - still) + 0.5 * still
      const gather = easeInOutCubic(clamp01((p - 0.415) / (SWAP_P - 0.415)))
      const pulse = easeOutCubic(clamp01((p - SWAP_P) / 0.048))
      const act3 = turnEased
      const opacity =
        assembly *
        (0.32 + 0.08 * breathe - 0.06 * gather + 0.3 * pulse + 0.34 * act3) *
        (1 - dk)
      const scale = 1 + 0.06 * breathe + 0.1 * pulse + 0.2 * act3
      const lightMul = 1 - 0.15 * gather + 0.1 * pulse
      causticRef.current = { opacity, scale, lightMul, dock: dk }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Whole hull, visible from the seat onward (never cut or split). */}
      <mesh
        ref={wholeRef}
        geometry={hull}
        material={glassMaterial}
        scale={OBJECT_SCALE}
        visible={false}
      />

      {/* Shard group (fragments + assembly). */}
      <group ref={shardGroupRef} scale={OBJECT_SCALE}>
        {shards.map((sh, i) => (
          <mesh
            key={i}
            geometry={sh.geo}
            material={glassMaterial}
            ref={(el) => (shardRefs.current[i] = el)}
          />
        ))}
      </group>

      {/* Inner metal core: one solid machined navy octahedron, refracted
          through the higher-IOR glass. */}
      <mesh ref={coreRef} scale={OBJECT_SCALE * 0.26}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#46527d"
          metalness={1}
          roughness={0.18}
          envMapIntensity={1.6}
          flatShading
        />
      </mesh>
    </group>
  )
}
