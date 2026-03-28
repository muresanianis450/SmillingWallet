
import { PageName } from '@/types/types.ts';
// @ts-ignore
import styles from './Nav.module.css';
interface NavProps {
    page: PageName;
    setPage: (page: PageName) => void;
}

// Client-facing nav links
const CLIENT_LINKS: { label: string; page: PageName }[] = [
    { label: 'Home',         page: 'home' },
    { label: 'Send Request', page: 'send-request' },
    { label: 'My Offers',    page: 'my-offers' },
    { label: 'Appointments', page: 'appointments' },
    { label: 'About',        page: 'about' },
];

// Clinic-facing nav links
const CLINIC_LINKS: { label: string; page: PageName }[] = [
    { label: 'Review Requests', page: 'requests' },
    { label: 'Clinic Dashboard', page: 'dashboard' },
];

const CLIENT_PAGES: PageName[] = ['home', 'send-request', 'my-offers', 'appointments', 'about'];
const CLINIC_PAGES: PageName[] = ['requests', 'dashboard'];

export function Nav({ page, setPage }: NavProps) {
    const isClinicPage = CLINIC_PAGES.includes(page);
    const links = isClinicPage ? CLINIC_LINKS : CLIENT_LINKS;

    return (
        <nav className={styles.nav}>
      <span
          className={styles.logo}
          onClick={() => setPage(isClinicPage ? 'requests' : 'home')}
      >
        <span className={styles.logoIcon}>🦷</span>
        Smiling Wallet
      </span>

            <div className={styles.links}>
                {links.map((link) => (
                    <button
                        key={link.page}
                        className={`${styles.link} ${page === link.page ? styles.active : ''}`}
                        onClick={() => setPage(link.page)}
                    >
                        {link.label}
                    </button>
                ))}
            </div>

            <div className={styles.avatar} />
        </nav>
    );
}