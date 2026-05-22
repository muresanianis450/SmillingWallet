import { useState, useEffect } from 'react';
import { AuthUser, PageName } from '@/types/types.ts';
// @ts-ignore
import styles from './Nav.module.css';
import { SmilingWallet_LogoIcon } from '../shared/Icons';

interface NavProps {
    page: PageName;
    setPage: (page: PageName) => void;
    user: AuthUser | null;
    onLogout: () => void;
}

const PATIENT_LINKS = [
    { label: 'Home',         page: 'home' },
    { label: 'Send Request', page: 'send-request' },
    { label: 'My Offers',    page: 'my-offers' },
    { label: 'Appointments', page: 'appointments' },
    { label: 'About',        page: 'about' },
];

const CLINIC_LINKS = [
    { label: 'Dashboard',    page: 'dashboard' },
    { label: 'Requests',     page: 'requests' },
    { label: 'About',        page: 'about' },
];

// to this:
const ADMIN_LINKS = [
    { label: 'Home',         page: 'home' },
    { label: 'Send Request', page: 'send-request' },
    { label: 'My Offers',    page: 'my-offers' },
    { label: 'Appointments', page: 'appointments' },
    { label: 'Dashboard',    page: 'dashboard' },
    { label: 'Requests',     page: 'requests' },
    { label: 'About',        page: 'about' },
];

export function Nav({ page, setPage, user, onLogout }: NavProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    const links = user?.role === 'ADMIN'   ? ADMIN_LINKS
        : user?.role === 'DENTIST'  ? CLINIC_LINKS
            : user?.role === 'PATIENT' ? PATIENT_LINKS
                : [{ label: 'Home', page: 'home' }];

    useEffect(() => { setMenuOpen(false); }, [page]);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    function navigate(p: PageName) {
        setPage(p);
        setMenuOpen(false);
    }

    return (
        <>
            <nav className={styles.nav}>
                {/* LEFT: Logo */}
                <div className={styles.logoContainer}>
                    <span className={styles.logo} onClick={() => navigate('home')}>
                        <span className={styles.logoIcon}>
                            <SmilingWallet_LogoIcon />
                        </span>
                    </span>
                </div>

                {/* MIDDLE: Desktop links */}
                <div className={styles.links}>
                    {links.map((link) => (
                        <button
                            key={link.page}
                            className={`${styles.link} ${page === link.page ? styles.active : ''}`}
                            onClick={() => navigate(link.page as PageName)}
                            type="button"
                        >
                            {link.label}
                        </button>
                    ))}
                </div>

                {/* RIGHT: Auth buttons (desktop) */}
                <div className={styles.authSection}>
                    {user ? (
                        <>
                            <button
                                className={`${styles.username} ${page === 'profile' ? styles.usernameActive : ''}`}
                                onClick={() => navigate('profile')}
                                type="button"
                            >
                                {user.username}
                            </button>
                            <button
                                className={`${styles.avatarBtn} ${page === 'profile' ? styles.avatarBtnActive : ''}`}
                                onClick={() => navigate('profile')}
                                type="button"
                                title="My Profile"
                            >
                                <img
                                    src={user.profilePicture || '/avatars/avatar-default.svg'}
                                    alt={user.username}
                                    className={styles.avatar}
                                />
                            </button>
                        </>
                    ) : (
                        <>
                            <button className={styles.loginBtn}    onClick={() => navigate('login')}    type="button">Login</button>
                            <button className={styles.registerBtn} onClick={() => navigate('register')} type="button">Register</button>
                        </>
                    )}
                </div>

                {/* RIGHT: Hamburger (mobile/tablet) */}
                <button
                    className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
                    onClick={() => setMenuOpen(o => !o)}
                    type="button"
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                >
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                </button>
            </nav>

            {/* MOBILE DRAWER */}
            <div className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}>
                <div
                    className={styles.overlay}
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                />

                <div className={styles.drawerPanel} role="dialog" aria-label="Navigation menu">
                    <button
                        className={styles.drawerClose}
                        onClick={() => setMenuOpen(false)}
                        type="button"
                        aria-label="Close menu"
                    >
                        ✕
                    </button>

                    {links.map((link) => (
                        <button
                            key={link.page}
                            className={`${styles.drawerLink} ${page === link.page ? styles.drawerLinkActive : ''}`}
                            onClick={() => navigate(link.page as PageName)}
                            type="button"
                        >
                            {link.label}
                        </button>
                    ))}

                    <div className={styles.drawerDivider} />

                    <div className={styles.drawerAuth}>
                        {user ? (
                            <button className={styles.drawerLoginBtn} onClick={() => navigate('profile')} type="button">
                                My Profile
                            </button>
                        ) : (
                            <>
                                <button className={styles.drawerLoginBtn}    onClick={() => navigate('login')}    type="button">Login</button>
                                <button className={styles.drawerRegisterBtn} onClick={() => navigate('register')} type="button">Register</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}