# Port the crystal hero into the live site

Bring the APPROVED crystal-hero scroll experience from the standalone prototype
(../evolvenxt-crystal-proto, final Round 9 state) into this site as the landing
page hero, replacing the current (rejected) constellation hero.

## Source of truth

Read the prototype first: ../evolvenxt-crystal-proto/docs/spec.md (full round
history + final decisions) and its src/ (Scene.jsx = canvas/lights/scroll,
Crystal.jsx = shared material + shards + hull + core + dock, App.jsx = scroll
track + overlay, overlay.css). Port that behavior; do not re-invent it. The
approved final state is: fragments -> assembly -> turn -> DOCK (crystal shrinks,
spins ~450deg, travels monotonically DOWN the screen, lands centered) as a small
living mark. Material: ONE shared MeshPhysicalMaterial (roughness 0.01, ior 1.78,
envMapIntensity 1.9, clearcoat 1, dispersion 0.18, periwinkle attenuation),
lightformer environment. Keep every one of these; this is a straight port, not a
redesign.

## Integration decisions (already made)

1. REAL COPY. During fragments/assembly the hero shows the real headline
   (hero.headline = ['Next generation','insurance distribution','management']),
   sub, and CTAs (hero.cta 'Request a demo', hero.secondary 'Explore the
   products') from src/content/site.js, in the site's Switzer type and existing
   .hero-copy styling, lifting away on scroll as in the prototype.
2. THE DOCK HANDS OFF INTO THE EXISTING STATEMENT SECTION. The site's Statement
   already reads "Built by carriers, / for carriers." (src/components/Statement.jsx,
   statement.lines) - the exact copy the dock was designed around. So the crystal
   docks as a small mark at/above the Statement, and the page then continues into
   the existing sections (Lifecycle, ModulesIndex, ProductShowcase, LinesOfBusiness,
   Credibility, CtaBookend, Footer). Do NOT add a new "Built by carriers" section
   and do NOT duplicate that copy. Reconcile the docked mark with Statement's
   existing editorial layout tastefully (the mark should read as intentional above
   or beside the statement, not fight its text); tune and make it reviewable.
3. REUSE THE SITE'S LENIS. App.jsx already wraps everything in <ReactLenis root
   options={{ lerp: 0.09, smoothWheel: true }}> and exposes window.__lenis via
   LenisExposer + useLenis. Drive the crystal's scroll progress from THIS Lenis
   (useLenis hook / the shared instance). Do NOT add a second Lenis or a
   hand-rolled spring - one smoothing layer only (this was a hard lesson).
4. LOCAL ONLY. Build and verify locally. Do NOT deploy / git push / touch Pages.
   No git commits at all - leave the work in the tree for review.

## Mandatory fallback (not optional)

3D hero needs a graceful degradation path. Show a STATIC POSTER (a still of the
seated crystal over the warm-white field with the real headline) instead of the
canvas when ANY of these is true:
- viewport < 1000px (matches the site's existing pinned-section breakpoint),
- prefers-reduced-motion: reduce,
- WebGL2 unavailable / context creation fails.
Produce the poster asset: render the seated crystal (Act 3 framing) to an image
and save it to src/assets (e.g. hero-crystal-poster.jpg/webp). If sandbox
screenshots are unreliable, render it from the prototype at a good frame and
export, or draw it at high dpr offscreen. The fallback is a normal static hero
(poster background + .hero-copy), no pin, no canvas.

## Performance / loading

- LAZY-LOAD the 3D. three + @react-three/fiber + @react-three/drei must be code-
  split (React.lazy + Suspense or dynamic import) so they are NOT in the initial
  bundle and do not block first paint. Render the poster immediately; mount the
  canvas after the chunk loads and cross-fade from poster to live canvas (no pop,
  no flash). Under the fallback conditions above, never load the 3D chunk at all.
- Add deps to package.json at versions compatible with React 19 - match the exact
  versions the prototype resolved (check its package.json / lockfile).
- Cap dpr [1,1.5], all the prototype's PERF rules carry over (one shared
  MeshPhysicalMaterial, no MTM, no per-mesh FBO). Keep window.__bench available.

## Constraints (site-wide, all hard)

- No em-dashes anywhere (code, comments, copy). No CSS gradients. Sharp corners
  except the site's existing pill buttons. Switzer type. Palette royal #1B4CC1 /
  navy #020838 / warm-white #FBFAF8. Reuse existing design tokens and .hero-copy
  patterns; match the codebase style. Reveals elsewhere use src/lib/useInViewOnce
  (do not touch those sections).
- Only replace the hero. Do NOT alter Statement/Lifecycle/Modules/etc. beyond the
  minimal wiring needed for the dock handoff into Statement.

## Verify (preview sandbox quirks - documented, do not rediscover)

- Preview server cannot serve ~/Documents (getcwd sandbox). Build, copy dist into
  the session scratchpad, serve via .claude/launch.json in the session cwd. There
  is already a config "evolvenxt" on port 4318 serving <scratchpad>/preview - use
  it (copy this build's dist to <scratchpad>/preview) or add a fresh one; do not
  clobber the "crystal" 4319 config. Session scratchpad:
  /private/tmp/claude-502/-Users-jonahthefatkid-Documents-Claude-Projects-U-S--History-Watergate-Scandal/0fe2a9bb-71e9-4629-b6da-764bccc808bd/scratchpad
  Session cwd (launch.json lives here):
  /Users/jonahthefatkid/Documents/Claude/Projects/U.S. History Watergate Scandal
  Vite base is the Pages path; for local preview build with base './' (do NOT
  commit a changed base) or serve so asset URLs resolve.
- Hidden preview tab suspends rAF and blanks fixed elements translated by
  -scrollY; verify scroll-linked motion via preview_screenshot after
  window.scrollTo, and judge material quality on the large seated crystal, not the
  tiny docked mark (small-scale FBO artifacts are a sandbox illusion).
- Pinned/3D hero only at >=1000px; test the fallback at <1000px and with
  prefers-reduced-motion.

## Acceptance

1. Desktop: full crystal experience with the REAL hero copy, docking into the
   existing Statement, page continues cleanly into the rest of the homepage. One
   Lenis (no double smoothing). Scrubs both directions.
2. Fallback: <1000px, reduced-motion, and no-WebGL each show the static poster
   hero; the 3D chunk is not loaded in those cases.
3. Initial bundle does not contain three/r3f (code-split verified); first paint
   shows poster; canvas cross-fades in.
4. No em-dashes, no CSS gradients, palette/type correct, bench tiny.
5. Nothing pushed/deployed; evolvenxt-site changes left uncommitted for review;
   the stashed Dive work is untouched.

Report: files added/changed, how the dock meets Statement, the poster asset +
how it was produced, bundle-split proof, fallback verification for all three
conditions, bench, screenshots (desktop states + fallback), and concerns.
