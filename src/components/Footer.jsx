import { footer } from '../content/site'
import logo from '../assets/evolvenxt-logo-dark.png'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img className="footer-logo" src={logo} alt="EvolveNXT" />
            <p className="footer-about">{footer.about}</p>
          </div>
          {footer.columns.map((col) => (
            <div className="footer-col" key={col.title}>
              <span className="footer-col-title">{col.title}</span>
              {col.links.map((l) => (
                <a key={l.label} href={l.href}>
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-legal">
          <span>{footer.legal.copyright}</span>
          <a href={footer.legal.privacy.href}>{footer.legal.privacy.label}</a>
        </div>
      </div>
    </footer>
  )
}
