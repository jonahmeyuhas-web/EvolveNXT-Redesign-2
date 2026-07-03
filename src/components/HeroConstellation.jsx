import { useEffect, useRef } from 'react'

// Caustic Constellation: a field of electric-blue light strands, born from the
// film's caustics, that morphs between formations as scroll scrubs it. One
// instanced WebGL2 draw call. Driven by a Motion `progress` value (0..1).
// See docs/hero-constellation.md.

const STRANDS = 260
const SEG = 22 // points per strand
const SEGS = SEG - 1 // segments per strand
const INSTANCES = STRANDS * SEGS

const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;   // along {0,1}, side {-1,1}
layout(location=1) in float aStrand;
layout(location=2) in float aSeg;
uniform float uCount;
uniform float uSeg;
uniform float uMorph;   // 0..3
uniform float uTime;
uniform float uAspect;
out float vSide;
out float vT;
out float vSeed;

vec2 hash2(float n){ return fract(sin(vec2(n, n + 1.7)) * vec2(43758.5453, 22578.145)); }

vec2 formSpill(float a, float rnd, float t){
  vec2 root = vec2(mix(-0.95, 0.95, a) + (rnd - 0.5) * 0.1, -0.55 + (rnd - 0.5) * 0.18);
  vec2 dir = normalize(vec2((a - 0.5) * 0.5, -0.35));
  float len = 0.18 + rnd * 0.16;
  vec2 p = root + dir * (t * len);
  p += vec2(-dir.y, dir.x) * sin(t * 9.4 + rnd * 6.28) * 0.03 * t;
  return p;
}
vec2 formBloom(float a, float rnd, float t){
  vec2 O = vec2(-0.34, -0.1);
  float ang = mix(-1.05, 1.05, a) + (rnd - 0.5) * 0.25;
  vec2 dir = vec2(sin(ang), cos(ang));
  float len = 0.75 + rnd * 0.5;
  vec2 p = O + dir * (t * len);
  p.x += (ang < 0.0 ? -1.0 : 1.0) * (t * t) * 0.15 * (0.5 + rnd * 0.5);
  return p;
}
vec2 formArc(float a, float rnd, float t){
  vec2 C = vec2(0.0, -1.0);
  float ang = mix(-1.15, 1.15, a);
  vec2 dir = vec2(sin(ang), cos(ang));
  vec2 root = C + dir * 0.35;
  float len = 0.95 + rnd * 0.2;
  vec2 p = root + dir * (t * len);
  p += vec2(-dir.y, dir.x) * sin(t * 4.0 + rnd * 6.28) * 0.015 * t;
  return p;
}
vec2 formLine(float a, float rnd, float t){
  vec2 root = vec2(mix(-1.05, 1.05, a), -0.5 + (rnd - 0.5) * 0.04);
  float len = 0.05 + rnd * 0.04;
  return root + vec2(1.0, 0.0) * (t * len);
}

vec2 strandPos(float sid, float t){
  float a = sid / uCount;
  float rnd = hash2(sid).x;
  float m = uMorph;
  int k = int(floor(m));
  float f = smoothstep(0.0, 1.0, fract(m));
  vec2 F0 = formSpill(a, rnd, t);
  vec2 F1 = formBloom(a, rnd, t);
  vec2 F2 = formArc(a, rnd, t);
  vec2 F3 = formLine(a, rnd, t);
  vec2 arr0 = (k == 0) ? F0 : (k == 1) ? F1 : (k == 2) ? F2 : F3;
  vec2 arr1 = ((k + 1) == 1) ? F1 : ((k + 1) == 2) ? F2 : F3;
  vec2 p = mix(arr0, arr1, f);
  p += vec2(sin(p.x * 3.0 + uTime * 0.7 + rnd * 6.28),
            cos(p.y * 2.6 - uTime * 0.6 + rnd * 6.28)) * 0.02 * t;
  return p;
}

float halfWidth(float sid, float t){
  float rnd = hash2(sid).y;
  return (0.0045 + rnd * 0.003) * (1.0 - t * 0.85);
}

