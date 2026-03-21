import { TreatmentCategory, OfferStatus, Offer, DentalRequest } from '../types';

// ─── Enums / Constant Lists ──────────────────────────────────────────────────

export const TREATMENT_CATEGORIES: TreatmentCategory[] = [
  'Cosmetic Dentistry',
  'Implant Dentistry',
  'Pediatric Dentistry',
  'General Dentistry',
  'Orthodontics',
  'Emergency Dentistry',
];

export const OFFER_STATUSES: OfferStatus[] = [
  'Accepted',
  'Sent',
  'Declined',
  'Pending',
];

// ─── Seed Data ───────────────────────────────────────────────────────────────

// TODO connect to SpringBoot API calls later
export const INITIAL_OFFERS: Offer[] = [
  {
    id: 'O000001',
    patientId: 'P000001',
    patientName: 'Anamaria Prodan',
    priceQuote: 450,
    date: 'Mon, Mar 20',
    time: '1:00 PM',
    status: 'Accepted',
    treatmentCategory: 'Cosmetic Dentistry',
    treatmentReq: 'Teeth Whitening',
    ctScan: 'Full_CT.cdm',
    symptoms:
      'My husband told me I look ugly with my yellow teeth, I need brand new ones ASAP',
  },
  {
    id: 'O000002',
    patientId: 'P000002',
    patientName: 'Florin Piersic',
    priceQuote: 450,
    date: 'Mon, Mar 20',
    time: '2:00 PM',
    status: 'Accepted',
    treatmentCategory: 'General Dentistry',
    treatmentReq: 'Full Checkup',
    ctScan: null,
    symptoms: 'Annual checkup needed, no specific issues',
  },
  {
    id: 'O000003',
    patientId: 'P00045',
    patientName: '#P00045',
    priceQuote: 450,
    date: null,
    time: null,
    status: 'Sent',
    treatmentCategory: 'Implant Dentistry',
    treatmentReq: 'Lower molar implant',
    ctScan: 'Molar_Scan.dcm',
    symptoms: 'No more molars left :(',
  },
  {
    id: 'O000004',
    patientId: 'P00021',
    patientName: '#P00021',
    priceQuote: 450,
    date: null,
    time: null,
    status: 'Sent',
    treatmentCategory: 'Pediatric Dentistry',
    treatmentReq: 'First tooth',
    ctScan: null,
    symptoms: 'First tooth extraction for child aged 6',
  },
  {
    id: 'O000006',
    patientId: 'P00041',
    patientName: '#P00041',
    priceQuote: 450,
    date: null,
    time: null,
    status: 'Declined',
    treatmentCategory: 'Orthodontics',
    treatmentReq: 'Braces consultation',
    ctScan: null,
    symptoms: 'Teeth misalignment, need braces',
  },
];
// TODO connect to SpringBoot API calls later
export const INITIAL_REQUESTS: DentalRequest[] = [
  { id: 'P10024', category: 'Cosmetic Dentistry',  symptoms: 'Too yellow teeth',          timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10025', category: 'Pediatric Dentistry', symptoms: 'First Tooth',               timeSlot: '11:06 - 11:08', ctScan: 'Molar_Scan.dcm' },
  { id: 'P10027', category: 'Implant Dentistry',   symptoms: 'No more molars left :)',     timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10028', category: 'Cosmetic Dentistry',  symptoms: 'Too yellow teeth',           timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10029', category: 'General Dentistry',   symptoms: 'Too yellow teeth',           timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10030', category: 'Orthodontics',         symptoms: 'Too yellow teeth',          timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10031', category: 'Cosmetic Dentistry',  symptoms: 'Too yellow teeth',           timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10032', category: 'Cosmetic Dentistry',  symptoms: 'Too yellow teeth',           timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10033', category: 'Emergency Dentistry', symptoms: 'Severe toothache',           timeSlot: '09:00 - 09:30', ctScan: null },
  { id: 'P10034', category: 'Implant Dentistry',   symptoms: 'Missing back molar',         timeSlot: '14:00 - 14:30', ctScan: 'CT_Full.dcm' },
  { id: 'P10035', category: 'Pediatric Dentistry', symptoms: 'Child dental check',         timeSlot: '15:00 - 15:30', ctScan: null },
];
