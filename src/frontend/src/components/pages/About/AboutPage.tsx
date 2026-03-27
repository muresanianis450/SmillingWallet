import { PageName } from '../../../types';
import { Button } from '../../shared/Button';
// @ts-ignore
import styles from './AboutPage.module.css';
import { TeethIcon, DentistIcon } from '../../shared/Icons';
interface AboutPageProps {
  setPage: (page: PageName) => void;
}

const HOW_STEPS = [
  {
    icon: <TeethIcon />,
    title: '1. Request (1$)',
    description:
        'Submit your clinical needs and X-rays anonymously to all top-tier clinics in your local area.',
    reverse: false,
  },
  {
    icon: <DentistIcon />,
    title: '2. Compare',
    description:
        'Receive multiple anonymous price quotes. Rank them using our exclusive clinic performance metrics and database ratings.',
    reverse: true,
  },
  {
    icon: '🤝',
    title: '3. Match (1%)',
    description:
        'Accept the best offer and pay a 1% matchmaking fee to unlock contact details and schedule your treatment.',
    reverse: false,
  },
];

export function AboutPage({ setPage }: AboutPageProps) {
  return (
      <div className={styles.wrap}>
        {/* ── Hero ── */}
        <div className={styles.hero}>
          <div className={styles.heroText}>
            <h1>About us</h1>
            <p>
              A premium marketplace connecting you with pre-verified, "best of the
              best" dental clinics. We ensure elite care through anonymous
              competition and data-driven ratings.
            </p>
          </div>
          <div className={styles.heroImg}>🧑‍⚕️</div>
        </div>

        {/* ── How it works ── */}
        <h2 className={styles.howTitle}>How it works?</h2>

        <div className={styles.steps}>
          {HOW_STEPS.map((step) => (
              <div
                  key={step.title}
                  className={`${styles.step} ${step.reverse ? styles.reverse : ''}`}
              >
                <div className={styles.stepImg}>{step.icon}</div>
                <div className={styles.stepText}>
                  <h2>{step.title}</h2>
                  <p>{step.description}</p>
                </div>
              </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div className={styles.cta}>
          <h2>The choice is yours!</h2>
          <Button
              data-testid="send-request-btn"
              variant="cta"
              onClick={() => setPage('requests')}
          >
            Send Request
          </Button>
        </div>
      </div>
  );
}