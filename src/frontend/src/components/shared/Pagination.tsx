import React from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number | ((prev: number) => number)) => void;
}

export function Pagination({ page, totalPages, setPage }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={styles.pagination}>
      <button
        className={styles.arrow}
        disabled={page === 1}
        onClick={() => setPage(1)}
      >«</button>
      <button
        className={styles.arrow}
        disabled={page === 1}
        onClick={() => setPage((p) => p - 1)}
      >‹</button>

      {pages.map((p) => (
        <button
          key={p}
          className={`${styles.pageBtn} ${page === p ? styles.active : ''}`}
          onClick={() => setPage(p)}
        >
          {p}
        </button>
      ))}

      <button
        className={styles.arrow}
        disabled={page === totalPages}
        onClick={() => setPage((p) => p + 1)}
      >›</button>
      <button
        className={styles.arrow}
        disabled={page === totalPages}
        onClick={() => setPage(totalPages)}
      >»</button>
    </div>
  );
}
