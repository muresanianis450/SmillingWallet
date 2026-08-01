import {OfferFormFields, SendOfferFormFields, ValidationErrors} from '../types/types.ts';
import {OFFER_STATUSES} from '../data/constants';

// ─── Phone Validation ────────────────────────────────────────────────────────

/**
 * Reduces a Romanian number to canonical `+40XXXXXXXXX`, or null if it isn't one.
 * Accepts the formats people actually type — 0712 345 678, +40 712 345 678,
 * 0040-712-345-678 — and both mobile (07) and landline (02/03) prefixes.
 */
export function normalizeRomanianPhone(raw: string): string | null {
    const digits = (raw ?? '').replace(/[\s\-().]/g, '');

    let national: string;
    if (/^\+40\d{9}$/.test(digits)) national = '0' + digits.slice(3);
    else if (/^0040\d{9}$/.test(digits)) national = '0' + digits.slice(4);
    else if (/^40\d{9}$/.test(digits)) national = '0' + digits.slice(2);
    else if (/^0\d{9}$/.test(digits)) national = digits;
    else return null;

    // 07 = mobile, 02/03 = landline. Anything else isn't a dialable clinic number.
    return /^0[237]\d{8}$/.test(national) ? '+40' + national.slice(1) : null;
}

/** Returns an error message, or '' when the number is valid. */
export function validateRomanianPhone(raw: string): string {
    const value = (raw ?? '').trim();
    if (!value) return 'Phone is required';
    if (!/^[+\d\s\-().]+$/.test(value)) {
        return 'Phone can only contain digits, spaces and + - ( ) .';
    }
    if (!normalizeRomanianPhone(value)) {
        return 'Enter a Romanian number, e.g. 0712 345 678 or +40 712 345 678';
    }
    return '';
}

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

// ─── Send-Offer Form Validation ──────────────────────────────────────────────

export function validateSendOffer(fields: Partial<SendOfferFormFields>): ValidationErrors {
  const errors: ValidationErrors = {};
  const price = parseFloat(String(fields.priceQuote));
  if (fields.priceQuote === '' || fields.priceQuote === null || fields.priceQuote === undefined) {
    errors.priceQuote = 'Price is required';
  } else if (isNaN(price) || price <= 0) {
    errors.priceQuote = 'Price must be a positive number';
  } else if (price > 99999) {
    errors.priceQuote = 'Price cannot exceed €99,999';
  }
  if (fields.procedureDays !== undefined && fields.procedureDays !== '') {
    const days = parseInt(String(fields.procedureDays), 10);
    if (isNaN(days) || days < 1 || days > 365) {
      errors.procedureDays = 'Procedure days must be between 1 and 365';
    }
  }
  return errors;
}
