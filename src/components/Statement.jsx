import { motion } from 'motion/react'
import { statement } from '../content/site'
import { useInViewOnce } from '../lib/useInViewOnce'

const EASE = [0.16, 1, 0.3, 1]

export default function Statement() {
  const [ref, inView] = useInViewOnce('-12% 0px')

  return (
    <section className="statement">
      <div className="container statement-inner" ref={ref}>
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
