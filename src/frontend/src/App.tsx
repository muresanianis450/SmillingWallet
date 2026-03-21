import React, { useState } from 'react';
import { PageName } from './types';
import { Nav } from './components/layout/Nav';
import { AboutPage } from './components/pages/About/AboutPage';
import { ReviewRequestsPage } from './components/pages/ReviewRequests/ReviewRequestsPage';
import { DashboardPage } from './components/pages/Dashboard/DashboardPage';
import { useOffers } from './hooks/useOffers';
import { INITIAL_OFFERS } from './data/constants';

export function App() {
  const [page, setPage] = useState<PageName>('about');
  const offerHook = useOffers(INITIAL_OFFERS);

  return (
    <>
      <Nav page={page} setPage={setPage} />

      {page === 'about'     && <AboutPage setPage={setPage} />}
      {page === 'requests'  && <ReviewRequestsPage offersHook={offerHook} setPage={setPage} />}
      {page === 'dashboard' && <DashboardPage offersHook={offerHook}/>}
    </>
  );
}
