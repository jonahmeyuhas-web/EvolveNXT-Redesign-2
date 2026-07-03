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

## Generation settings

- Aspect ratio: 16:9 (the frame crops it via object-fit: cover)
- Duration: longest the model offers (5 to 10s); the loop seam is handled
  in post with a palindrome, so the clip does NOT need to loop on its own
- Camera: static / locked-off preset; motion strength at the lowest setting
- Resolution: highest available (1080p minimum)
- Generate 3 or 4 seeds per prompt; pick against the palette, not the drama

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
