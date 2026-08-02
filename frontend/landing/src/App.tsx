import {
  ArrowRight,
  ArrowsLeftRight,
  BookOpenText,
  CheckCircle,
  CloudCheck,
  GithubLogo,
  Gauge,
  Lightning,
  ShieldCheck,
  UsersThree,
  Wallet,
} from '@phosphor-icons/react';

const appUrl = 'https://YOUR_FIREBASE_PROJECT_ID.web.app';
const repositoryUrl = 'https://github.com/mustafabahaa/kippa';

function BrandLogo() {
  return (
    <picture className="brand-logo">
      <source media="(prefers-color-scheme: dark)" srcSet={`${import.meta.env.BASE_URL}assets/kippa-logo-dark.png`} />
      <img src={`${import.meta.env.BASE_URL}assets/kippa-logo.png`} alt="Kippa" />
    </picture>
  );
}

export function App() {
  const docsUrl = `${import.meta.env.BASE_URL}docs/`;

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand-link" href={import.meta.env.BASE_URL} aria-label="Kippa home">
          <BrandLogo />
        </a>
        <nav aria-label="Primary navigation">
          <a href="#why-kippa">Why Kippa</a>
          <a href="#how-it-works">How it works</a>
          <a href={docsUrl}>Docs</a>
          <a className="nav-github" href={repositoryUrl} target="_blank" rel="noreferrer">
            <GithubLogo aria-hidden="true" /> GitHub
          </a>
        </nav>
        <a className="button button-small" href={appUrl}>Open app</a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy reveal">
            <p className="eyebrow">Household finance, together</p>
            <h1>Money clarity at home.</h1>
            <p className="hero-lede">Record spending fast, plan around payday, and know what is safe to spend today.</p>
            <div className="hero-actions">
              <a className="button" href={appUrl}>Open Kippa <ArrowRight aria-hidden="true" /></a>
              <a className="button button-secondary" href={docsUrl}><BookOpenText aria-hidden="true" /> Read docs</a>
            </div>
          </div>
          <figure className="hero-media reveal reveal-delay">
            <img src={`${import.meta.env.BASE_URL}assets/kippa-household-hero.webp`} alt="A couple reviewing their household finances together" fetchPriority="high" />
          </figure>
        </section>

        <section className="principle-strip" aria-label="Kippa principles">
          <span><ShieldCheck aria-hidden="true" /> Private by default</span>
          <span><CloudCheck aria-hidden="true" /> Synced across devices</span>
          <span><UsersThree aria-hidden="true" /> Built for households</span>
        </section>

        <section className="features-section" id="why-kippa">
          <div className="section-heading">
            <h2>Built around real household money.</h2>
            <p>Salary dates move. Currencies mix. Cash drifts. Kippa keeps the underlying ledger honest while the daily experience stays simple.</p>
          </div>
          <div className="feature-grid">
            <article className="feature feature-primary">
              <Gauge aria-hidden="true" />
              <h3>Know your pace</h3>
              <p>See whether spending is on track and what remains safe until the next salary cycle.</p>
              <div className="pulse-visual" aria-hidden="true"><span>On track</span><strong>Clear</strong></div>
            </article>
            <article className="feature feature-accent">
              <ArrowsLeftRight aria-hidden="true" />
              <h3>Multi-currency by design</h3>
              <p>Model USD and EGP movement as transfers, not misleading income.</p>
            </article>
            <article className="feature">
              <Wallet aria-hidden="true" />
              <h3>Ledger first</h3>
              <p>Balances and insights are derived from financial events, never patched by hand.</p>
            </article>
            <article className="feature feature-wide">
              <Lightning aria-hidden="true" />
              <div>
                <h3>Fast when life is moving</h3>
                <p>Capture an expense in seconds with account, category, and recent-choice shortcuts.</p>
              </div>
              <span className="feature-note">Installable PWA</span>
            </article>
            <article className="feature feature-dark">
              <UsersThree aria-hidden="true" />
              <h3>One household view</h3>
              <p>Partners stay aligned through real-time sync and activity notifications.</p>
            </article>
          </div>
        </section>

        <section className="product-section" id="how-it-works">
          <div className="product-frame reveal">
            <img src={`${import.meta.env.BASE_URL}assets/kippa-auth-screen.webp`} alt="The real Kippa mobile sign-in screen" loading="lazy" />
          </div>
          <div className="product-copy">
            <h2>A real product, not another spreadsheet.</h2>
            <p>Kippa is a responsive web app with secure Google sign-in, offline support, shared households, and Firebase-backed sync.</p>
            <ul>
              <li><CheckCircle aria-hidden="true" /> Log expenses from phone or desktop</li>
              <li><CheckCircle aria-hidden="true" /> Budget around your actual salary cycle</li>
              <li><CheckCircle aria-hidden="true" /> Reconcile balances without a bank connection</li>
            </ul>
            <a className="text-link" href={appUrl}>Use the live app <ArrowRight aria-hidden="true" /></a>
          </div>
        </section>

        <section className="docs-section">
          <div>
            <BookOpenText aria-hidden="true" />
            <h2>Understand every decision.</h2>
            <p>The documentation covers setup, data modeling, calculations, Firebase architecture, notifications, UX flows, and the design system.</p>
          </div>
          <div className="docs-actions">
            <a className="button" href={docsUrl}>Explore docs <ArrowRight aria-hidden="true" /></a>
            <a className="text-link" href={repositoryUrl} target="_blank" rel="noreferrer"><GithubLogo aria-hidden="true" /> Browse source</a>
          </div>
        </section>
      </main>

      <footer>
        <BrandLogo />
        <p>Clear household money decisions, from payday to payday.</p>
        <div>
          <a href={docsUrl}>Documentation</a>
          <a href={repositoryUrl}>GitHub</a>
          <a href={appUrl}>Open app</a>
        </div>
      </footer>
    </div>
  );
}
