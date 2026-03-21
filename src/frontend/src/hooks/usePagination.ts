import { useState, useEffect } from 'react';
import { PaginationResult } from '../types';

export function usePagination<T>(
  items: T[],
  perPage: number = 5
): PaginationResult<T> {
  const [page, setPage] = useState<number>(1);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages);
  const slice = items.slice((safePage - 1) * perPage, safePage * perPage);

  // Reset to last valid page when items shrink
  useEffect(() => {
    if (page > totalPages) setPage(totalPages || 1);
  }, [items.length, totalPages]);

  return { page: safePage, setPage, totalPages, slice };
}
