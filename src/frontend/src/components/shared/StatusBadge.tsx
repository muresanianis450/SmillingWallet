import React from 'react';
import { OfferStatus } from '../../types/types.ts';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: OfferStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const classMap: Record<string, string> = {
    Accepted: styles.accepted,
    Sent:     styles.sent,
    Declined: styles.declined,
    Pending:  styles.pending,
  };

  const cls = classMap[status] ?? styles.declined;

  return <span className={`${styles.badge} ${cls}`}>{status}</span>;
}
