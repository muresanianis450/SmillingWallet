import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
// @ts-ignore
import styles from './Input.module.css';

// ─── Text / Number / Date / Time Input ───────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ hasError, className, ...rest }: InputProps) {
  return (
    <input
      className={`${styles.input} ${hasError ? styles.error : ''} ${className ?? ''}`}
      {...rest}
    />
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export function Select({ hasError, children, className, ...rest }: SelectProps) {
  return (
    <select
      className={`${styles.input} ${hasError ? styles.error : ''} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </select>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function Textarea({ hasError, className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={`${styles.input} ${styles.textarea} ${hasError ? styles.error : ''} ${className ?? ''}`}
      {...rest}
    />
  );
}

// ─── Price Input with € prefix ───────────────────────────────────────────────

interface PriceInputProps {
  value: string | number;
  onChange: (val: string) => void;
  hasError?: boolean;
  placeholder?: string;
}

export function PriceInput({ value, onChange, hasError, placeholder = '€—' }: PriceInputProps) {
  return (
      <div className={`${styles.prefix} ${hasError ? styles.error : ''}`}>
        <span className={styles.prefixIcon}>€</span>
        <input
            data-testid="price-input"
            className={styles.prefixInput}
            type="number"
            min={1}
            max={99999}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
      </div>
  );
}
