import { describe, it, expect } from 'vitest';
import {
  toInputDate,
  toInputTime,
  formatDisplayDate,
  formatDisplayTime,
  makeId,
} from '../utils/formatters';

describe('toInputDate', () => {
  it('returns empty string for null', () => {
    expect(toInputDate(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(toInputDate(undefined)).toBe('');
  });

  it('returns empty string for invalid date string', () => {
    expect(toInputDate('not-a-date')).toBe('');
  });

  it('converts a parseable date string to YYYY-MM-DD', () => {
    const result = toInputDate('Mon, Mar 20');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('toInputTime', () => {
  it('returns empty string for null', () => {
    expect(toInputTime(null)).toBe('');
  });

  it('converts "1:00 PM" to 24-hour format', () => {
    expect(toInputTime('1:00 PM')).toBe('13:00');
  });

  it('converts "12:00 PM" correctly (noon)', () => {
    expect(toInputTime('12:00 PM')).toBe('12:00');
  });

  it('converts "12:00 AM" correctly (midnight)', () => {
    expect(toInputTime('12:00 AM')).toBe('00:00');
  });

  it('converts "9:30 AM" correctly', () => {
    expect(toInputTime('9:30 AM')).toBe('09:30');
  });

  it('converts "11:45 PM" correctly', () => {
    expect(toInputTime('11:45 PM')).toBe('23:45');
  });

  it('returns original string if format does not match', () => {
    expect(toInputTime('14:30')).toBe('14:30');
  });
});

describe('formatDisplayDate', () => {
  it('returns null for empty string', () => {
    expect(formatDisplayDate('')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(formatDisplayDate(null)).toBeNull();
  });

  it('formats a YYYY-MM-DD to a readable string', () => {
    const result = formatDisplayDate('2025-12-25');
    expect(result).toContain('Dec');
    expect(result).toContain('25');
  });
});

describe('formatDisplayTime', () => {
  it('returns null for empty string', () => {
    expect(formatDisplayTime('')).toBeNull();
  });

  it('converts "13:00" to "1:00 PM"', () => {
    expect(formatDisplayTime('13:00')).toBe('1:00 PM');
  });

  it('converts "09:30" to "9:30 AM"', () => {
    expect(formatDisplayTime('09:30')).toBe('9:30 AM');
  });

  it('converts "00:00" to "12:00 AM"', () => {
    expect(formatDisplayTime('00:00')).toBe('12:00 AM');
  });

  it('converts "12:00" to "12:00 PM"', () => {
    expect(formatDisplayTime('12:00')).toBe('12:00 PM');
  });

  it('converts "23:59" to "11:59 PM"', () => {
    expect(formatDisplayTime('23:59')).toBe('11:59 PM');
  });
});

describe('makeId', () => {
  it('starts with given prefix', () => {
    const id = makeId('P');
    expect(id.startsWith('P')).toBe(true);
  });

  it('is followed by 5 digits', () => {
    const id = makeId('O');
    expect(id.slice(1)).toMatch(/^\d{5}$/);
  });

  it('generates unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => makeId('X')));
    expect(ids.size).toBeGreaterThan(1);
  });
});