void main(){
  float t0 = aSeg / (uSeg - 1.0);
  float t1 = (aSeg + 1.0) / (uSeg - 1.0);
  vec2 P0 = strandPos(aStrand, t0);
  vec2 P1 = strandPos(aStrand, t1);
  float along = aCorner.x;
  float side = aCorner.y;
  vec2 P = mix(P0, P1, along);
  vec2 tang = normalize(P1 - P0 + vec2(1e-5));
  vec2 nrm = vec2(-tang.y, tang.x);
  float tHere = mix(t0, t1, along);
  float hw = halfWidth(aStrand, tHere);
  vec2 Pw = P + nrm * side * hw;
  vSide = side;
  vT = tHere;
  vSeed = hash2(aStrand).x;
  gl_Position = vec4(Pw.x / uAspect, Pw.y, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
in float vSide;
in float vT;
in float vSeed;
uniform float uOpacity;
uniform float uTime;
uniform vec3 uCore;
uniform vec3 uTip;
out vec4 frag;
void main(){
  float edge = pow(1.0 - abs(vSide), 1.6);
  float flick = 0.85 + 0.15 * sin(uTime * 2.0 + vSeed * 30.0);
  float bright = (0.3 + 0.7 * smoothstep(0.25, 1.0, vT)) * flick;
  vec3 col = mix(uCore, uTip, smoothstep(0.2, 1.0, vT));
  float a = edge * bright * uOpacity;
  frag = vec4(col * a, a);
}`

function compile(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) || 'shader compile failed')
  }
  return s
}

export default function HeroConstellation({ progress }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let gl
    try {
      gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: true, alpha: true })
      if (!gl) return
    } catch {
      return
    }

    let prog
    try {
      prog = gl.createProgram()
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    } catch {
      return
    }

    // base quad corners (triangle strip)
    const corners = new Float32Array([0, -1, 0, 1, 1, -1, 1, 1])
    const cbuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, cbuf)
    gl.bufferData(gl.ARRAY_BUFFER, corners, gl.STATIC_DRAW)

    // per-instance strand + seg
    const inst = new Float32Array(INSTANCES * 2)
    for (let i = 0; i < INSTANCES; i++) {
      inst[i * 2] = Math.floor(i / SEGS)
      inst[i * 2 + 1] = i % SEGS
    }
    const ibuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, ibuf)
    gl.bufferData(gl.ARRAY_BUFFER, inst, gl.STATIC_DRAW)

    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, cbuf)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, ibuf)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 8, 0)
    gl.vertexAttribDivisor(1, 1)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 8, 4)
    gl.vertexAttribDivisor(2, 1)

    const U = {
      count: gl.getUniformLocation(prog, 'uCount'),
      seg: gl.getUniformLocation(prog, 'uSeg'),
      morph: gl.getUniformLocation(prog, 'uMorph'),
      time: gl.getUniformLocation(prog, 'uTime'),
      aspect: gl.getUniformLocation(prog, 'uAspect'),
      opacity: gl.getUniformLocation(prog, 'uOpacity'),
      core: gl.getUniformLocation(prog, 'uCore'),
      tip: gl.getUniformLocation(prog, 'uTip'),
    }

    let W = 0
    let H = 0
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      W = Math.max(2, Math.round(rect.width * dpr))
      H = Math.max(2, Math.round(rect.height * dpr))
      canvas.width = W
      canvas.height = H
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(canvas)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE) // premultiplied additive

    let raf = 0
    let disposed = false
    const start = performance.now()

    const draw = () => {
      if (disposed) return
      raf = requestAnimationFrame(draw)
      if (!visible || document.visibilityState !== 'visible') return

      const p = progress && progress.get ? progress.get() : 0
      // morph: 0->0.30 => 0..1, 0.30->0.65 => 1..2, 0.65->1 => 2..3
      let morph
      if (p < 0.3) morph = (p / 0.3)
      else if (p < 0.65) morph = 1 + (p - 0.3) / 0.35
      else morph = 2 + (p - 0.65) / 0.35
      morph = Math.max(0, Math.min(3, morph))
      // opacity: fade in 0.03..0.12, fade out 0.9..1.0
      let op = 1
      if (p < 0.03) op = 0
      else if (p < 0.12) op = (p - 0.03) / 0.09
      else if (p > 0.9) op = Math.max(0, 1 - (p - 0.9) / 0.1)
      if (op <= 0.001) {
        gl.viewport(0, 0, W, H)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        return
      }

      gl.viewport(0, 0, W, H)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(prog)
      gl.bindVertexArray(vao)
      gl.uniform1f(U.count, STRANDS)
      gl.uniform1f(U.seg, SEG)
      gl.uniform1f(U.morph, morph)
      gl.uniform1f(U.time, (performance.now() - start) / 1000)
      gl.uniform1f(U.aspect, W / H)
      gl.uniform1f(U.opacity, op)
      gl.uniform3f(U.core, 0.1, 0.34, 0.9)
      gl.uniform3f(U.tip, 0.58, 0.74, 1.0)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, INSTANCES)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [progress])

  return <canvas ref={canvasRef} className="hero-constellation" aria-hidden="true" />
}
