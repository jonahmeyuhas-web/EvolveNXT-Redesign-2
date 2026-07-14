import { credibility, clientLogos } from '../content/site'

// Credibility strip: positioning line, factual chips, and the drifting
// placeholder client wordmarks (mask-faded edges). Triggered .ri reveal.
function LogoSet({ hidden }) {
  return (
    <span className="lg-set" aria-hidden={hidden ? 'true' : undefined}>
      {clientLogos.map((l) => (
        <span className={`lgm ${l.cls}`} key={l.label}>
          {l.label}
        </span>
      ))}
    </span>
  )
}

export default function Credibility() {
  return (
    <section className="cred rv">
      <div className="container">
        <p className="cred-line ri" style={{ '--d': '0s' }}>
          {credibility.line}
        </p>
        <div className="cred-facts ri" style={{ '--d': '0.14s' }}>
          {credibility.facts.map((fact, i) => (
            <span key={fact} style={{ display: 'contents' }}>
              {i > 0 && <span className="mid">&middot;</span>}
              <span>{fact}</span>
            </span>
          ))}
        </div>
        <div className="logos ri" style={{ '--d': '0.26s' }} aria-label="Client wordmarks, placeholders">
          <div className="logos-track">
            <LogoSet />
            <LogoSet hidden />
          </div>
        </div>
      </div>
    </section>
  )
}
