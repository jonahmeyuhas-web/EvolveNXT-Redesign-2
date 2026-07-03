// The interactive ripple needs WebGL2 + float render targets + a fine pointer.
// Anything short of that falls back to the plain looping video.
export function supportsRipple() {
  if (typeof window === 'undefined') return false
  if (!window.matchMedia('(pointer: fine)').matches) return false
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2')
    if (!gl) return false
    const ok = gl.getExtension('EXT_color_buffer_float')
    return !!ok
  } catch {
    return false
  }
}
