import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'cta';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
