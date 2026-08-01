import React, {useState} from 'react';
import {DentalRequest, SendOfferFormFields, ValidationErrors} from '../../../types/types.ts';
import {Modal} from '../../shared/Modal';
import {FormField} from '../../shared/FormField';
import {Input, PriceInput} from '../../shared/Input';
import {Button} from '../../shared/Button';
import {RequestFiles} from '../../shared/RequestFiles';
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
  return `Until ${to ? fmt(to) : ''}`;
}

/** Adds (days - 1) calendar days to an ISO date string, yielding the inclusive end date.
 *  Formats from local components (not toISOString) to avoid a UTC shift that would
 *  push the date back a day in positive-offset timezones. */
function endDateFor(startISO: string, days: number): string {
  if (!startISO || !days || days < 1) return '';
  const d = new Date(startISO + 'T00:00:00');
  d.setDate(d.getDate() + days - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtLong(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function SendOfferModal({ request, onClose, onSend }: SendOfferModalProps) {
  const [fields, setFields] = useState<SendOfferFormFields>({
    priceQuote: '',
    procedureDays: '',
    notes: '',
    variant1Start: '',
    variant1End: '',
    variant2Start: '',
    variant2End: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const days = parseInt(String(fields.procedureDays), 10);
  const winFrom = request.availableFrom || undefined;
  const winTo = request.availableTo || undefined;

  const variant1End = endDateFor(fields.variant1Start, days);
  const variant2End = fields.variant2Start ? endDateFor(fields.variant2Start, days) : '';

  function validateFields(f: SendOfferFormFields): ValidationErrors {
    const errs: ValidationErrors = {} as ValidationErrors;
    if (!f.priceQuote || Number(f.priceQuote) <= 0)
      (errs as any).priceQuote = 'Price is required';
    if (!f.procedureDays || Number(f.procedureDays) < 1)
      (errs as any).procedureDays = 'Enter how many days the procedure takes';
    if (!f.variant1Start)
      (errs as any).variant1Start = 'At least one date option is required';
    // Window checks (only when we have a procedure length and a window)
    if (days >= 1) {
      const checkInWindow = (start: string, end: string, key: string) => {
        if (!start) return;
        if (winFrom && start < winFrom) (errs as any)[key] = 'Starts before the patient is available';
        else if (winTo && end > winTo)  (errs as any)[key] = 'Ends after the patient leaves';
      };
      checkInWindow(f.variant1Start, endDateFor(f.variant1Start, days), 'variant1Start');
      checkInWindow(f.variant2Start, endDateFor(f.variant2Start, days), 'variant2Start');
    }
    return errs;
  }

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
    setTouched({ priceQuote: true, procedureDays: true, variant1Start: true, variant2Start: true });
    if (Object.keys(errs).length) return;

    onSend({
      requestId:     request.id,
      price:         fields.priceQuote,
      procedureDays: Number(fields.procedureDays),
      notes:         fields.notes || '',
      variant1Start: fields.variant1Start,
      variant1End:   variant1End,
      variant2Start: fields.variant2Start || null,
      variant2End:   fields.variant2Start ? variant2End : null,
    });
  }

  const displayCategory = SPECIALTY_DISPLAY[request.specialty] || request.specialty;
  const hasBlockingErrors = Object.keys(errors).length > 0 && Object.keys(touched).length > 0;

  const dateInputStyle = (hasError: boolean) => ({
    width: '100%', padding: '8px 10px', borderRadius: '6px',
    border: hasError ? '1px solid red' : '1px solid var(--border, #ddd)',
    fontSize: '0.875rem',
  });

  return (
    <Modal title={`Send Offer — ${displayCategory} · #${request.id.substring(0, 8)}`} onClose={onClose}>
      <div data-testid="send-offer-modal">
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #888)', marginBottom: '8px' }}>
          {request.description}
        </p>

        {/* Patient-uploaded CT scans / X-rays */}
        <RequestFiles requestId={request.id} />

        {/* Availability window banner */}
        <div style={{
          background: '#f0f0ff', border: '1px solid #c7c4f7', borderRadius: '8px',
          padding: '10px 14px', marginBottom: '16px', fontSize: '0.85rem', color: '#4a3fbf',
        }}>
          <strong>Patient availability:</strong> {formatDateRange(request.availableFrom, request.availableTo)}
          <br />
          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
            Choose how many days the treatment takes, then propose 1–2 start dates inside this window.
            Exact times are arranged with the patient by phone.
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

          <FormField
            label="Procedure Length (days)"
            error={touched.procedureDays ? (errors as any).procedureDays : undefined}
          >
            <Input
              type="number"
              placeholder="e.g. 3"
              value={String(fields.procedureDays)}
              hasError={!!(touched.procedureDays && (errors as any).procedureDays)}
              onChange={(e) => set('procedureDays', e.target.value)}
            />
          </FormField>

          {/* Date-range options */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: '8px' }}>
              Proposed Date Options <span style={{ color: 'red' }}>*</span>
            </label>

            {/* Option A */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                Option A — start date (required)
              </label>
              <input
                type="date"
                value={fields.variant1Start}
                min={winFrom}
                max={winTo}
                onChange={(e) => set('variant1Start', e.target.value)}
                style={dateInputStyle(!!(touched.variant1Start && (errors as any).variant1Start))}
              />
              {fields.variant1Start && days >= 1 && (
                <span style={{ fontSize: '0.8rem', color: '#4a3fbf', display: 'block', marginTop: '4px' }}>
                  → {fmtLong(fields.variant1Start)} – {fmtLong(variant1End)} ({days} day{days > 1 ? 's' : ''})
                </span>
              )}
              {touched.variant1Start && (errors as any).variant1Start && (
                <span style={{ color: 'red', fontSize: '0.8rem' }}>{(errors as any).variant1Start}</span>
              )}
            </div>

            {/* Option B */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                Option B — start date (optional)
              </label>
              <input
                type="date"
                value={fields.variant2Start}
                min={winFrom}
                max={winTo}
                onChange={(e) => set('variant2Start', e.target.value)}
                style={dateInputStyle(!!(touched.variant2Start && (errors as any).variant2Start))}
              />
              {fields.variant2Start && days >= 1 && (
                <span style={{ fontSize: '0.8rem', color: '#4a3fbf', display: 'block', marginTop: '4px' }}>
                  → {fmtLong(fields.variant2Start)} – {fmtLong(variant2End)} ({days} day{days > 1 ? 's' : ''})
                </span>
              )}
              {touched.variant2Start && (errors as any).variant2Start && (
                <span style={{ color: 'red', fontSize: '0.8rem' }}>{(errors as any).variant2Start}</span>
              )}
            </div>
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
