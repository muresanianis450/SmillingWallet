import { useEffect, useState } from 'react';
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
import { useOffers } from './hooks/useOffers';
import { INITIAL_OFFERS } from './data/constants';
import { offerService } from './services/OfferService';
import { useNetworkStatus } from './hooks/useNetworkStatus';

export function App() {
    const [page, setPage]     = useState<PageName>('home');
    const [user, setUser]     = useState<AuthUser | null>(null);
    const offerHook           = useOffers(INITIAL_OFFERS);
    const isOnline            = useNetworkStatus();

    useEffect(() => {
        if (isOnline) offerService.syncOfflineData();
    }, [isOnline]);

    // Restore session on mount
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    function handleLogin(authUser: AuthUser) {
        localStorage.setItem('user', JSON.stringify(authUser));
        setUser(authUser);
        // Redirect to role's default page
        if (authUser.role === 'DENTIST') setPage('dashboard');
        else if (authUser.role === 'ADMIN') setPage('dashboard');
        else setPage('home');
    }

    function handleLogout() {
        localStorage.removeItem('user');
        setUser(null);
        setPage('home');
    }

    const role = user?.role ?? null;

    const canSee = {
        // Unauthenticated / PATIENT / ADMIN
        home:         true,
        login:        !user,
        register:     !user,
        // PATIENT + ADMIN
        'send-request': role === 'PATIENT' || role === 'ADMIN',
        'my-offers':    role === 'PATIENT' || role === 'ADMIN',
        appointments:   role === 'PATIENT' || role === 'ADMIN',
        // CLINIC + ADMIN
        about:        role === 'PATIENT'  || role === 'ADMIN',
        requests:     role === 'DENTIST'  || role === 'ADMIN',
        dashboard:    role === 'DENTIST'  || role === 'ADMIN',
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

            <Nav page={page} setPage={setPage} user={user} onLogout={handleLogout} />

            {/* ── Public ── */}
            {page === 'home'     && <HomePage    setPage={setPage} />}
            {page === 'login'    && <LoginPage   setPage={setPage} onLogin={handleLogin} />}
            {page === 'register' && <RegisterPage setPage={setPage} onLogin={handleLogin} />}

            {/* ── Patient ── */}
            {canSee['send-request'] && page === 'send-request' && <SendRequestPage  setPage={setPage} />}
            {canSee['my-offers']    && page === 'my-offers'    && <MyOffersPage     setPage={setPage} />}
            {canSee['appointments'] && page === 'appointments' && <AppointmentsPage setPage={setPage} />}

            {/* ── Clinic ── */}
            {canSee['about']     && page === 'about'     && <AboutPage          setPage={setPage} />}
            {canSee['requests']  && page === 'requests'  && <ReviewRequestsPage offersHook={offerHook} setPage={setPage} />}
            {canSee['dashboard'] && page === 'dashboard' && <DashboardPage      offersHook={offerHook} />}
        </>
    );
}