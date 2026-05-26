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
import { useOffers } from './hooks/useOffers';
import { INITIAL_OFFERS } from './data/constants';
import { offerService } from './services/OfferService';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import {ForgotPasswordPage} from './components/pages/ForgotPassword/ForgotPasswordPage';
import { ResetPasswordPage } from './components/pages/ResetPassword/ResetPasswordPage';

export function App() {
    const [page, setPage]               = useState<PageName>('home');
    const [user, setUser]               = useState<AuthUser | null>(null);
    const [profileFocusField, setProfileFocusField] = useState<string | null>(null);
    const offerHook                     = useOffers(INITIAL_OFFERS);
    const isOnline                      = useNetworkStatus();

    useEffect(() => {
        if (isOnline) offerService.syncOfflineData();
    }, [isOnline]);

    // Restore session on mount
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));

        // Check if arriving from a reset-password email link
        const params = new URLSearchParams(window.location.search);
        if (params.get('token')) {
            setPage('reset-password');
        }
    }, []);

    function handleLogin(authUser: AuthUser) {
        localStorage.setItem('user', JSON.stringify(authUser));
        setUser(authUser);
        if (authUser.role === 'DENTIST') setPage('dashboard');
        else if (authUser.role === 'ADMIN') setPage('dashboard');
        else setPage('home');
    }

    // Inactivity TIMER
    const inactivityTimer = useRef<ReturnType<typeof setTimeout>>();
    const INACTIVITY_MS = 30 * 60 * 1000;

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
        localStorage.removeItem('user');
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
        localStorage.setItem('user', JSON.stringify(updated));
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
        about:             role === 'PATIENT' || role === 'ADMIN',
        requests:          role === 'DENTIST'  || role === 'ADMIN',
        dashboard:         role === 'DENTIST'  || role === 'ADMIN',
        'reset-password':  true,
    } satisfies Record<PageName, boolean>;

    // Guard: if current page is not allowed, bounce to home
    useEffect(() => {
        if (!canSee[page]) setPage('home');
    }, [user, page]);

    return (
        <>
            {!isOnline && (
                <div style={{
                    background: '#E8593C', color: '#fff',
                    textAlign: 'center', padding: '8px',
                    fontSize: '14px', fontWeight: 'bold'
                }}>
                    You are currently offline. Changes will be synced once you reconnect.
                </div>
            )}

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

            {/* ── Patient ── */}
            {canSee['send-request'] && page === 'send-request' && <SendRequestPage  setPage={setPage} />}
            {canSee['my-offers']    && page === 'my-offers'    && <MyOffersPage     setPage={setPage} />}
            {canSee['appointments'] && page === 'appointments' && <AppointmentsPage setPage={setPage} />}

            {/* ── Clinic ── */}
            {canSee['about']     && page === 'about'     && <AboutPage          setPage={setPage} />}
            {canSee['requests']  && page === 'requests'  && <ReviewRequestsPage offersHook={offerHook} setPage={setPage} user={user} />}
            {canSee['dashboard'] && page === 'dashboard' && <DashboardPage      offersHook={offerHook} />}

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
