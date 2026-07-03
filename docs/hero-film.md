# Hero Film: "Glass and Light"

The hero's aperture frame takes a filmed loop layered above the canvas
atmosphere (which stays as the instant-load base, the reduced-motion state,
and the fallback). Direction chosen: abstract macro of daylight refracting
through architectural glass, blue caustics on warm plaster. It is the
photographic version of the site's canvas atmosphere, so palette continuity
is automatic.

## Composition rules (why the prompts read the way they do)

- At scroll position zero the aperture reveals only the LOWER ~40% of the
  frame, then opens upward. The shot's interest must live in the lower third:
  light pooling along the bottom, caustics on the lower wall.
- Palette must match the site: warm ivory/stone field, royal blue and deep
  navy accents. Nothing saturated, nothing purple, no neon.
- Nearly still. The motion is light drifting, not objects or camera moving.
- Absolutely none of: people, faces, hands, text, logos, UI, screens,
  fast motion, flicker, lens-flare streaks.

## Recommended workflow: still first, then animate

Generate a STILL image first, pick the best frame, then animate that frame
with image-to-video. Stills are cheap to iterate so palette and composition
get locked before spending video credits, image-to-video preserves the
approved frame, and the chosen still doubles as the poster image.

**Step 1, image (16:9, generate 4 to 6, keep 1 or 2):**

> Architectural photography, macro view of soft morning daylight refracting
> through layered architectural glass onto a warm white plaster wall, gentle
> blue caustic light patterns pooling along the bottom third of the frame, a
> deep navy shadow falling across the upper right corner, warm ivory glow in
> the lower left, shallow depth of field with a softly blurred glass edge in
> the foreground, fine film grain, minimal, calm, premium and quiet, muted
> palette of warm ivory, pale stone, royal blue and deep navy, no people,
> no text

**Step 2, animate the chosen still (image-to-video, image 3 as first frame,
2 or 3 runs).** The failure mode in earlier runs was the model non-rigidly
warping the glass itself, which read as camera shake. This prompt pins every
physical object as solid and gives the light a specific motion vocabulary so
only the projected caustics move.

Primary:

> Cinematic macro shot of soft morning sunlight passing through a thick glass
> pane resting on a travertine stone block, casting a web of rippling blue
> caustic light across a warm ivory plaster floor. Animate only the light:
> the bright blue caustic pattern slowly ripples, undulates and shimmers
> across the plaster like sunlight reflecting off gently moving water, its
> delicate branching lines drifting and breathing in a slow continuous flow,
> while the warm glow in the lower left softly pulses. Every physical object
> stays perfectly still and completely solid: the glass pane, the stone
> block, the edges and the wall do not move, warp, bend, ripple, or change
> shape in any way. Locked-off tripod camera, zero camera movement, no zoom,
> no pan, no tilt, no parallax. Extremely smooth, slow, calm, continuous
> motion of light only. Serene minimal high-end architectural film, fine
> natural film grain, muted palette of warm ivory, pale stone, royal blue
> and deep navy.

Negative:

> camera movement, camera shake, handheld, zoom, pan, tilt, parallax, warping
> glass, morphing objects, bending edges, distortion, wobbling, rippling
> glass, changing composition, extra objects, people, faces, hands, text,
> letters, logos, watermarks, UI, screens, fast motion, strobing, flicker,
> saturated colors, neon, purple, lens flare

Settings: image 3 as the first/reference frame, motion strength low to
medium, 8 seconds, highest resolution, Veo 3.1 (Kling 3.0 as the backup to
compare). If a take warps the glass or drifts the camera, discard it; only
the light should live.

## Generation settings

- Aspect ratio: 16:9 (the frame crops it via object-fit: cover)
- Duration: longest the model offers (5 to 10s); the loop seam is handled
  in post with a palindrome, so the clip does NOT need to loop on its own
- Camera: static / locked-off preset; motion strength at the lowest setting
- Resolution: highest available (1080p minimum)
- Judge candidates against the palette, not the drama: warm base, blue
  accents, activity in the lower third

## Prompt A (primary): caustics on plaster

> Cinematic macro film of soft morning daylight refracting through layers of
> architectural glass, gentle blue caustic light patterns drifting very
> slowly across a warm white plaster wall, light pooling along the bottom of
> the frame, deep navy shadow in the upper right corner, warm glow in the
> lower left, static locked-off camera, extremely slow subtle movement,
> shallow depth of field, fine film grain, minimal and calm, premium
> architectural photography style, muted palette of warm ivory, pale stone,
> and royal blue accents

## Prompt B: stacked glass edges

> Extreme close-up of thick architectural glass panels stacked in layers,
> morning light passing through the glass edges and bending into soft blue
> and warm amber gradients, slow drifting internal reflections, a warm stone
> surface below catching pools of light along the bottom of the frame,
> static camera with almost imperceptible drift, soft focus, airy, minimal,
> high-end architectural film, muted palette of warm ivory, pale stone, deep
> navy blue, gentle film grain

## Prompt C: moving sun patch

> A soft patch of sunlight moving very slowly across a warm limestone wall
> inside a modern building, subtle blue-tinted shadows cast by unseen glass
> louvers, faint dust motes floating in the light beam, the bottom third of
> the frame glowing warmly, locked-off camera, ultra slow movement of light,
> architectural minimalism, muted warm whites with deep blue shadow tones,
> fine film grain, silent calm atmosphere, no people

## Negative prompt (all variants)

> people, faces, hands, text, letters, logos, watermarks, user interface,
> screens, exterior buildings, fast motion, flicker, saturated colors, neon,
> purple, lens flare streaks, busy patterns, camera shake

## Delivery and integration

1. Export/download the chosen clip at the highest offered quality (MP4).
2. Drop it anywhere in the project or Desktop and point Claude at it.
3. Integration steps (Claude): palindrome the clip with ffmpeg (forward +
   reversed concat) so the loop seam is invisible; scale to 1440px wide,
   H.264 CRF ~23, strip audio, target under 6 MB; extract a poster frame.
   Final file lives at `src/assets/hero-loop.mp4` (plus
   `src/assets/hero-poster.jpg`), which the HeroFilm component picks up
   automatically. ffmpeg is not yet installed on this machine
   (`brew install ffmpeg` when needed).
4. The video layer: muted, playsinline, autoplay, loop, fades in over the
   canvas once it can play through, hidden entirely under
   prefers-reduced-motion, paused while offscreen.
