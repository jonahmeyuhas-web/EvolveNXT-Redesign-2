import { lob } from '../content/site'

// Lines of business: a composed, triggered entrance (mist tone sweep, masked
// headline reveal, rows cascade with hairline draws) wired in useHomepageMotion.
export default function LinesOfBusiness() {
  return (
    <section className="lob">
      <div className="lob-bg" aria-hidden="true"></div>
      <div className="container">
        <div className="rv">
          <span className="sec-label ri" style={{ '--d': '0s' }}>
            {lob.label}
          </span>
          <h2 className="lob-headline maskhead">
            <span className="mask">
              <span className="mline-s">{lob.headline}</span>
            </span>
          </h2>
        </div>
        <div className="lob-rows">
          {lob.items.map((item) => (
            <div className="lob-row rv ri" key={item.name}>
              <div className="lob-name">
                {item.name}
                <span className="lob-arrow">&#8594;</span>
              </div>
              <p className="lob-body">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
