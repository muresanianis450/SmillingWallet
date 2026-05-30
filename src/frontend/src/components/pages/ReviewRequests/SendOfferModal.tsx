import React, { useState } from 'react';
import { DentalRequest, SendOfferFormFields, ValidationErrors } from '../../../types/types.ts';
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

function formatDateRange(from?: string | null, to?: string | null): string {
  if (!from && !to) return 'Not specified';
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (from && to) return `${fmt(from)} → ${fmt(to)}`;
  if (from) return `From ${fmt(from)}`;
  return `Until ${to ? new Date(to).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}`;
}

function validateFields(fields: SendOfferFormFields): ValidationErrors {
  const errors: ValidationErrors = {} as ValidationErrors;
  if (!fields.priceQuote || Number(fields.priceQuote) <= 0)
    (errors as any).priceQuote = 'Price is required';
  if (!fields.proposedSlot1)
    (errors as any).proposedSlot1 = 'At least one time slot is required';
  return errors;
}

export function SendOfferModal({ request, onClose, onSend }: SendOfferModalProps) {
  const [fields, setFields] = useState<SendOfferFormFields>({
    priceQuote: '',
    estimatedWaitDays: '',
    notes: '',
    proposedSlot1: '',
    proposedSlot2: '',
    proposedSlot3: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function set<K extends keyof SendOfferFormFields>(key: K, value: SendOfferFormFields[K]) {
    const next = { ...fields, [key]: value };
    setFields(next);
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validateFields(next));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateFields(fields);
    setErrors(errs);
    setTouched({ priceQuote: true, proposedSlot1: true });
    if (Object.keys(errs).length) return;

    const slots: string[] = [];
    if (fields.proposedSlot1) slots.push(fields.proposedSlot1);
    if (fields.proposedSlot2) slots.push(fields.proposedSlot2);
    if (fields.proposedSlot3) slots.push(fields.proposedSlot3);

    onSend({
      requestId:         request.id,
      price:             fields.priceQuote,
      estimatedWaitDays: fields.estimatedWaitDays || 0,
      notes:             fields.notes || '',
      proposedSlot1:     slots[0] || null,
      proposedSlot2:     slots[1] || null,
      proposedSlot3:     slots[2] || null,
    });
  }

  const minSlot = request.availableFrom
    ? request.availableFrom + 'T08:00'
    : new Date(Date.now() + 3600_000).toISOString().slice(0, 16);
  const maxSlot = request.availableTo ? request.availableTo + 'T23:59' : undefined;

  const displayCategory = SPECIALTY_DISPLAY[request.specialty] || request.specialty;
  const hasBlockingErrors = Object.keys(errors).length > 0 && Object.keys(touched).length > 0;

  return (
    <Modal title={`Send Offer — ${displayCategory} · #${request.id.substring(0, 8)}`} onClose={onClose}>
      <div data-testid="send-offer-modal">
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888)', marginBottom: '8px' }}>
          {request.description}
        </p>

        {/* Availability window banner */}
        <div style={{
          background: '#f0f0ff', border: '1px solid #c7c4f7', borderRadius: '8px',
          padding: '10px 14px', marginBottom: '16px', fontSize: '0.85rem', color: '#4a3fbf',
        }}>
          <strong>Patient availability:</strong> {formatDateRange(request.availableFrom, request.availableTo)}
          <br />
          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
            Propose up to 3 time slots within this window.
          </span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Price Quote (€)" error={touched.priceQuote ? (errors as any).priceQuote : undefined}>
            <PriceInput
              value={fields.priceQuote}
              hasError={!!(touched.priceQuote && (errors as any).priceQuote)}
              onChange={(v) => set('priceQuote', v)}
            />
          </FormField>

          <FormField label="Estimated Wait Days">
            <Input
              type="number"
              placeholder="e.g. 0"
              value={String(fields.estimatedWaitDays)}
              hasError={false}
              onChange={(e) => set('estimatedWaitDays', e.target.value)}
            />
          </FormField>

          {/* Time slot pickers */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: '8px' }}>
              Proposed Time Slots <span style={{ color: 'red' }}>*</span>
            </label>
            {[
              { key: 'proposedSlot1' as const, label: 'Slot 1 (required)' },
              { key: 'proposedSlot2' as const, label: 'Slot 2 (optional)' },
              { key: 'proposedSlot3' as const, label: 'Slot 3 (optional)' },
            ].map(({ key, label }) => (
              <div key={key} style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  {label}
                </label>
                <input
                  type="datetime-local"
                  value={fields[key]}
                  min={minSlot}
                  max={maxSlot}
                  onChange={(e) => set(key, e.target.value)}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: '6px',
                    border: key === 'proposedSlot1' && touched.proposedSlot1 && (errors as any).proposedSlot1
                      ? '1px solid red' : '1px solid var(--border, #ddd)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            ))}
            {touched.proposedSlot1 && (errors as any).proposedSlot1 && (
              <span style={{ color: 'red', fontSize: '0.8rem' }}>{(errors as any).proposedSlot1}</span>
            )}
          </div>

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
