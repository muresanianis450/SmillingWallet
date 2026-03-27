import React, { ReactNode } from 'react';
import styles from './FormField.module.css';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactElement;
}

export function FormField({ label, error, children }: FormFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-');

  return (
      <div>
        <label htmlFor={id}>{label}</label>
        {React.cloneElement(children, { id })}
        {error && <span>{error}</span>}
      </div>
  );
}
