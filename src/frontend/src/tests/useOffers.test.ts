import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOffers } from '../hooks/useOffers';
import { Offer } from '../types/types.ts';

const SEED: Offer[] = [
  {
    id: 'O001',
    patientId: 'P001',
    patientName: 'Alice',
    priceQuote: 300,
    date: 'Mon, Mar 20',
    time: '1:00 PM',
    status: 'Sent',
    treatmentCategory: 'General Dentistry',
    treatmentReq: 'Checkup',
    ctScan: null,
    symptoms: 'Routine',
  },
  {
    id: 'O002',
    patientId: 'P002',
    patientName: 'Bob',
    priceQuote: 500,
    date: null,
    time: null,
    status: 'Accepted',
    treatmentCategory: 'Implant Dentistry',
    treatmentReq: 'Implant',
    ctScan: 'scan.dcm',
    symptoms: 'Missing tooth',
  },
];

describe('useOffers — initial state', () => {
  it('initialises with provided offers', () => {
    const { result } = renderHook(() => useOffers(SEED));
    expect(result.current.offers).toHaveLength(2);
  });

  it('stats total equals seed length', () => {
    const { result } = renderHook(() => useOffers(SEED));
    expect(result.current.stats.total).toBe(2);
  });

  it('stats accepted counts correctly', () => {
    const { result } = renderHook(() => useOffers(SEED));
    expect(result.current.stats.accepted).toBe(1);
  });
});

describe('useOffers — addOffer', () => {
  it('increases total by 1', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => { result.current.addOffer({ priceQuote: 200, status: 'Sent' }); });
    expect(result.current.offers).toHaveLength(3);
  });

  it('prepends the new offer at index 0', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => { result.current.addOffer({ priceQuote: 999, patientName: 'New' }); });
    expect(result.current.offers[0].patientName).toBe('New');
  });

  it('parses priceQuote string as float', () => {
    const { result } = renderHook(() => useOffers([]));
    act(() => { result.current.addOffer({ priceQuote: '350.50' }); });
    expect(result.current.offers[0].priceQuote).toBe(350.5);
  });

  it('defaults status to "Sent" when not provided', () => {
    const { result } = renderHook(() => useOffers([]));
    act(() => { result.current.addOffer({ priceQuote: 100 }); });
    expect(result.current.offers[0].status).toBe('Sent');
  });

  it('preserves provided status', () => {
    const { result } = renderHook(() => useOffers([]));
    act(() => { result.current.addOffer({ priceQuote: 100, status: 'Accepted' }); });
    expect(result.current.offers[0].status).toBe('Accepted');
  });

  it('sets null date when not provided', () => {
    const { result } = renderHook(() => useOffers([]));
    act(() => { result.current.addOffer({ priceQuote: 100 }); });
    expect(result.current.offers[0].date).toBeNull();
  });

  it('generates unique ids for each call', () => {
    const { result } = renderHook(() => useOffers([]));
    act(() => {
      result.current.addOffer({ priceQuote: 100 });
      result.current.addOffer({ priceQuote: 200 });
    });
    const ids = result.current.offers.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('updates stats.total after add', () => {
    const { result } = renderHook(() => useOffers([]));
    act(() => { result.current.addOffer({ priceQuote: 100, status: 'Accepted' }); });
    expect(result.current.stats.total).toBe(1);
    expect(result.current.stats.accepted).toBe(1);
  });
});

describe('useOffers — updateOffer', () => {
  it('updates priceQuote of the target offer', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => { result.current.updateOffer('O001', { priceQuote: 999, status: 'Sent' }); });
    expect(result.current.offers.find((o) => o.id === 'O001')?.priceQuote).toBe(999);
  });

  it('updates status of the target offer', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => { result.current.updateOffer('O001', { priceQuote: 300, status: 'Accepted' }); });
    expect(result.current.offers.find((o) => o.id === 'O001')?.status).toBe('Accepted');
  });

  it('does not change other offers', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => { result.current.updateOffer('O001', { priceQuote: 1, status: 'Declined' }); });
    expect(result.current.offers.find((o) => o.id === 'O002')?.priceQuote).toBe(500);
  });

  it('keeps the list length unchanged after update', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => { result.current.updateOffer('O001', { priceQuote: 200, status: 'Sent' }); });
    expect(result.current.offers).toHaveLength(2);
  });

  it('ignores update for a non-existent id', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => { result.current.updateOffer('O999', { priceQuote: 1, status: 'Sent' }); });
    expect(result.current.offers).toHaveLength(2);
    expect(result.current.offers[0].priceQuote).toBe(300);
  });
});

describe('useOffers — deleteOffer', () => {
  it('removes the offer with matching id', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => { result.current.deleteOffer('O001'); });
    expect(result.current.offers.find((o) => o.id === 'O001')).toBeUndefined();
  });

  it('decreases list length by 1', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => { result.current.deleteOffer('O001'); });
    expect(result.current.offers).toHaveLength(1);
  });

  it('leaves other offers intact', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => { result.current.deleteOffer('O001'); });
    expect(result.current.offers[0].id).toBe('O002');
  });

  it('handles deletion of non-existent id gracefully', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => { result.current.deleteOffer('O999'); });
    expect(result.current.offers).toHaveLength(2);
  });

  it('can delete all offers', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => {
      result.current.deleteOffer('O001');
      result.current.deleteOffer('O002');
    });
    expect(result.current.offers).toHaveLength(0);
  });

  it('updates stats after deletion', () => {
    const { result } = renderHook(() => useOffers(SEED));
    act(() => { result.current.deleteOffer('O002'); }); // was Accepted
    expect(result.current.stats.accepted).toBe(0);
    expect(result.current.stats.total).toBe(1);
  });
});

describe('useOffers — stats', () => {
  it('accepted is 0 when none have Accepted status', () => {
    const none: Offer[] = SEED.map((o) => ({ ...o, status: 'Sent' as const }));
    const { result } = renderHook(() => useOffers(none));
    expect(result.current.stats.accepted).toBe(0);
  });

  it('accepted counts all Accepted offers', () => {
    const all: Offer[] = SEED.map((o) => ({ ...o, status: 'Accepted' as const }));
    const { result } = renderHook(() => useOffers(all));
    expect(result.current.stats.accepted).toBe(2);
  });
});
