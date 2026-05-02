import {useEffect, useState} from 'react';
import { PageName } from './types/types';
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
import {offerService} from "./services/OfferService";
import {useNetworkStatus} from "./hooks/useNetworkStatus";

export function App() {
  const [page, setPage] = useState<PageName>('home');
  const offerHook = useOffers(INITIAL_OFFERS);
  const isOnline = useNetworkStatus();

    useEffect(() => {
        if (isOnline) {
            offerService.syncOfflineData();
        }
    }, [isOnline]);

  return (
      <>
          {/* ── Offline Banner ── */}
          {!isOnline && (
              <div style={{
                  background: '#E8593C',
                  color: '#fff',
                  textAlign: 'center',
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold'
              }}>
                  You are currently offline. Changes will be synced once you reconnect.
              </div>
          )}

        <Nav page={page} setPage={setPage} />

        {/* ── Client Pages ── */}
        {page === 'home'         && <HomePage       setPage={setPage} />}
        {page === 'send-request' && <SendRequestPage setPage={setPage} />}
        {page === 'my-offers'    && <MyOffersPage    setPage={setPage} />}
        {page === 'appointments' && <AppointmentsPage setPage={setPage} />}
          {page === 'login'    && <LoginPage    setPage={setPage} />}
          {page === 'register' && <RegisterPage setPage={setPage} />}

        {/* ── Clinic Pages ── */}
        {page === 'about'     && <AboutPage      setPage={setPage} />}
        {page === 'requests'  && <ReviewRequestsPage offersHook={offerHook} setPage={setPage} />}
        {page === 'dashboard' && <DashboardPage   offersHook={offerHook} />}
      </>
  );
}