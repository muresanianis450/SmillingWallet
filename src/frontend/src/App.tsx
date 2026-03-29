import { useState } from 'react';
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

export function App() {
  const [page, setPage] = useState<PageName>('home');
  const offerHook = useOffers(INITIAL_OFFERS);

  return (
      <>
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