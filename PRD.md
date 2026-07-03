# EvolveNXT Website — Project Brief

**Owner:** Jonah
**Updated:** 2026-07-02
**Scope:** Homepage first, to lock the design direction. Inner pages follow.

## 1. What EvolveNXT is

Enterprise software for insurance carriers. Founded 2011, headquartered in
Los Angeles. The Evolve platform covers the entire producer lifecycle:
producer onboarding and contracting, enablement and training, producer
management and hierarchies, incentive compensation, web enrollment, lead
management, and CRM, across Health (deep Medicare Advantage specialization),
Life/Annuity, P&C, and agency distribution.

## 2. Design direction

A light, clean, modern, premium, spacious enterprise site. Calm, credible,
high-end. Taste references: sierra.ai (primary), glean.com, withpace.com.

- **Type:** Switzer (self-hosted variable font). One grotesque voice for
  everything; headlines around weight 450, tight tracking. No serif, no mono,
  no all-caps label spam.
- **Color:** warm white `#FBFAF8`, soft off-white `#F7F5F0`, pale stone
  `#F0EDE7`, light gray-blue `#EDF0F4` backgrounds. Near-black `#10131A`,
  charcoal `#2B2F38`, muted gray `#6E7480` text. Accents used sparingly:
  royal blue `#1B4CC1` (buttons, links, progress rule), deep navy `#020838`
  (one CTA surface, hero atmosphere tones).
- **Shape:** sharp by default. Radius only on pill buttons and the two large
  surfaces (hero media frame, CTA bookend).
- **Content:** every claim verbatim from live evolvenxt.com (sources noted in
  `src/content/site.js`). No fake metrics, logos, testimonials, dashboards,
  or invented copy. No em dashes anywhere.
- **Never:** cards/feature grids, mock UI, chat/search boxes, network or node
  graphics, abstract SVG diagrams, CSS gradient decoration, dark-SaaS looks.

## 3. Homepage structure

1. **Nav.** Fixed, light. Logo, four links, Contact sales, royal pill CTA.
   Gains hairline + blur backdrop after the fold.
2. **Hero (pinned, 250vh).** Centered headline from the site's own H1; on
   scroll it lifts away while the media frame opens aperture-style
   (clip-path) to near full-bleed. The frame holds a code-driven atmosphere:
   slow blue-hour light pools over warm stone with faint grain (canvas,
   DPR-capped, pauses when hidden). This frame is also the slot for an
   optional filmed loop later.
3. **Statement.** "Built by carriers, for carriers." with line-mask reveal,
   plus the founding sentence.
4. **Lifecycle (pinned, 555vh).** Five chapters: Onboarding & contracting,
   Enablement & training, Producer management, Incentive compensation,
   Lead management & CRM. Stage crossfades, ghost numerals, royal progress
   rule, background tone morphing warm white to stone to gray-blue.
5. **Module index.** Six products as large typographic rows linking to the
   live product pages.
6. **Lines of business.** Sticky headline, editorial blocks for Health,
   Life & Annuity, P&C, Agencies on the gray-blue field.
7. **Credibility, CTA, footer.** Real positioning line and location facts
   (no numeric stats; the live site publishes none in static HTML), navy
   rounded CTA bookend, light footer with real links.

## 4. Motion principles

Lenis smooth scroll + Motion for React. Scroll-linked choreography on the two
pinned sequences; one-shot reveals elsewhere via `useInViewOnce` (custom
IntersectionObserver driving the `animate` prop; Motion's `whileInView` is
avoided deliberately, it proved unreliable). Springs and eased scrubbing
only; no bounce, spin, marquee, or tilt. Under 1000px or
prefers-reduced-motion: pins off, stacked layouts, no smoothing.

## 5. Stack and deployment

Vite + React (JSX), `motion`, `lenis`. GitHub Pages via
`.github/workflows/deploy.yml` (builds with `--base=/<repo-name>/`; switch to
`/` for a custom domain). Local: `npm install && npm run dev`.

## 6. Roadmap

- Optional filmed hero loop (Higgsfield): abstract architectural light,
  never fake product UI; prompts to be written once the code hero is approved.
- Product showcase section once the product rebuild ships real screens.
- Inner pages: Products, Solutions, About, Clients, Security, Contact.
