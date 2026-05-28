import { useState, useRef, useEffect, forwardRef } from 'react';
import { ROMANIAN_CITIES } from '../../data/constants';
// @ts-ignore
import styles from './CityPicker.module.css';

interface CityPickerProps {
  value: string;
  onChange: (city: string) => void;
  className?: string;
  placeholder?: string;
  hasError?: boolean;
}

export const CityPicker = forwardRef<HTMLInputElement, CityPickerProps>(
  function CityPicker({ value, onChange, className, placeholder = 'Select a city…', hasError }, ref) {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState(value);
    const containerRef      = useRef<HTMLDivElement>(null);

    const filtered = query.trim()
      ? ROMANIAN_CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase()))
      : ROMANIAN_CITIES;

    useEffect(() => { setQuery(value); }, [value]);

    useEffect(() => {
      function onMouseDown(e: MouseEvent) {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false);
          setQuery(value);
        }
      }
      document.addEventListener('mousedown', onMouseDown);
      return () => document.removeEventListener('mousedown', onMouseDown);
    }, [value]);

    return (
      <div ref={containerRef} className={styles.wrap}>
        <input
          ref={ref}
          type="text"
          value={query}
          placeholder={placeholder}
          className={`${styles.input} ${hasError ? styles.error : ''} ${className ?? ''}`}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        <span className={styles.arrow} onClick={() => setOpen(o => !o)}>▾</span>
        {open && filtered.length > 0 && (
          <ul className={styles.list}>
            {filtered.map(city => (
              <li
                key={city}
                className={`${styles.item} ${city === value ? styles.selected : ''}`}
                onMouseDown={() => { onChange(city); setQuery(city); setOpen(false); }}
              >
                {city}
              </li>
            ))}
          </ul>
        )}
        {open && filtered.length === 0 && (
          <div className={styles.empty}>No cities match</div>
        )}
      </div>
    );
  }
);
