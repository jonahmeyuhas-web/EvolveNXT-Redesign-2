// Cheap one-time WebGL2 capability probe. Creates a throwaway canvas and
// tries to get a webgl2 context; if creation throws or returns null the
// crystal hero falls back to the static poster and the 3D chunk is never
// imported. Cached so repeated calls are free.
let cached

export function hasWebGL2() {
  if (typeof cached === 'boolean') return cached
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    cached = false
    return cached
  }
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    cached = !!gl
  } catch {
    cached = false
  }
  return cached
}
