
import { PageName } from '@/types/types.ts';
// @ts-ignore
import styles from './Nav.module.css';
import { SmilingWallet_LogoIcon} from '../shared/Icons';


interface NavProps {
    page: PageName;
    setPage: (page: PageName) => void;
}
const ALL_LINKS = [
    { label: 'Home',         page: 'home' },
    { label: 'Send Request', page: 'send-request' },
    { label: 'My Offers',    page: 'my-offers' },
    { label: 'Analytics',    page: 'dashboard' },
    { label: 'Clinic View',  page: 'requests' },
    { label: 'About',        page: 'about' },
];

export function Nav({ page, setPage }: NavProps) {
    return (
        <nav className={styles.nav}>
            {/* LEFT: Logo */}
            <div className={styles.logoContainer}>
                <span className={styles.logo} onClick={() => setPage('home')}>
                    <span className={styles.logoIcon}><SmilingWallet_LogoIcon/></span>
                </span>
            </div>

            {/* MIDDLE: Centered Links */}
            <div className={styles.links}>
                {ALL_LINKS.map((link) => (
                    <button
                        key={link.page}
                        className={`${styles.link} ${page === link.page ? styles.active : ''}`}
                        onClick={() => setPage(link.page as PageName)}
                    >
                        {link.label}
                    </button>
                ))}
            </div>

            {/* RIGHT: Auth & Profile */}
            <div className={styles.authSection}>
                <button
                    className={styles.loginBtn}
                    onClick={() => setPage('login')}
                >
                    Login
                </button>
                <button
                    className={styles.registerBtn}
                    onClick={() => setPage('register')}
                >
                    Register
                </button>
                <div className={styles.avatar} />
            </div>
        </nav>
    );
}


//TODO ADD LATER LOGICS, for now not needed
/*

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
}*/
