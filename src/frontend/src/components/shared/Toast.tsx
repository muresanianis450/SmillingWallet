import React from 'react';
import { ToastState } from '../../types';
import styles from './Toast.module.css';

interface ToastProps {
  toast: ToastState | null;
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      {toast.msg}
    </div>
  );
}
