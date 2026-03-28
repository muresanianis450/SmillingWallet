import { PageName } from '../../../types/types.ts';
import { Button } from '../../shared/Button';
// @ts-ignore
import styles from './HomePage.module.css';
import {
    GeneralDentistryIcon,
    DentalImplantIcon,
    OrthodonticsIcon,
    CosmeticDentistryIcon,
    PediatricDentistryIcon, EmergencyCareIcon
} from '../../shared/Icons';


interface HomePageProps {
    setPage: (page: PageName) => void;
}

const SERVICES = [
    {
        icon: <GeneralDentistryIcon/>,
        title: 'General Dentistry',
        description: 'Routine checkups, cleanings, and fillings to keep your smile healthy every day.',
    },
    {
        icon: <DentalImplantIcon/>,
        title: 'Dental Implant',
        description: 'Permanent, natural-looking replacements for missing teeth that last a lifetime.',
    },
    {
        icon: <OrthodonticsIcon/>,
        title: 'Orthodontics',
        description: 'Braces and aligners tailored to straighten your teeth and perfect your bite.',
    },
    {
        icon: <CosmeticDentistryIcon/>,
        title: 'Cosmetic Dentistry',
        description: 'Whitening, veneers, and bonding to give you the radiant smile you deserve.',
    },
    {
        icon: <PediatricDentistryIcon/>,
        title: 'Pediatric Dentistry',
        description: 'Gentle, child-friendly care that builds great dental habits from the start.',
    },
    {
        icon: <EmergencyCareIcon/>,
        title: 'Emergency Care',
        description: 'Same-day appointments for urgent dental pain, broken teeth, and trauma.',
    },
];

export function HomePage({ setPage }: HomePageProps) {
    return (
        <div className={styles.wrap}>
            {/* ── Hero ── */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroBadge}>🦷 The Smart Way to Find Dental Care</div>
                    <h1 className={styles.heroTitle}>
                        One Request,<br />
                        <span className={styles.heroAccent}>Multiple Offers,</span><br />
                        One Perfect Smile.
                    </h1>
                    <p className={styles.heroSub}>
                        Submit your dental needs once. Receive anonymous, competitive quotes from
                        verified clinics near you. Compare, choose, and save — all in one place.
                    </p>
                    <div className={styles.heroCtas}>
                        <Button variant="cta" onClick={() => setPage('send-request')}>
                            Send Request
                        </Button>
                        <Button variant="ghost" onClick={() => setPage('about')}>
                            How it works →
                        </Button>
                    </div>
                </div>
                <div className={styles.heroVisual}>
                    <div className={styles.heroCard}>
                        <div className={styles.heroCardTop}>
                            <span className={styles.heroCardBadge}>🏆 Best Value</span>
                            <span className={styles.heroCardScore}>94% match</span>
                        </div>
                        <div className={styles.heroCardDoctor}>Dr. #1</div>
                        <div className={styles.heroCardPrice}>€410</div>
                        <div className={styles.heroCardStars}>★★★★★ <span>4.8</span></div>
                        <div className={styles.heroCardLock}>🔒 Identity hidden until you accept</div>
                    </div>
                    <div className={styles.heroCardSmall}>
                        <div className={styles.heroCardDoctor}>Dr. #2</div>
                        <div className={styles.heroCardPrice}>€475</div>
                        <div className={styles.heroCardStars}>★★★★☆ <span>4.5</span></div>
                    </div>
                    <div className={styles.heroCardSmallAlt}>
                        <div className={styles.heroCardDoctor}>Dr. #3</div>
                        <div className={styles.heroCardPrice}>€390</div>
                        <div className={styles.heroCardStars}>★★★★☆ <span>4.2</span></div>
                    </div>
                </div>
            </section>

            {/* ── How It Works Strip ── */}
            <section className={styles.howStrip}>
                <div className={styles.howStep}>
                    <div className={styles.howNum}>01</div>
                    <div className={styles.howText}>
                        <strong>Submit ($1)</strong>
                        <span>Send your request anonymously</span>
                    </div>
                </div>
                <div className={styles.howDivider}>→</div>
                <div className={styles.howStep}>
                    <div className={styles.howNum}>02</div>
                    <div className={styles.howText}>
                        <strong>Compare</strong>
                        <span>Review anonymous clinic quotes</span>
                    </div>
                </div>
                <div className={styles.howDivider}>→</div>
                <div className={styles.howStep}>
                    <div className={styles.howNum}>03</div>
                    <div className={styles.howText}>
                        <strong>Match (1%)</strong>
                        <span>Pay to unlock &amp; book your clinic</span>
                    </div>
                </div>
            </section>

            {/* ── Services ── */}
            <section className={styles.services}>
                <h2 className={styles.sectionTitle}>Our Services</h2>
                <p className={styles.sectionSub}>
                    From routine care to complex procedures — we connect you with the right specialist.
                </p>
                <div className={styles.servicesGrid}>
                    {SERVICES.map((s) => (
                        <div key={s.title} className={styles.serviceCard}>
                            <div className={styles.serviceIcon}>{s.icon}</div>
                            <h3 className={styles.serviceTitle}>{s.title}</h3>
                            <p className={styles.serviceDesc}>{s.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className={styles.ctaBanner}>
                <h2>Ready to find your perfect smile?</h2>
                <p>Join thousands of patients who saved an average of €150 on dental care.</p>
                <Button variant="cta" onClick={() => setPage('send-request')}>
                    Send Your Request Now
                </Button>
            </section>
        </div>
    );
}