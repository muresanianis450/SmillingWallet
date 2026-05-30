import { PageName } from '../../../types/types.ts';
import { Button } from '../../shared/Button';
// @ts-ignore
import styles from './AboutPage.module.css';
import { SendRequestIcon, SmilingWallet_LogoIcon, GraphIcon, HandshakeIcon } from '../../shared/Icons';

interface AboutPageProps {
  setPage: (page: PageName) => void;
}

const HOW_STEPS = [
  {
    icon: <SendRequestIcon />,
    title: '1. Request',
    badge: '$1',
    description:
      'Submit your clinical needs and X-rays anonymously to all top-tier clinics in your local area.',
  },
  {
    icon: <GraphIcon />,
    title: '2. Compare',
    badge: 'Free',
    description:
      'Receive multiple anonymous price quotes. Rank them using our exclusive clinic performance metrics and database ratings.',
  },
  {
    icon: <HandshakeIcon />,
    title: '3. Match',
    badge: '1%',
    description:
      'Accept the best offer and pay a 1% matchmaking fee to unlock contact details and schedule your treatment.',
  },
];

const STATS = [
  { value: '500+', label: 'Verified Clinics' },
  { value: '10k+', label: 'Happy Patients' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '1%', label: 'Success Fee' },
];

export function AboutPage({ setPage }: AboutPageProps) {
  return (
    <div className={styles.wrap}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>Dental Marketplace</span>
          <h1 className={styles.heroTitle}>
            The smarter way to{' '}
            <span className={styles.heroAccent}>find dental care</span>
          </h1>
          <p className={styles.heroSub}>
            A premium marketplace connecting you with pre-verified dental clinics.
            We ensure elite care through anonymous competition and data-driven ratings.
          </p>
          <div className={styles.heroCtas}>
            <Button variant="cta" onClick={() => setPage('send-request')}>
              Send Request
            </Button>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <SmilingWallet_LogoIcon />
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className={styles.statsStrip}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statItem}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <section className={styles.howSection}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <p className={styles.sectionSub}>Three simple steps to better dental care</p>
        <div className={styles.stepsGrid}>
          {HOW_STEPS.map((step) => (
            <div key={step.title} className={styles.stepCard}>
              <div className={styles.stepIconWrap}>{step.icon}</div>
              <span className={styles.stepBadge}>{step.badge}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <div className={styles.ctaBanner}>
        <h2>The choice is yours!</h2>
        <p>Join thousands of patients who found better dental care.</p>
        <Button variant="cta" onClick={() => setPage('send-request')}>
          Send Request
        </Button>
      </div>
    </div>
  );
}
