import { statement } from '../content/site'

// Statement: the masked headline runs the triggered play-once reveal with a
// completion latch (wired in useHomepageMotion via .maskhead), so the title
// can never end hidden on fast scroll or jumps. The second line is accented.
export default function Statement() {
  return (
    <section className="statement rv">
      <div className="container">
        <h2 className="maskhead">
          {statement.lines.map((line, i) => (
            <span className="mask" key={line}>
              <span className="mline-s">
                {i === statement.lines.length - 1 ? <span className="acc-i">{line}</span> : line}
              </span>
            </span>
          ))}
        </h2>
        <p className="statement-body ri" style={{ '--d': '0.22s' }}>
          {statement.body}
        </p>
      </div>
    </section>
  )
}
