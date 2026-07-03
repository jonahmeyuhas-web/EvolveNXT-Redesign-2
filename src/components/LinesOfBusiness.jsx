import { motion } from 'motion/react'
import { lob } from '../content/site'
import { useInViewOnce } from '../lib/useInViewOnce'

const EASE = [0.16, 1, 0.3, 1]

function LobItem({ item }) {
  const [ref, inView] = useInViewOnce('-10% 0px')
  return (
    <motion.div
      className="lob-item"
      ref={ref}
      initial={{ opacity: 0, y: 26 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }}
      transition={{ duration: 0.65, ease: EASE, delay: 0.05 }}
    >
      <h3 className="lob-name">{item.name}</h3>
      <p className="lob-body">{item.body}</p>
      <a className="text-link" href={item.href}>
        Learn more
      </a>
    </motion.div>
  )
}

export default function LinesOfBusiness() {
  const [leftRef, leftIn] = useInViewOnce('-10% 0px')

  return (
    <section className="lob">
      <div className="container lob-inner">
        <motion.div
          className="lob-left"
          ref={leftRef}
          initial={{ opacity: 0, y: 24 }}
          animate={leftIn ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span className="label">{lob.label}</span>
          <h2 className="h-lg lob-headline">{lob.headline}</h2>
        </motion.div>
        <div className="lob-right">
          {lob.items.map((item) => (
            <LobItem key={item.name} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
