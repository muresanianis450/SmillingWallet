import { useState, useEffect } from 'react';
import { PageName } from '@/types/types.ts';
// @ts-ignore
import styles from './Nav.module.css';
import { SmilingWallet_LogoIcon } from '../shared/Icons';

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
    const [menuOpen, setMenuOpen] = useState(false);

    // Close drawer on page change
    useEffect(() => {
        setMenuOpen(false);
    }, [page]);

    // Lock body scroll when drawer is open
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
                    {ALL_LINKS.map((link) => (
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
                    <button
                        className={styles.loginBtn}
                        onClick={() => navigate('login')}
                        type="button"
                    >
                        Login
                    </button>
                    <button
                        className={styles.registerBtn}
                        onClick={() => navigate('register')}
                        type="button"
                    >
                        Register
                    </button>
                    <div className={styles.avatar} />
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
                {/* Tap overlay to close */}
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

                    {/* Nav links */}
                    {ALL_LINKS.map((link) => (
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

                    {/* Auth buttons */}
                    <div className={styles.drawerAuth}>
                        <button
                            className={styles.drawerLoginBtn}
                            onClick={() => navigate('login')}
                            type="button"
                        >
                            Login
                        </button>
                        <button
                            className={styles.drawerRegisterBtn}
                            onClick={() => navigate('register')}
                            type="button"
                        >
                            Register
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}