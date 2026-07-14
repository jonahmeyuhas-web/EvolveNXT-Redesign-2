// All copy on this site comes verbatim from live evolvenxt.com pages,
// lightly re-set for case and line breaks only. Source URL noted per block.
// Em and en dashes in source copy are re-punctuated per brand rule.

const BASE = 'https://evolvenxt.com'

export const nav = {
  links: [
    { label: 'Products', href: `${BASE}/product/` },
    { label: 'Solutions', href: `${BASE}/solutions/` },
    { label: 'Clients', href: `${BASE}/partners/` },
    { label: 'About', href: `${BASE}/about/` },
  ],
  contact: { label: 'Contact sales', href: `${BASE}/contact/` },
  cta: { label: 'Request a demo', href: `${BASE}/contact/` },
}

// Source: evolvenxt.com home (H1 + intro paragraph)
export const hero = {
  headline: ['Next generation', 'insurance distribution', 'management'],
  sub: 'A flexible suite of modular components that enables insurance carriers to modernize and optimize distribution management across the entire producer lifecycle.',
  cta: { label: 'Request a demo', href: `${BASE}/contact/` },
  secondary: { label: 'Explore the products', href: `${BASE}/product/` },
  mediaCaption: 'Onboarding · Compensation · Enrollment · Portal · Leads · CRM',
}

// Proof strip: three positioning claims from the approved homepage mock.
export const proof = [
  { num: '01', claim: 'Rooted in carrier experience', support: 'Built by carriers, for carriers.' },
  { num: '02', claim: 'Built AI-first', support: 'Modern, enterprise-grade technology for insurance carriers.' },
  { num: '03', claim: 'One platform, every stage', support: 'Across the entire producer lifecycle.' },
]

// Placeholder client wordmarks, client-authorized (real logos to follow).
export const clientLogos = [
  { label: 'Atlas Health', cls: 'lgm-caps' },
  { label: 'Meridian Life', cls: 'lgm-light' },
  { label: 'Cornerstone P&C', cls: 'lgm-wide' },
  { label: 'beaconmutual', cls: 'lgm-bold' },
  { label: 'Northstar Annuity', cls: 'lgm-caps' },
  { label: 'Harborline', cls: 'lgm-mark' },
  { label: 'Summit Assurance', cls: 'lgm-wide' },
  { label: 'Bluefield Group', cls: 'lgm-light' },
  { label: 'PACIFICA RE', cls: 'lgm-bold' },
]

// Source: evolvenxt.com/about/
export const statement = {
  lines: ['Built by carriers,', 'for carriers.'],
  body: 'Our product was initially built by carriers for carriers, and we continue to use this customer-centric approach to product development. Founded in 2011, EvolveNXT builds modern, enterprise-grade technology platforms for insurance carriers across Health, Life and Property & Casualty.',
}

// Stage copy assembled from verbatim fragments:
// home intro, /evolve-ob/, /evolve-ppn/, /solutions/, /evolve-icm/, /evolve-crm/
export const lifecycle = {
  label: 'The producer lifecycle',
  intro: 'From onboarding to book-of-business management to enrollment and incentive compensation, one platform carries the producer through every stage.',
  stages: [
    {
      num: '01',
      title: 'Onboarding & contracting',
      body: 'Fully configurable onboarding supporting direct, delegated, and API-based models, with NIPR integration, automated background checks, and e-signature. Initial onboarding completed in minutes, not days.',
      keywords: 'NIPR · Background checks · E-signature · JIT appointments',
    },
    {
      num: '02',
      title: 'Enablement & training',
      body: 'Centralized access to required and optional training, certifications, and learning content. Ready-to-Sell status tracking with requirement-level visibility and tasking.',
      keywords: 'Ready-to-Sell · Certifications · Learning management',
    },
    {
      num: '03',
      title: 'Producer management',
      body: 'Complete producer management capabilities including demographics, compliance profiles, hierarchies, book-of-business, performance metrics and scorecards.',
      keywords: 'Hierarchies · Compliance · Book of business',
    },
    {
      num: '04',
      title: 'Incentive compensation',
      body: 'Purpose-built for insurance and powered by a scalable, high-volume processing engine. Commission, bonus, and supplemental compensation for both internal and external distribution.',
      keywords: 'Commission · Bonus · Advances & chargebacks',
    },
    {
      num: '05',
      title: 'Lead management & CRM',
      body: 'Configurable lead distribution, seamless lead capture from any source, and CRM capabilities designed specifically to support insurance producers with follow-up, activity tracking, and pipeline visibility.',
      keywords: 'Lead routing · Campaigns · Pipeline visibility',
    },
  ],
}

