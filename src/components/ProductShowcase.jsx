import { motion } from 'motion/react'
import { useInViewOnce } from '../lib/useInViewOnce'

const EASE = [0.16, 1, 0.3, 1]

// Reserved space for the product showcase. The product is being rebuilt, so
// this holds the composition and page rhythm until real screens exist.
export default function ProductShowcase() {
  const [ref, inView] = useInViewOnce('-8% 0px')

  return (
    <section className="showcase">
      <div className="container" ref={ref}>
        <div className="showcase-head">
          <div>
            <span className="label">A closer look</span>
            <h2 className="h-lg showcase-title">See the platform in action.</h2>
          </div>
          <p className="showcase-note">
            A guided look at the product lives here as the platform rolls out.
          </p>
        </div>

        <motion.div
          className="showcase-frame"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="showcase-placeholder">
            <span className="label">Product showcase</span>
            <p>Reserved for the product walkthrough.</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
