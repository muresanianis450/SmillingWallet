import React, { useState } from 'react';
import { DentalRequest, SendOfferFormFields, ValidationErrors } from '../../../types/types.ts';
import { validateSendOffer } from '../../../utils/validation';
import { formatDisplayDate, formatDisplayTime } from '../../../utils/formatters';
import { Modal } from '../../shared/Modal';
import { FormField } from '../../shared/FormField';
import { Input, PriceInput } from '../../shared/Input';
import { Button } from '../../shared/Button';
// @ts-ignore
import styles from './SendOfferModal.module.css';

interface SendOfferModalProps {
  request: DentalRequest;
  onClose: () => void;
  onSend: (fields: Record<string, any>) => void;
}

export function SendOfferModal({ request, onClose, onSend }: SendOfferModalProps) {
  const [fields, setFields] = useState<SendOfferFormFields>({
    priceQuote: '',
    date: '',
    time: '',
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
    setTouched({ priceQuote: true, date: true, time: true });

    if (Object.keys(errs).length) return;

    onSend({
      patientId: request.id,
      patientName: '#' + request.id,
      priceQuote: fields.priceQuote,
      date: formatDisplayDate(fields.date),
      time: formatDisplayTime(fields.time),
      status: 'Sent',
      treatmentCategory: request.category,
      treatmentReq: request.symptoms,
      ctScan: request.ctScan ?? null,
      symptoms: request.symptoms,
    });
  }

  const hasBlockingErrors =
      Object.keys(errors).length > 0 && Object.keys(touched).length > 0;

  return (
      <Modal title={`Add New Offer — Patient: #${request.id}`} onClose={onClose}>
        <div data-testid="send-offer-modal">
          <form onSubmit={handleSubmit} noValidate>
            <FormField
                label="Price Quote"
                error={touched.priceQuote ? errors.priceQuote : undefined}
            >
              <PriceInput
                  value={fields.priceQuote}
                  hasError={!!(touched.priceQuote && errors.priceQuote)}
                  onChange={(v) => set('priceQuote', v)}
              />
            </FormField>

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