// Source: evolvenxt.com/product/ (names, descriptions, order from the live Products page)
export const modules = {
  label: 'The platform',
  headline: 'End-to-end, modular distribution management.',
  sub: 'For all lines of business and all sales channels.',
  intro: 'Evolve DPM is a complete, modular, end-to-end distribution management platform, combining carrier-grade functionality with a broad range of producer-facing capabilities. With unmatched breadth and depth across the distribution lifecycle, Evolve delivers more functional coverage than any other solution in the market.',
  items: [
    {
      num: '01',
      name: 'Producer Onboarding',
      desc: 'A comprehensive API-driven onboarding and contracting platform, including NIPR integration, appointment processing, JIT appointments, automated background checks, e-signature, ready-to-sell and training support.',
      href: `${BASE}/evolve-ob/`,
    },
    {
      num: '02',
      name: 'Incentive Compensation Management',
      desc: 'Purpose-built for insurance and highly configurable, supporting Health, Life, and P&C lines on a robust, extensible insurance data model.',
      href: `${BASE}/evolve-icm/`,
    },
    {
      num: '03',
      name: 'Producer Portal & Notifications',
      desc: 'A centralized producer portal that delivers a unified experience from initial onboarding through ongoing management of the producer’s book of business.',
      href: `${BASE}/evolve-ppn/`,
    },
    {
      num: '04',
      name: 'Web Enrollment',
      desc: 'Specialized module supporting efficient and paperless plan quoting and enrollment for both Producer Assisted Enrollment and Member Self Enrollment.',
      href: `${BASE}/evolve-bae/`,
    },
    {
      num: '05',
      name: 'Lead Management',
      desc: 'Advanced capabilities for processing, managing, and distributing leads with detailed analytics and insights into lead conversion rates and overall sales performance.',
      href: `${BASE}/evolve-crm/`,
    },
    {
      num: '06',
      name: 'CRM',
      desc: 'A single place for producers to manage leads and day-to-day selling activity, with follow-up, activity tracking, and pipeline visibility built for insurance.',
      href: `${BASE}/evolve-crm/`,
    },
  ],
}

// Sources: /health-insurance/, /life/, /property-casualty/, /agency/
export const lob = {
  label: 'Lines of business',
  headline: 'Built for Health, Life and Property & Casualty.',
  items: [
    {
      name: 'Health Insurance',
      body: 'EvolveNXT’s core focus is health insurance distribution, with deep specialization in Medicare Advantage and support for commercial lines including group, individual, and family business.',
      href: `${BASE}/health-insurance/`,
    },
    {
      name: 'Life & Annuity',
      body: 'Life and Annuity distribution introduces operational complexity that can be very challenging for legacy platforms. EvolveNXT supports end-to-end producer lifecycle management from onboarding through compensation and ongoing communication.',
      href: `${BASE}/life/`,
    },
    {
      name: 'Property & Casualty',
      body: 'P&C distribution models are often agency-centric. EvolveNXT supports structured performance programs with clear reporting, configurable calculations, and targeted notifications, helping carriers improve trust and alignment with their agency partners.',
      href: `${BASE}/property-casualty/`,
    },
    {
      name: 'Agencies',
      body: 'EvolveNXT helps agencies reduce the time and effort spent managing the day-to-day administration of their sales channel, especially agent onboarding, readiness, and ongoing support.',
      href: `${BASE}/agency/`,
    },
  ],
}

// Source: evolvenxt.com/about/
export const credibility = {
  line: 'The most comprehensive modern distribution performance management software suite on the market, with industry-leading white-glove service.',
  facts: [
    'Founded in 2011',
    'Headquartered in Los Angeles',
    'Full team based in the United States',
  ],
}

// Source: site-wide CTA block
export const cta = {
  label: 'Request a demo today',
  headline: 'See Evolve’s solutions in action.',
  body: 'Learn how our purpose-built platform helps carriers drive performance, simplify operations, and scale growth.',
  button: { label: 'Contact us', href: `${BASE}/contact/` },
}

export const footer = {
  about: 'Founded in 2011, EvolveNXT builds modern, enterprise-grade technology platforms for insurance carriers across Health, Life and Property & Casualty.',
  columns: [
    {
      title: 'Products',
      links: [
        { label: 'Producer Onboarding', href: `${BASE}/evolve-ob/` },
        { label: 'Incentive Compensation', href: `${BASE}/evolve-icm/` },
        { label: 'Producer Portal & Notifications', href: `${BASE}/evolve-ppn/` },
        { label: 'Web Enrollment', href: `${BASE}/evolve-bae/` },
        { label: 'CRM', href: `${BASE}/evolve-crm/` },
      ],
    },
    {
      title: 'Solutions',
      links: [
        { label: 'Health Insurance', href: `${BASE}/health-insurance/` },
        { label: 'Life/Annuity', href: `${BASE}/life/` },
        { label: 'Property & Casualty', href: `${BASE}/property-casualty/` },
        { label: 'Agencies', href: `${BASE}/agency/` },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: `${BASE}/about/` },
        { label: 'Clients', href: `${BASE}/partners/` },
        { label: 'News', href: `${BASE}/news/` },
        { label: 'Careers', href: `${BASE}/jobs/` },
        { label: 'Security', href: `${BASE}/security/` },
        { label: 'Contact Sales', href: `${BASE}/contact/` },
      ],
    },
  ],
  legal: {
    copyright: 'Copyright 2026 EvolveNXT. All Rights Reserved.',
    privacy: { label: 'Privacy Policy', href: `${BASE}/privacy-policy/` },
  },
}
