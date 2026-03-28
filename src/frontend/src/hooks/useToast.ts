import { useState, useCallback } from 'react';
import { ToastState, ToastType } from '../types/types.ts';

interface UseToastReturn {
  toast: ToastState | null;
  show: (msg: string, type?: ToastType) => void;
}

export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback((msg: string, type: ToastType = 'success'): void => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  return { toast, show };
}
