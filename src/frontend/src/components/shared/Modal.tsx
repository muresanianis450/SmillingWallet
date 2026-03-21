import React, { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}

export function Modal({ title, onClose, children, maxWidth = 480 }: ModalProps) {
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} style={{ maxWidth }}>
        <div className={styles.head}>
          <span className={styles.title}>{title}</span>
          <button className={styles.close} onClick={onClose}>×</button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
