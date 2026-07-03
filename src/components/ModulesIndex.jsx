import { motion } from 'motion/react'
import { modules } from '../content/site'
import { useInViewOnce } from '../lib/useInViewOnce'

const EASE = [0.16, 1, 0.3, 1]

export default function ModulesIndex() {
  const [headRef, headIn] = useInViewOnce('-8% 0px')
  const [listRef, listIn] = useInViewOnce('-6% 0px')

  return (
    <section className="modules">
      <div className="container">
        <motion.div
          className="modules-head"
          ref={headRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headIn ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div>
            <span className="label">{modules.label}</span>
            <h2 className="h-lg modules-headline">{modules.headline}</h2>
            <p className="modules-sub">{modules.sub}</p>
          </div>
          <p className="modules-intro">{modules.intro}</p>
        </motion.div>

        <div className="modules-list" ref={listRef}>
          {modules.items.map((m, i) => (
            <motion.a
              className="module-row"
              href={m.href}
              key={m.num}
              initial={{ opacity: 0, y: 24 }}
              animate={listIn ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.6, ease: EASE, delay: i * 0.07 }}
            >
              <span className="module-num">{m.num}</span>
              <span className="module-name">{m.name}</span>
              <span className="module-desc">{m.desc}</span>
              <span className="module-arrow" aria-hidden="true">
                &#8594;
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
