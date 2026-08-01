import {describe, expect, it} from 'vitest';
import {normalizeRomanianPhone, validateOffer, validateRomanianPhone, validateSendOffer,} from '../utils/validation';

// ─── Helper: a valid future date ─────────────────────────────────────────────
const futureDate = new Date(Date.now() + 86_400_000 * 2)
  .toISOString()
  .split('T')[0];
const futureTime = '14:00';

// ─── Price Quote ──────────────────────────────────────────────────────────────
describe('validateOffer — price quote', () => {
  it('rejects empty string', () => {
    expect(validateOffer({ priceQuote: '' }).priceQuote).toMatch(/required/i);
  });

  it('rejects undefined', () => {
    expect(validateOffer({}).priceQuote).toMatch(/required/i);
  });

  it('rejects zero', () => {
    expect(validateOffer({ priceQuote: 0 }).priceQuote).toMatch(/positive/i);
  });

  it('rejects negative value', () => {
    expect(validateOffer({ priceQuote: -1 }).priceQuote).toMatch(/positive/i);
  });

  it('rejects non-numeric string', () => {
    expect(validateOffer({ priceQuote: 'abc' }).priceQuote).toMatch(/positive/i);
  });

  it('rejects value above 99999', () => {
    expect(validateOffer({ priceQuote: 100_000 }).priceQuote).toMatch(/99,999/);
  });

  it('accepts boundary value 99999', () => {
    expect(validateOffer({ priceQuote: 99_999 }).priceQuote).toBeUndefined();
  });

  it('accepts valid integer', () => {
    expect(validateOffer({ priceQuote: 450 }).priceQuote).toBeUndefined();
  });

  it('accepts numeric string "350"', () => {
    expect(validateOffer({ priceQuote: '350' }).priceQuote).toBeUndefined();
  });

  it('accepts decimal price', () => {
    expect(validateOffer({ priceQuote: 299.99 }).priceQuote).toBeUndefined();
  });
});

// ─── Date & Time ─────────────────────────────────────────────────────────────
describe('validateOffer — date & time', () => {
  it('accepts both empty (optional fields)', () => {
    const e = validateOffer({ priceQuote: 100, date: '', time: '' });
    expect(e.date).toBeUndefined();
    expect(e.time).toBeUndefined();
  });

  it('requires time when date is provided', () => {
    const e = validateOffer({ priceQuote: 100, date: futureDate, time: '' });
    expect(e.time).toMatch(/required/i);
  });

  it('requires date when time is provided', () => {
    const e = validateOffer({ priceQuote: 100, date: '', time: futureTime });
    expect(e.date).toMatch(/required/i);
  });

  it('rejects a past date+time combination', () => {
    const e = validateOffer({ priceQuote: 100, date: '2020-01-01', time: '10:00' });
    expect(e.date).toMatch(/future/i);
  });

  it('accepts a valid future date+time', () => {
    const e = validateOffer({ priceQuote: 100, date: futureDate, time: futureTime });
    expect(e.date).toBeUndefined();
    expect(e.time).toBeUndefined();
  });
});

// ─── Status ──────────────────────────────────────────────────────────────────
describe('validateOffer — status', () => {
  it('accepts "Accepted"', () => {
    expect(validateOffer({ priceQuote: 100, status: 'Accepted' }).status).toBeUndefined();
  });

  it('accepts "Sent"', () => {
    expect(validateOffer({ priceQuote: 100, status: 'Sent' }).status).toBeUndefined();
  });

  it('accepts "Declined"', () => {
    expect(validateOffer({ priceQuote: 100, status: 'Declined' }).status).toBeUndefined();
  });

  it('accepts "Pending"', () => {
    expect(validateOffer({ priceQuote: 100, status: 'Pending' }).status).toBeUndefined();
  });

  it('rejects unknown status', () => {
    expect(validateOffer({ priceQuote: 100, status: 'Banana' }).status).toMatch(/invalid/i);
  });

  it('accepts empty status (field is optional)', () => {
    expect(validateOffer({ priceQuote: 100, status: '' }).status).toBeUndefined();
  });
});

