import { useState, useCallback, useMemo } from 'react';
import { Offer, OfferFormFields, OfferStats } from '../types/types.ts';
import { makeId } from '../utils/formatters';

interface UseOffersReturn {
  offers: Offer[];
  addOffer: (fields: Partial<OfferFormFields> & { patientId?: string }) => Offer;
  updateOffer: (id: string, fields: Partial<OfferFormFields>) => void;
  deleteOffer: (id: string) => void;
  stats: OfferStats;
}

export function useOffers(initial: Offer[]): UseOffersReturn {
  const [offers, setOffers] = useState<Offer[]>(initial);

  const addOffer = useCallback(
    (fields: Partial<OfferFormFields> & { patientId?: string; patientName?: string; status?: string; date?: string | null; time?: string | null; treatmentCategory?: string; treatmentReq?: string; ctScan?: string | null; symptoms?: string }): Offer => {
      const newOffer: Offer = {
        id: 'O' + String(Math.floor(Math.random() * 900000) + 100000),
        patientId: fields.patientId ?? makeId('P'),
        patientName: fields.patientName || '#' + makeId('P'),
        priceQuote: parseFloat(String(fields.priceQuote)),
        date: fields.date ?? null,
        time: fields.time ?? null,
        status: (fields.status as Offer['status']) ?? 'Sent',
        treatmentCategory: fields.treatmentCategory ?? '',
        treatmentReq: fields.treatmentReq ?? '',
        ctScan: fields.ctScan ?? null,
        symptoms: fields.symptoms ?? '',
      };
      setOffers((prev) => [newOffer, ...prev]);
      return newOffer;
    },
    []
  );

    const updateOffer = useCallback(
        (id: string, fields: Partial<OfferFormFields>): void => {
            setOffers((prev) =>
                prev.map((o): Offer => { // 1. Explicitly return the 'Offer' type here
                    if (o.id !== id) return o;

                    // 2. Calculate the new price separately to ensure it's a number
                    let newPrice: number = o.priceQuote;
                    if (fields.priceQuote !== undefined) {
                        const parsed = parseFloat(String(fields.priceQuote));
                        newPrice = isNaN(parsed) ? o.priceQuote : parsed;
                    }

                    // 3. Construct the updated object
                    return {
                        ...o,
                        ...fields,
                        priceQuote: newPrice, // This overrides any 'string' from ...fields
                    } as Offer; // 4. Type assertion to guarantee compatibility
                })
            );
        },
        []
    );

  const deleteOffer = useCallback((id: string): void => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const stats = useMemo<OfferStats>(
    () => ({
      total: offers.length,
      accepted: offers.filter((o) => o.status === 'Accepted').length,
    }),
    [offers]
  );

  return { offers, addOffer, updateOffer, deleteOffer, stats };
}
