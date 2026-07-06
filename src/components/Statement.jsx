import { motion } from 'motion/react'
import { statement } from '../content/site'
import { useInViewOnce } from '../lib/useInViewOnce'

const EASE = [0.16, 1, 0.3, 1]

// When `dock` is true the crystal hero is active and this section is its dock
// target: it overlaps the final viewport of the crystal track and holds a
// centered mark-anchor slot the descending crystal seats into (see the
// .statement-dock rules in sections.css). The copy and its reveal are
// unchanged; the only additions are the overlap layout and the anchor slot.
export default function Statement({ dock = false }) {
  const [ref, inView] = useInViewOnce('-12% 0px')

  return (
    <section className={`statement${dock ? ' statement-dock' : ''}`}>
      <div className="container statement-inner" ref={ref}>
        {dock && <div className="mark-anchor" aria-hidden="true" />}
        <h2 className="h-xl statement-lines">
          {statement.lines.map((line, i) => (
            <span className="mask" key={line}>
              <motion.span
                className="mask-line"
                initial={{ y: 96 }}
                animate={inView ? { y: 0 } : { y: 96 }}
                transition={{ duration: 0.85, ease: EASE, delay: i * 0.12 }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h2>
        <motion.p
          className="statement-body"
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={{ duration: 0.75, ease: EASE, delay: 0.3 }}
        >
          {statement.body}
        </motion.p>
      </div>
    </section>
  )
}
