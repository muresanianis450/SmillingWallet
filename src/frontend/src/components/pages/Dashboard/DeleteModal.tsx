import React from 'react';
import { Offer } from '../../../types';
import { Button } from '../../shared/Button';
import styles from './DeleteModal.module.css';

interface DeleteModalProps {
  offer: Offer;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteModal({ offer, onClose, onConfirm }: DeleteModalProps) {
  const displayName =
    offer.patientName !== offer.patientId
      ? offer.patientName
      : `Offer #${offer.id}`;

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.dialog}>
        <p className={styles.question}>
          Are you sure you want to delete
          <br />
          <strong>{displayName}</strong>?
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
