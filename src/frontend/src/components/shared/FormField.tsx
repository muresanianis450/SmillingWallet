import React, { ReactNode } from 'react';
import styles from './FormField.module.css';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, error, hint, children }: FormFieldProps) {
  return (
    <div className={styles.group}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
