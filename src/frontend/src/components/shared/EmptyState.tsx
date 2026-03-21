import React from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon: string;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>{icon}</div>
      <p>{message}</p>
    </div>
  );
}
