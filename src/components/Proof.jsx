import { proof } from '../content/site'

// Proof strip: three numbered positioning claims. Triggered .ri reveal.
export default function Proof() {
  return (
    <section className="proof">
      <div className="container">
        <div className="proof-grid rv">
          {proof.map((item, i) => (
            <div className="proof-item ri" style={{ '--d': `${i * 0.1}s` }} key={item.num}>
              <span className="proof-num">{item.num}</span>
              <div className="proof-claim">{item.claim}</div>
              <p className="proof-support">{item.support}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