// ─── Patient Name ─────────────────────────────────────────────────────────────
describe('validateOffer — patient name', () => {
  it('accepts empty name (anonymous)', () => {
    expect(validateOffer({ priceQuote: 100, patientName: '' }).patientName).toBeUndefined();
  });

  it('rejects single character', () => {
    expect(validateOffer({ priceQuote: 100, patientName: 'A' }).patientName).toMatch(/2 char/i);
  });

  it('accepts exactly 2 characters', () => {
    expect(validateOffer({ priceQuote: 100, patientName: 'Jo' }).patientName).toBeUndefined();
  });

  it('accepts a normal full name', () => {
    expect(validateOffer({ priceQuote: 100, patientName: 'Anamaria Prodan' }).patientName).toBeUndefined();
  });

  it('accepts exactly 80 characters', () => {
    expect(validateOffer({ priceQuote: 100, patientName: 'A'.repeat(80) }).patientName).toBeUndefined();
  });

  it('rejects 81 characters', () => {
    expect(validateOffer({ priceQuote: 100, patientName: 'A'.repeat(81) }).patientName).toMatch(/long/i);
  });
});

// ─── Full valid offer produces no errors ────────────────────────────────────
describe('validateOffer — complete valid offer', () => {
  it('returns an empty errors object for a fully valid offer', () => {
    const errors = validateOffer({
      priceQuote:  450,
      date:        futureDate,
      time:        futureTime,
      status:      'Sent',
      patientName: 'Florin Piersic',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

// ─── validateSendOffer (delegates to validateOffer) ──────────────────────────
describe('validateSendOffer', () => {
  it('rejects empty price quote', () => {
    expect(validateSendOffer({ priceQuote: '' }).priceQuote).toMatch(/required/i);
  });

  it('accepts valid price with no date/time', () => {
    const errors = validateSendOffer({ priceQuote: 300, date: '', time: '' });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

// ─── Romanian Phone ───────────────────────────────────────────────────────────
describe('validateRomanianPhone', () => {
    it('rejects an empty value', () => {
        expect(validateRomanianPhone('')).toMatch(/required/i);
        expect(validateRomanianPhone('   ')).toMatch(/required/i);
    });

    it('accepts national mobile format, however it is spaced', () => {
        expect(validateRomanianPhone('0712345678')).toBe('');
        expect(validateRomanianPhone('0712 345 678')).toBe('');
        expect(validateRomanianPhone('0712-345-678')).toBe('');
        expect(validateRomanianPhone('(0712) 345.678')).toBe('');
    });

    it('accepts international prefixes', () => {
        expect(validateRomanianPhone('+40712345678')).toBe('');
        expect(validateRomanianPhone('+40 712 345 678')).toBe('');
        expect(validateRomanianPhone('0040712345678')).toBe('');
        expect(validateRomanianPhone('40712345678')).toBe('');
    });

    it('accepts landlines', () => {
        expect(validateRomanianPhone('0213456789')).toBe('');   // Bucharest
        expect(validateRomanianPhone('0364123456')).toBe('');   // regional
    });

    it('rejects wrong lengths', () => {
        expect(validateRomanianPhone('071234567')).toMatch(/Romanian/);    // one short
        expect(validateRomanianPhone('07123456789')).toMatch(/Romanian/);  // one long
    });

    it('rejects prefixes that are not mobile or landline', () => {
        expect(validateRomanianPhone('0512345678')).toMatch(/Romanian/);
        expect(validateRomanianPhone('0912345678')).toMatch(/Romanian/);
    });

    it('rejects a non-Romanian country code', () => {
        expect(validateRomanianPhone('+44712345678')).toMatch(/Romanian/);
    });

    it('rejects letters and stray symbols', () => {
        expect(validateRomanianPhone('07123abcde')).toMatch(/can only contain/i);
        expect(validateRomanianPhone('0712/345678')).toMatch(/can only contain/i);
    });
});

describe('normalizeRomanianPhone', () => {
    it('canonicalises every accepted format to +40…', () => {
        for (const input of [
            '0712345678', '0712 345 678', '+40712345678',
            '+40 712 345 678', '0040712345678', '40712345678',
        ]) {
            expect(normalizeRomanianPhone(input)).toBe('+40712345678');
        }
    });

    it('returns null for anything invalid', () => {
        expect(normalizeRomanianPhone('nope')).toBeNull();
        expect(normalizeRomanianPhone('')).toBeNull();
    });
});
