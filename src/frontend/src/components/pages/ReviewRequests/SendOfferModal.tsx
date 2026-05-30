import React, { useState } from 'react';
import { DentalRequest, SendOfferFormFields, ValidationErrors } from '../../../types/types.ts';
import { validateSendOffer } from '../../../utils/validation';
import { Modal } from '../../shared/Modal';
import { FormField } from '../../shared/FormField';
import { Input, PriceInput } from '../../shared/Input';
import { Button } from '../../shared/Button';
// @ts-ignore
import styles from './SendOfferModal.module.css';

const SPECIALTY_DISPLAY: Record<string, string> = {
  GENERAL_DENTISTRY:   'General Dentistry',
  IMPLANTS:            'Implant Dentistry',
  ORTHODONTICS:        'Orthodontics',
  COSMETIC_DENTISTRY:  'Cosmetic Dentistry',
  PEDIATRIC_DENTISTRY: 'Pediatric Dentistry',
  ORAL_SURGERY:        'Emergency Dentistry',
};

interface SendOfferModalProps {
  request: DentalRequest;
  onClose: () => void;
  onSend: (fields: Record<string, any>) => void;
}

export function SendOfferModal({ request, onClose, onSend }: SendOfferModalProps) {
  const [fields, setFields] = useState<SendOfferFormFields>({
    priceQuote: '',
    estimatedWaitDays: '',
    notes: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SendOfferFormFields, boolean>>>({});

  function set<K extends keyof SendOfferFormFields>(key: K, value: SendOfferFormFields[K]) {
    const next = { ...fields, [key]: value };
    setFields(next);
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validateSendOffer(next));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateSendOffer(fields);
    setErrors(errs);
    setTouched({ priceQuote: true, estimatedWaitDays: true, notes: true });
    if (Object.keys(errs).length) return;

    onSend({
      requestId:         request.id,
      price:             fields.priceQuote,
      estimatedWaitDays: fields.estimatedWaitDays || 7,
      notes:             fields.notes || '',
    });
  }

  const hasBlockingErrors =
    Object.keys(errors).length > 0 && Object.keys(touched).length > 0;

  const displayCategory = SPECIALTY_DISPLAY[request.specialty] || request.specialty;

  return (
    <Modal title={`Send Offer — ${displayCategory} · #${request.id.substring(0, 8)}`} onClose={onClose}>
      <div data-testid="send-offer-modal">
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888)', marginBottom: '12px' }}>
          {request.description}
        </p>
        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Price Quote (€)"
            error={touched.priceQuote ? errors.priceQuote : undefined}
          >
            <PriceInput
              value={fields.priceQuote}
              hasError={!!(touched.priceQuote && errors.priceQuote)}
              onChange={(v) => set('priceQuote', v)}
            />
          </FormField>

          <FormField
            label="Estimated Wait Days"
            error={touched.estimatedWaitDays ? errors.estimatedWaitDays : undefined}
          >
            <Input
              type="number"
              placeholder="e.g. 7"
              value={String(fields.estimatedWaitDays)}
              hasError={!!(touched.estimatedWaitDays && errors.estimatedWaitDays)}
              onChange={(e) => set('estimatedWaitDays', e.target.value)}
            />
          </FormField>

          <FormField label="Notes (optional)">
            <textarea
              placeholder="Any additional info for the patient…"
              value={String(fields.notes)}
              onChange={(e) => set('notes', e.target.value as any)}
              rows={3}
              maxLength={500}
              style={{ width: '100%', resize: 'vertical', padding: '8px', borderRadius: '6px', border: '1px solid var(--border, #ddd)' }}
            />
          </FormField>

          <div className={styles.actions}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              data-testid="send-offer-submit-btn"
              variant="primary"
              type="submit"
              disabled={hasBlockingErrors}
            >
              Send Offer
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
