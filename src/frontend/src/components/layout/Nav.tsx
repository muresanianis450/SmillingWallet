import React from 'react';
import { PageName } from '../../types';
import styles from './Nav.module.css';

interface NavProps {
  page: PageName;
  setPage: (page: PageName) => void;
}

export function Nav({ page, setPage }: NavProps) {
  return (
    <nav className={styles.nav}>
      <span className={styles.logo} onClick={() => setPage('about')}>
        <span className={styles.logoIcon}>🦷</span>
        Smiling Wallet
      </span>

      <div className={styles.links}>
        <button
          className={`${styles.link} ${page === 'about' ? styles.active : ''}`}
          onClick={() => setPage('about')}
        >
          Home
        </button>
        <button
          className={`${styles.link} ${page === 'requests' ? styles.active : ''}`}
          onClick={() => setPage('requests')}
        >
          Review Request
        </button>
        <button
          className={`${styles.link} ${page === 'dashboard' ? styles.active : ''}`}
          onClick={() => setPage('dashboard')}
        >
          Clinic DashBoard
        </button>
      </div>

      <div className={styles.avatar} />
    </nav>
  );
}
