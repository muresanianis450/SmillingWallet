import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../hooks/usePagination';

const items = Array.from({ length: 11 }, (_, i) => i + 1); // [1..11]

describe('usePagination', () => {
  it('returns first page slice correctly', () => {
    const { result } = renderHook(() => usePagination(items, 5));
    expect(result.current.slice).toEqual([1, 2, 3, 4, 5]);
  });

  it('calculates totalPages correctly', () => {
    const { result } = renderHook(() => usePagination(items, 5));
    expect(result.current.totalPages).toBe(3);
  });

  it('starts on page 1', () => {
    const { result } = renderHook(() => usePagination(items, 5));
    expect(result.current.page).toBe(1);
  });

  it('navigates to page 2 and returns correct slice', () => {
    const { result } = renderHook(() => usePagination(items, 5));
    act(() => { result.current.setPage(2); });
    expect(result.current.slice).toEqual([6, 7, 8, 9, 10]);
  });

  it('returns partial last page', () => {
    const { result } = renderHook(() => usePagination(items, 5));
    act(() => { result.current.setPage(3); });
    expect(result.current.slice).toEqual([11]);
  });

  it('handles empty list — totalPages is 1', () => {
    const { result } = renderHook(() => usePagination([], 5));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.slice).toHaveLength(0);
  });

  it('single page when items <= perPage', () => {
    const { result } = renderHook(() => usePagination([1, 2, 3], 5));
    expect(result.current.totalPages).toBe(1);
  });

  it('perPage=1 gives N pages for N items', () => {
    const { result } = renderHook(() => usePagination(items, 1));
    expect(result.current.totalPages).toBe(11);
  });

  it('supports functional setPage updater', () => {
    const { result } = renderHook(() => usePagination(items, 5));
    act(() => { result.current.setPage((p) => p + 1); });
    expect(result.current.page).toBe(2);
  });

  it('clamps page within totalPages when items list shrinks', () => {
    const { result, rerender } = renderHook(
      ({ list }) => usePagination(list, 5),
      { initialProps: { list: items } }
    );
    act(() => { result.current.setPage(3); });
    expect(result.current.page).toBe(3);
    // Shrink list so page 3 no longer exists
    rerender({ list: [1, 2, 3] });
    expect(result.current.page).toBe(1);
  });
});
