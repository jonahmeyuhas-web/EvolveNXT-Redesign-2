import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { lifecycle } from '../content/site'
import { useUnpinned } from '../lib/useUnpinned'
import { useInViewOnce } from '../lib/useInViewOnce'

const EASE = [0.16, 1, 0.3, 1]
const BG_STOPS = ['#fbfaf8', '#f7f5f0', '#f0ede7', '#edf0f4', '#f4f2ec']

export default function Lifecycle() {
  const { unpinned } = useUnpinned()
  if (unpinned) return <LifecycleStacked />
  return <LifecyclePinned />
}

function LifecyclePinned() {
  const ref = useRef(null)
  const stages = lifecycle.stages
  const n = stages.length

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  const p = useSpring(scrollYProgress, { stiffness: 130, damping: 32, restDelta: 0.001 })

  const bg = useTransform(p, [0, 0.25, 0.5, 0.75, 1], BG_STOPS)
  const progress = useTransform(p, [0.02, 0.98], [0, 1], { clamp: true })

  return (
    <section ref={ref} className="lifecycle" style={{ height: `${n * 105 + 30}vh` }}>
      <motion.div className="lifecycle-sticky" style={{ backgroundColor: bg }}>
        <div className="lifecycle-head">
          <span className="label">{lifecycle.label}</span>
          <p className="lifecycle-intro">{lifecycle.intro}</p>
        </div>

        <div className="lifecycle-stage-area">
          {stages.map((s, i) => (
            <Stage key={s.num} stage={s} i={i} n={n} p={p} />
          ))}
        </div>

        <div className="lifecycle-foot">
          <div className="lifecycle-rule">
            <motion.div className="lifecycle-rule-fill" style={{ scaleX: progress }} />
          </div>
          <div className="lifecycle-names">
            {stages.map((s, i) => (
              <StageName key={s.num} stage={s} i={i} n={n} p={p} />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function Stage({ stage, i, n, p }) {
  const start = i / n
  const end = (i + 1) / n
  const fade = 0.28 / n

  const first = i === 0
  const last = i === n - 1

  const opacity = useTransform(
    p,
    first
      ? [0, end - fade, end]
      : last
        ? [start, start + fade, 1]
        : [start, start + fade, end - fade, end],
    first ? [1, 1, 0] : last ? [0, 1, 1] : [0, 1, 1, 0],
  )
  const y = useTransform(p, [start, end], first ? [0, -36] : [42, -36])

  return (
    <motion.div className="stage" style={{ opacity, y }}>
      <div className="stage-copy">
        <span className="stage-count">
          {stage.num} <span className="stage-count-total">/ 0{n}</span>
        </span>
        <h3 className="stage-title">{stage.title}</h3>
        <p className="stage-body">{stage.body}</p>
        <p className="stage-keywords">{stage.keywords}</p>
      </div>
      <div className="stage-ghost" aria-hidden="true">
        {stage.num}
      </div>
    </motion.div>
  )
}

function StageName({ stage, i, n, p }) {
  const start = i / n
  const end = (i + 1) / n
  const opacity = useTransform(
    p,
    [Math.max(0, start - 0.02), start + 0.02, end - 0.02, Math.min(1, end + 0.02)],
    i === 0 ? [1, 1, 1, 0.38] : i === n - 1 ? [0.38, 1, 1, 1] : [0.38, 1, 1, 0.38],
  )
  return (
    <motion.span className="lifecycle-name" style={{ opacity }}>
      {stage.title}
    </motion.span>
  )
}

function StackedStage({ stage }) {
  const [ref, inView] = useInViewOnce('-8% 0px')
  return (
    <motion.div
      className="stage-stacked"
      ref={ref}
      initial={{ opacity: 0, y: 26 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <span className="stage-count">{stage.num}</span>
      <div>
        <h3 className="stage-title">{stage.title}</h3>
        <p className="stage-body">{stage.body}</p>
        <p className="stage-keywords">{stage.keywords}</p>
      </div>
    </motion.div>
  )
}

function LifecycleStacked() {
  return (
    <section className="lifecycle-stacked">
      <div className="container">
        <span className="label">{lifecycle.label}</span>
        <p className="lifecycle-intro">{lifecycle.intro}</p>
        <div className="lifecycle-stack-list">
          {lifecycle.stages.map((s) => (
            <StackedStage key={s.num} stage={s} />
          ))}
        </div>
      </div>
    </section>
  )
}
