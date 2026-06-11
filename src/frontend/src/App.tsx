import {useEffect, useRef, useState} from 'react';
import { PageName, AuthUser } from './types/types';
import { Nav } from './components/layout/Nav';
import { AboutPage } from './components/pages/About/AboutPage';
import { ReviewRequestsPage } from './components/pages/ReviewRequests/ReviewRequestsPage';
import { DashboardPage } from './components/pages/Dashboard/DashboardPage';
import { HomePage } from './components/pages/Home/HomePage';
import { SendRequestPage } from './components/pages/SendRequest/SendRequestPage';
import { MyOffersPage } from './components/pages/MyOffers/MyOffersPage';
import { AppointmentsPage } from './components/pages/Appointments/AppointmentsPage';
import { LoginPage } from './components/pages/Login/LoginPage';
import { RegisterPage } from './components/pages/Register/RegisterPage';
import { ProfilePage } from './components/pages/Profile/ProfilePage';
import { ProfileBanner } from './components/shared/ProfileBanner';
import {ForgotPasswordPage} from './components/pages/ForgotPassword/ForgotPasswordPage';
import { ResetPasswordPage } from './components/pages/ResetPassword/ResetPasswordPage';
import { ActivateAccountPage } from './components/pages/Activate/ActivateAccountPage';
import { AdminDentistsPage } from './components/pages/AdminDentists/AdminDentistsPage';
import { getCookie, setCookie, deleteCookie } from './tracking/cookies';
import { AUTH_COOKIE } from './services/api';

export function App() {
    const [page, setPage]               = useState<PageName>('home');
    const [user, setUser]               = useState<AuthUser | null>(null);
    const [profileFocusField, setProfileFocusField] = useState<string | null>(null);

    // Restore session on mount
    useEffect(() => {
        // Clean up any legacy localStorage auth data (migrated to cookies)
        localStorage.removeItem('user');

        const raw = getCookie(AUTH_COOKIE);
        if (raw) {
            try {
                setUser(JSON.parse(raw));
            } catch {
                // Cookie is corrupt — delete it so the user can log in cleanly
                deleteCookie(AUTH_COOKIE);
            }
        }

        // Check if arriving from an email link (invite or password reset)
        const params   = new URLSearchParams(window.location.search);
        const pathname = window.location.pathname;
        if (pathname === '/activate' && params.get('token')) {
            setPage('activate');
        } else if (params.get('token')) {
            setPage('reset-password');
        }
    }, []);

    function handleLogin(authUser: AuthUser) {
        setCookie(AUTH_COOKIE, JSON.stringify(authUser), 1);
        setUser(authUser);
        if (authUser.role === 'DENTIST') setPage('dashboard');
        else if (authUser.role === 'ADMIN') setPage('dashboard');
        else setPage('home');
    }

    // Inactivity TIMER — logs out after 15 minutes of no activity
    const inactivityTimer = useRef<ReturnType<typeof setTimeout>>();
    const INACTIVITY_MS = 15 * 60 * 1000;

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
            handleLogout();
            alert('You have been logged out due to inactivity.');
        }, INACTIVITY_MS);
    }

    useEffect(() => {
        if (!user) return;
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(e => window.addEventListener(e, resetInactivityTimer));
        resetInactivityTimer();
        return () => {
            events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
            clearTimeout(inactivityTimer.current);
        };
    }, [user]);

    function handleLogout() {
        deleteCookie(AUTH_COOKIE);
        setUser(null);
        setPage('home');
    }

    function handleProfileUpdate(
        pct: number,
        missingFields: string[],
        profilePicture?: string | null,
        twoFactorEnabled?: boolean,
        emailRemindersEnabled?: boolean,
    ) {
        if (!user) return;
        const updated = {
            ...user,
            profileCompletionPct: pct,
            missingFields,
            profilePicture: profilePicture ?? user.profilePicture,
            twoFactorEnabled:    twoFactorEnabled    ?? user.twoFactorEnabled,
            emailRemindersEnabled: emailRemindersEnabled ?? user.emailRemindersEnabled,
        };
        setCookie(AUTH_COOKIE, JSON.stringify(updated), 1);
        setUser(updated);
    }

    const role = user?.role ?? null;

    const canSee = {
        home:              true,
        login:             !user,
        register:          !user,
        profile:           !!user,
        'send-request':    role === 'PATIENT' || role === 'ADMIN',
        'my-offers':       role === 'PATIENT' || role === 'ADMIN',
        'forgot-password': !user,
        appointments:      role === 'PATIENT' || role === 'ADMIN',
        about:             true,
        requests:          role === 'DENTIST'  || role === 'ADMIN',
        dashboard:         role === 'DENTIST'  || role === 'ADMIN',
        'reset-password':  true,
        'activate':        true,
        'admin-dentists':  role === 'ADMIN',
    } satisfies Record<PageName, boolean>;

    // Guard: if current page is not allowed, bounce to home
    useEffect(() => {
        if (!canSee[page]) setPage('home');
    }, [user, page]);

    return (
        <>
            <Nav page={page} setPage={setPage} user={user} />

            {user && (user.profileCompletionPct ?? 100) < 100 && (
                <ProfileBanner
                    pct={user.profileCompletionPct ?? 0}
                    missingFields={user.missingFields ?? []}
                    setPage={setPage}
                    onFocusField={setProfileFocusField}
                />
            )}

            {/* ── Public ── */}
            {page === 'home'     && <HomePage    setPage={setPage} />}
            {page === 'login'    && <LoginPage   setPage={setPage} onLogin={handleLogin} />}
            {page === 'register' && <RegisterPage setPage={setPage} onLogin={handleLogin} />}
            {page === 'forgot-password' && <ForgotPasswordPage setPage={setPage} />}
            {page === 'reset-password' && <ResetPasswordPage setPage={setPage} />}
            {page === 'activate'       && <ActivateAccountPage setPage={setPage} />}

            {/* ── Patient ── */}
            {canSee['send-request'] && page === 'send-request' && <SendRequestPage  setPage={setPage} />}
            {canSee['my-offers']    && page === 'my-offers'    && <MyOffersPage     setPage={setPage} />}
            {canSee['appointments'] && page === 'appointments' && <AppointmentsPage setPage={setPage} />}

            {/* ── Clinic ── */}
            {canSee['about']     && page === 'about'     && <AboutPage          setPage={setPage} />}
            {canSee['requests']  && page === 'requests'  && <ReviewRequestsPage setPage={setPage} user={user} />}
            {canSee['dashboard'] && page === 'dashboard' && <DashboardPage />}

            {/* ── Admin ── */}
            {canSee['admin-dentists'] && page === 'admin-dentists' && <AdminDentistsPage />}

            {/* ── Profile ── */}
            {canSee['profile'] && page === 'profile' && user && (
                <ProfilePage
                    user={user}
                    setPage={setPage}
                    focusField={profileFocusField}
                    onProfileUpdate={handleProfileUpdate}
                    onLogout={handleLogout}
                />
            )}
        </>
    );
}
