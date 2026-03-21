import { OfferFormFields, SendOfferFormFields, ValidationErrors } from '../types';
import { OFFER_STATUSES } from '../data/constants';

// ─── Offer Form Validation ───────────────────────────────────────────────────

export function validateOffer(
  fields: Partial<OfferFormFields>
): ValidationErrors {
  const errors: ValidationErrors = {};
  const price = parseFloat(String(fields.priceQuote));

  // Price
  if (
    fields.priceQuote === '' ||
    fields.priceQuote === null ||
    fields.priceQuote === undefined
  ) {
    errors.priceQuote = 'Price quote is required';
  } else if (isNaN(price) || price <= 0) {
    errors.priceQuote = 'Price must be a positive number';
  } else if (price > 99999) {
    errors.priceQuote = 'Price cannot exceed €99,999';
  }

  // Date + Time — must come together and be in the future
  if (fields.date && fields.time) {
    const combined = new Date(`${fields.date}T${fields.time}`);
    if (isNaN(combined.getTime())) {
      errors.date = 'Invalid date or time';
    } else if (combined < new Date()) {
      errors.date = 'Appointment must be in the future';
    }
  }
  if (fields.date && !fields.time) errors.time  = 'Time is required when date is set';
  if (fields.time && !fields.date) errors.date  = 'Date is required when time is set';

  // Status
  if (fields.status && !OFFER_STATUSES.includes(fields.status as any)) {
    errors.status = 'Invalid status';
  }

  // Patient name
  if (fields.patientName && fields.patientName.trim().length < 2) {
    errors.patientName = 'Name must be at least 2 characters';
  }
  if (fields.patientName && fields.patientName.trim().length > 80) {
    errors.patientName = 'Name too long (max 80 characters)';
  }

  return errors;
}

// ─── Send-Offer Form Validation (lighter — only price + optional date/time) ──

export function validateSendOffer(
  fields: Partial<SendOfferFormFields>
): ValidationErrors {
  return validateOffer(fields as Partial<OfferFormFields>);
}
