// ─── Date / Time Formatters ──────────────────────────────────────────────────

/** Converts a display date string (e.g. "Mon, Mar 20") to an input[type=date] value */
export function toInputDate(str: string | null | undefined): string {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/** Converts a display time string (e.g. "1:00 PM") to an input[type=time] value */
export function toInputTime(str: string | null | undefined): string {
  if (!str) return '';
  const match = str.match(/(\d+):(\d+)\s?(AM|PM)/i);
  if (!match) return str;
  let h = parseInt(match[1], 10);
  const m = match[2].padStart(2, '0');
  if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

/** Converts an input[type=date] value to a readable display string */
export function formatDisplayDate(str: string | null | undefined): string | null {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Converts an input[type=time] value (HH:MM) to a readable display string */
export function formatDisplayTime(str: string | null | undefined): string | null {
  if (!str) return null;
  const [h, m] = str.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Generates a random ID with a given prefix */
export function makeId(prefix: string): string {
  return prefix + String(Math.floor(Math.random() * 90000) + 10000);
}
