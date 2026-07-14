import { modules } from '../content/site'
import heroPoster from '../assets/hero-poster.jpg'

// Platform tour: six real modules as atmosphere cards, each a varied treatment
// of the one hero photograph (Ken Burns drift, solid blends only) with a
// product fragment floating in front. GSAP owns each card's entrance rise
// (wired in useHomepageMotion); hover lift lives on the inner .m-field.
// Status WORDS only in fragments - no names, numbers, dollars or percentages.

// Per-card presentation (field atmosphere, accent family, size, focal point),
// matched 1:1 to the approved mock. num/name/desc come from site content.
const cards = [
  { field: 'f-royal', fam: 'fam-royal', lg: true, d: '0s', pos: '18% 25%', ov: 2 },
  { field: 'f-warm', fam: 'fam-gold', lg: true, d: '0.12s', pos: '88% 78%', ov: 2 },
  { field: 'f-mist', fam: 'fam-sky', lg: false, d: '0s', pos: '70% 20%', ov: 2 },
  { field: 'f-stone', fam: 'fam-gold', lg: false, d: '0.12s', pos: '40% 8%', ov: 2 },
  { field: 'f-royal-deep', fam: 'fam-royal', lg: false, d: '0s', pos: '55% 75%', ov: 3 },
  { field: 'f-royal-soft', fam: 'fam-sky', lg: false, d: '0.12s', pos: '8% 85%', ov: 2 },
]

const fragments = [
  // 01 Producer Onboarding: checklist
  <>
    <div className="fr-head">
      Onboarding &amp; contracting <span className="fr-chip">Ready to sell</span>
    </div>
    <div className="fr-rows">
      <div className="fr-row">
        <span className="fr-left">
          <span className="fr-check done"></span>NIPR integration
        </span>
        <span className="fr-word">Complete</span>
      </div>
      <div className="fr-row">
        <span className="fr-left">
          <span className="fr-check done"></span>Background checks
        </span>
        <span className="fr-word">Cleared</span>
      </div>
      <div className="fr-row">
        <span className="fr-left">
          <span className="fr-check done"></span>E-signature
        </span>
        <span className="fr-word">Signed</span>
      </div>
      <div className="fr-row">
        <span className="fr-left">
          <span className="fr-check"></span>JIT appointments
        </span>
        <span className="fr-word">Pending</span>
      </div>
    </div>
  </>,
  // 02 Incentive Compensation Management: run table
  <>
    <div className="fr-head">
      Incentive compensation <span className="fr-chip">Scheduled</span>
    </div>
    <div className="fr-rows">
      <div className="fr-row">
        <span className="fr-left">Commission</span>
        <span className="fr-word">Processed</span>
      </div>
      <div className="fr-row">
        <span className="fr-left">Bonus</span>
        <span className="fr-word">Processed</span>
      </div>
      <div className="fr-row">
        <span className="fr-left">Supplemental</span>
        <span className="fr-word" data-flip="Processed" data-period="7000" data-offset="0">
          Scheduled
        </span>
      </div>
      <div className="fr-row">
        <span className="fr-left">Advances &amp; chargebacks</span>
        <span className="fr-word">In review</span>
      </div>
    </div>
  </>,
  // 03 Producer Portal & Notifications: notifications
  <>
    <div className="fr-head">Notifications</div>
    <div className="fr-rows">
      <div className="fr-row">
        <span className="fr-left">
          <span className="fr-dot"></span>Ready-to-sell status
        </span>
        <span className="fr-word">Updated</span>
      </div>
      <div className="fr-row">
        <span className="fr-left">
          <span className="fr-dot"></span>Book of business
        </span>
        <span className="fr-word">Updated</span>
      </div>
      <div className="fr-row">
        <span className="fr-left">
          <span className="fr-dot"></span>Certifications
        </span>
        <span className="fr-word" data-flip="Complete" data-period="8000" data-offset="2600">
          Assigned
        </span>
      </div>
    </div>
  </>,
  // 04 Web Enrollment: steps
  <>
    <div className="fr-head">
      Web Enrollment <span className="fr-chip">Paperless</span>
    </div>
    <div className="fr-rows">
      <div className="fr-row">
        <span className="fr-left">
          <span className="fr-num">01</span>Plan quoting
        </span>
      </div>
      <div className="fr-row">
        <span className="fr-left">
          <span className="fr-num">02</span>Producer Assisted Enrollment
        </span>
      </div>
      <div className="fr-row">
        <span className="fr-left">
          <span className="fr-num">03</span>Member Self Enrollment
        </span>
      </div>
    </div>
  </>,
  // 05 Lead Management: routing
  <>
    <div className="fr-head">Lead routing</div>
    <div className="fr-rows">
      <div className="fr-row">
        <span className="fr-left">Capture</span>
        <span className="fr-word">Any source</span>
      </div>
      <div className="fr-row">
        <span className="fr-left">Distribution</span>
        <span className="fr-word">Configurable</span>
      </div>
      <div className="fr-row">
        <span className="fr-left">Conversion</span>
        <span className="fr-word">Insights</span>
      </div>
    </div>
  </>,
  // 06 CRM: pipeline
  <>
    <div className="fr-head">Pipeline</div>
    <div className="fr-cards">
      <div className="fr-card">
        Follow-up <span className="fr-word">Scheduled</span>
      </div>
      <div className="fr-card">
        Activity tracking <span className="fr-word">Logged</span>
      </div>
      <div className="fr-card">
        Campaigns{' '}
        <span className="fr-word" data-flip="Scheduled" data-period="9000" data-offset="5200">
          Active
        </span>
      </div>
    </div>
  </>,
]

function headlineWithAccent(headline) {
  const parts = headline.split('modular')
  if (parts.length !== 2) return headline
  return (
    <>
      {parts[0]}
      <span className="acc-i">modular</span>
      {parts[1]}
    </>
  )
}

export default function PlatformTour() {
  return (
    <section className="modules">
      <div className="container">
        <div className="modules-head rv">
          <div>
            <span className="sec-label ri" style={{ '--d': '0s' }}>
              {modules.label}
            </span>
            <h2 className="modules-headline maskhead">
              <span className="mask">
                <span className="mline-s">{headlineWithAccent(modules.headline)}</span>
              </span>
            </h2>
            <p className="modules-sub ri" style={{ '--d': '0.16s' }}>
              {modules.sub}
            </p>
          </div>
          <p className="modules-intro ri" style={{ '--d': '0.2s' }}>
            {modules.intro}
          </p>
        </div>

        <div className="m-grid">
          {modules.items.map((item, i) => {
            const c = cards[i]
            return (
              <div
                className={`m-card${c.lg ? ' lg' : ''} ${c.fam} rv ri`}
                style={{ '--d': c.d }}
                key={item.num}
              >
                <div className={`m-field ${c.field}`}>
                  <div className="m-kb">
                    <img src={heroPoster} alt="" style={{ objectPosition: c.pos }} />
                  </div>
                  <span className="ov ov1"></span>
                  <span className="ov ov2"></span>
                  {c.ov === 3 && <span className="ov ov3"></span>}
                  <div className="m-frag">{fragments[i]}</div>
                </div>
                <div className="m-cap">
                  <span className="m-num">{item.num}</span>
                  <div className="m-name">{item.name}</div>
                  <p className="m-desc">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
