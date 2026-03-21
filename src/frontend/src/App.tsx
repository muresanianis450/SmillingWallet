import { PageName } from './types';
import { Nav } from './components/layout/Nav';
import { AboutPage } from './components/pages/About/AboutPage';
import { ReviewRequestsPage } from './components/pages/ReviewRequests/ReviewRequestsPage';
import { DashboardPage } from './components/pages/Dashboard/DashboardPage';
import {useState} from "react";

export function App() {
  const [page, setPage] = useState<PageName>('about');

  return (
    <>
      <Nav page={page} setPage={setPage} />

      {page === 'about'     && <AboutPage setPage={setPage} />}
      {page === 'requests'  && <ReviewRequestsPage />}
      {page === 'dashboard' && <DashboardPage />}
    </>
  );
}
