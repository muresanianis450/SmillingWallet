import React, { useState } from 'react';
import { Offer, OfferFormFields, ValidationErrors } from '../../../types';
import { validateOffer } from '../../../utils/validation';
import { toInputDate, toInputTime, formatDisplayDate, formatDisplayTime } from '../../../utils/formatters';
import { Modal } from '../../shared/Modal';
import { FormField } from '../../shared/FormField';
import { Input, PriceInput } from '../../shared/Input';
import { Button } from '../../shared/Button';
import styles from './OfferFormModal.module.css';

interface OfferFormModalProps {
  offer?: Offer;
  patientId?: string | null;
  onClose: () => void;
  onSubmit: (fields: Partial<OfferFormFields>) => void;
}

const STATUS_STYLES: Record<string, string> = {
  Accepted: styles.badgeAccepted,
  Sent:     styles.badgeSent,
  Declined: styles.badgeDeclined,
  Pending:  styles.badgePending,
};

export function OfferFormModal({
                                 offer,
                                 patientId,
                                 onClose,
                                 onSubmit,
                               }: OfferFormModalProps) {
  const isEdit     = !!offer;
  const isAccepted = offer?.status === 'Accepted';

  const [fields, setFields] = useState<OfferFormFields>({
    patientName:       offer?.patientName       ?? '',
    priceQuote:        offer?.priceQuote        ?? '',
    date:              toInputDate(offer?.date),
    time:              toInputTime(offer?.time),
    status:            offer?.status            ?? 'Sent',
    treatmentCategory: offer?.treatmentCategory ?? '',
    treatmentReq:      offer?.treatmentReq      ?? '',
    symptoms:          offer?.symptoms          ?? '',
    ctScan:            offer?.ctScan            ?? '',
  });

  const [errors,  setErrors]  = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof OfferFormFields, boolean>>>({});

  function set<K extends keyof OfferFormFields>(key: K, value: OfferFormFields[K]) {
    const next = { ...fields, [key]: value };
    setFields(next);
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validateOffer(next));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // For accepted offers, only validate date/time (price is locked)
    const fieldsToValidate = isAccepted
    ? {...fields, priceQuote: offer?.priceQuote ?? fields.priceQuote}
        : fields;

    const errs = validateOffer(fieldsToValidate);

    //Remove date error if no date is set (appointment not yet scheduled is valid)
    if (!fields.date && !fields.time){
      delete errs.date;
      delete errs.time;
    }

    setErrors(errs);
    setTouched(Object.fromEntries(Object.keys(fields).map((k) => [k,true])) as any);
    if (Object.keys(errs).length) return;

    onSubmit({
      ...fields,
      date: formatDisplayDate(fields.date) ?? undefined,
      time: formatDisplayTime(fields.time) ?? undefined,
    })
  }

  const hasBlockingErrors =
      Object.keys(errors).length > 0 && Object.keys(touched).length > 0;

  const title = isEdit
      ? `View Patient: ${offer.patientName}`
      : `Add New Offer${patientId ? ` — Patient: #${patientId}` : ''}`;

  return (
      <Modal title={title} onClose={onClose}>

        {/* ── Patient details + status badge (edit mode only) ── */}
        {isEdit && (
            <div className={styles.details}>

              {/* Status badge — read-only, no dropdown */}
              <div className={styles.statusRow}>
            <span className={`${styles.statusBadge} ${STATUS_STYLES[offer.status] ?? styles.badgeDeclined}`}>
              {offer.status}
            </span>
                {isAccepted && (
                    <span className={styles.lockedNote}>
                🔒 Price is locked for accepted offers
              </span>
                )}
              </div>

              <div className={styles.detailGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Treatment Category</span>
                  <span className={styles.detailValue}>{offer.treatmentCategory || '—'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Treatment Requirement</span>
                  <span className={styles.detailValue}>{offer.treatmentReq || '—'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Dental CT Scan</span>
                  <span className={offer.ctScan ? styles.detailLink : styles.detailMuted}>
                {offer.ctScan ?? '—'}
              </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Symptoms Summary</span>
                  <span className={styles.detailValue}>{offer.symptoms || '—'}</span>
                </div>
              </div>

              <hr className={styles.divider} />
            </div>
        )}

        {/* Patient name — only when adding a new offer */}
        {!isEdit && (
            <FormField
                label="Patient Name"
                error={touched.patientName ? errors.patientName : undefined}
            >
              <Input
                  placeholder="Patient name or leave blank for anonymous"
                  value={fields.patientName}
                  hasError={!!(touched.patientName && errors.patientName)}
                  onChange={(e) => set('patientName', e.target.value)}
              />
            </FormField>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Price — locked when Accepted, editable otherwise */}
          <FormField
              label="Price Quote"
              error={touched.priceQuote ? errors.priceQuote : undefined}
          >
            <div className={styles.priceWrapper}>
              <PriceInput
                  value={fields.priceQuote}
                  hasError={!!(touched.priceQuote && errors.priceQuote)}
                  onChange={(v) => { if (!isAccepted) set('priceQuote', v); }}
                  placeholder={isAccepted ? String(offer?.priceQuote ?? '') : '€—'}
              />
              {isAccepted && <span className={styles.lockIcon}>🔒</span>}
            </div>
          </FormField>

          {/* Date + Time — always editable */}
          <div className={styles.formRow}>
            <FormField label="📅 Date" error={touched.date ? errors.date : undefined}>
              <Input
                  type="date"
                  value={fields.date}
                  hasError={!!(touched.date && errors.date)}
                  onChange={(e) => set('date', e.target.value)}
              />
            </FormField>
            <FormField label="🕐 Time" error={touched.time ? errors.time : undefined}>
              <Input
                  type="time"
                  value={fields.time}
                  hasError={!!(touched.time && errors.time)}
                  onChange={(e) => set('time', e.target.value)}
              />
            </FormField>
          </div>

          <div className={styles.actions}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={hasBlockingErrors}>
              {isEdit ? 'Save Changes' : 'Send Offer'}
            </Button>
          </div>
        </form>
      </Modal>
  );
}