# Hero "Caustic Constellation" — execution spec

Replaces the current "through the glass" iris transition (delete the iris
layers). Reference: motionsites.ai "Future-State" template — one continuous
subject of glowing light strands that MORPHS between choreographed formations
as you scroll, fully scrubbable in both directions, inside a pinned hero.
Ours translates that to the Evolve landing page: the strands are born from
the film's caustic light, and the sequence resolves into the statement
section. The pinned hero tells its own visual story; it does NOT narrate the
site's content (no chapter headlines beyond the ones below).

## Choreography (pinned scene, ~260vh, scroll-scrubbed)

Progress p = scroll through the pinned scene, spring-smoothed. Every beat is
a pure function of p so scrolling back plays it in reverse.

- **Rest (p=0):** the landing page exactly as it is today: film, headline,
  torch + lightning interactivity.
- **Beat 1 "Emergence" (p 0 to 0.30):** headline/sub/CTAs lift and fade
  (existing motion). The interactive FX canvas fades out by p=0.12. The
  backdrop deepens: scrim warm-white fades and a deep navy tone
  (brand #020838 family) rises over the film — the one deliberate dark
  moment, contained inside the sequence. Electric-blue strands grow out of
  the film's caustic band (lower third) and the glass point, as if the
  caustic light is lifting off the surface.
- **Beat 2 "Bloom" (p 0.30 to 0.65):** strands morph from the low spill
  formation into an upward blooming fan (the reference's signature move),
  centered composition, gentle turbulence so it feels alive.
- **Beat 3 "Resolve" (p 0.65 to 1.0):** the fan gathers into a clean rising
  arc, then condenses: strands converge into a thin horizontal electric-blue
  line low on the screen while the navy backdrop lifts back to warm white.
  "Built by carriers, for carriers." (the statement section) arrives as the
  scene unpins, so the condensed line reads as the energy handing off to the
  statement. (Visual alignment only; the statement stays its own section.)

No chapter index, no extra copy inside the sequence. The story is visual.

## Strand system (the core build)

- New component `src/components/HeroConstellation.jsx`. Raw WebGL2 (no new
  deps). One instanced draw call.
- ~300 strands x ~24 segments rendered as instanced triangle-strip ribbons
  (or GL_LINES if ribbons prove fiddly). Per-strand attributes: id, random
  seed, base position, length scale, phase.
- Vertex shader computes each formation analytically from (strandId, segT,
  time, seed):
  1. **Spill:** strands lie along the caustic band (lower third), drooping
     with slight arcs, tips glowing.
  2. **Bloom:** fan rising from the glass point (approx 33% x, 55% y of
     viewport), spreading 120 degrees, arcing outward.
  3. **Arc:** ordered crown/arc formation, strands aligned and calmer.
  4. **Line:** near-horizontal condensed line (the handoff), tight and thin.
- Uniform `uMorph` in [0,3]: shader mixes formation k to k+1 with
  smoothstep. JS maps scroll p to uMorph (0-0.3 -> 0-1, 0.3-0.65 -> 1-2,
  0.65-1 -> 2-3). Plus `uTime` turbulence (small curl-ish noise offsets) so
  strands shimmer continuously even at fixed p.
- Color: deep electric blue core (#123fb0) to bright tip (#7aa8ff), additive
  blending over the darkened backdrop; global opacity 0 before p=0.05 and
  fades with the condense at the end.
- DPR cap 1.5. Pause the hero video once p > 0.15 (reuse the existing
  useMotionValueEvent pause pattern) and resume when scrolling back.
- prefers-reduced-motion or <1000px: no pin, no strands — the current plain
  hero fallback stays as is.

## Integration changes

- `Hero.jsx`: keep the 220vh (bump to ~260vh) pinned scene and sticky
  wrapper; DELETE the iris divs and their clip-path motion values; add the
  navy backdrop layer (opacity driven by p) and `<HeroConstellation p={...}/>`
  above the film, below the copy. FX (torch/lightning) opacity driven to 0 by
  p=0.12.
- `sections.css`: remove `.hero-iris*`; add `.hero-night` (absolute inset,
  background deep navy, pointer-events none) and `.hero-constellation`
  (absolute inset canvas).
- Statement section stays directly after the hero (already reordered).

## Acceptance criteria

- Scrubbing down and up replays the morph smoothly in both directions.
- The strand field reads as electric-blue light (no white blowout), clearly
  born from the film's caustics, on a navy backdrop that exists ONLY inside
  the pinned beat and returns to warm white by the unpin.
- Headline is gone before the strands dominate; statement arrives cleanly.
- 60fps target on desktop; video paused during the sequence; single draw
  call for strands; no console errors.
- Mobile/reduced-motion: unchanged plain hero.

## Verification notes (environment quirks)

- The Claude preview tab often reports visibilityState=hidden which SUSPENDS
  rAF: scroll-linked values read stale and FPS probes return 0. Verify via
  preview_screenshot (forces a paint) at several scroll positions.
- Pinned scene only exists at >=1000px viewport width.
- Serve via the scratchpad static-server workaround (launch.json), copying
  dist/ after each build.
