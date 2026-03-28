import { TreatmentCategory, OfferStatus, Offer, DentalRequest, ClientOffer, ConfirmedAppointment, MatchedClinic } from '../types';

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

export const BUDGET_RANGES = [
  'Under €500',
  '€500 – €1,000',
  '€1,000 – €2,500',
  '€2,500 – €5,000',
  'Over €5,000',
];

export const INSURANCE_PROVIDERS = [
  'None',
  'Allianz',
  'AXA',
  'Signal Iduna',
  'Generali',
  'UNIQA',
  'Omniasig',
  'Other',
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
    symptoms: 'My husband told me I look ugly with my yellow teeth, I need brand new ones ASAP',
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
  { id: 'P10024', category: 'Cosmetic Dentistry',  symptoms: 'Too yellow teeth',        timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10025', category: 'Pediatric Dentistry', symptoms: 'First Tooth',             timeSlot: '11:06 - 11:08', ctScan: 'Molar_Scan.dcm' },
  { id: 'P10027', category: 'Implant Dentistry',   symptoms: 'No more molars left :)',  timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10028', category: 'Cosmetic Dentistry',  symptoms: 'Too yellow teeth',        timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10029', category: 'General Dentistry',   symptoms: 'Too yellow teeth',        timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10030', category: 'Orthodontics',        symptoms: 'Too yellow teeth',        timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10031', category: 'Cosmetic Dentistry',  symptoms: 'Too yellow teeth',        timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10032', category: 'Cosmetic Dentistry',  symptoms: 'Too yellow teeth',        timeSlot: '10:05 - 10:06', ctScan: null },
  { id: 'P10033', category: 'Emergency Dentistry', symptoms: 'Severe toothache',        timeSlot: '09:00 - 09:30', ctScan: null },
  { id: 'P10034', category: 'Implant Dentistry',   symptoms: 'Missing back molar',      timeSlot: '14:00 - 14:30', ctScan: 'CT_Full.dcm' },
  { id: 'P10035', category: 'Pediatric Dentistry', symptoms: 'Child dental check',      timeSlot: '15:00 - 15:30', ctScan: null },
];

// ─── Client Mock Data ─────────────────────────────────────────────────────────

// TODO connect to SpringBoot API calls later
export const MOCK_CLIENT_OFFERS: ClientOffer[] = [
  {
    id: 'CO001',
    doctorLabel: 'Dr. #1',
    avatarSeed: 'alpha',
    rating: 4.8,
    reviewCount: 212,
    priceMin: 380,
    priceMax: 460,
    exactQuote: 410,
    date: 'Tue, Apr 8',
    time: '10:00 AM',
    specialMentions: ['Free follow-up included', 'Same-day X-ray', 'Parking available'],
    matchScore: 94,
    savingsVsAvg: 65,
    validUntil: '2025-04-15',
    treatmentCategory: 'Cosmetic Dentistry',
    isBestValue: true,
  },
  {
    id: 'CO002',
    doctorLabel: 'Dr. #2',
    avatarSeed: 'beta',
    rating: 4.5,
    reviewCount: 178,
    priceMin: 420,
    priceMax: 510,
    exactQuote: 475,
    date: 'Wed, Apr 9',
    time: '2:00 PM',
    specialMentions: ['Modern equipment', 'English-speaking staff'],
    matchScore: 81,
    savingsVsAvg: 0,
    validUntil: '2025-04-16',
    treatmentCategory: 'Cosmetic Dentistry',
    isBestValue: false,
  },
  {
    id: 'CO003',
    doctorLabel: 'Dr. #3',
    avatarSeed: 'gamma',
    rating: 4.2,
    reviewCount: 94,
    priceMin: 350,
    priceMax: 430,
    exactQuote: 390,
    date: 'Thu, Apr 10',
    time: '9:00 AM',
    specialMentions: ['Weekend slots available'],
    matchScore: 76,
    savingsVsAvg: 85,
    validUntil: '2025-04-17',
    treatmentCategory: 'Cosmetic Dentistry',
    isBestValue: false,
  },
  {
    id: 'CO004',
    doctorLabel: 'Dr. #4',
    avatarSeed: 'delta',
    rating: 3.9,
    reviewCount: 61,
    priceMin: 500,
    priceMax: 590,
    exactQuote: 540,
    date: 'Fri, Apr 11',
    time: '11:30 AM',
    specialMentions: ['Senior specialist', 'University-affiliated'],
    matchScore: 68,
    savingsVsAvg: -65,
    validUntil: '2025-04-18',
    treatmentCategory: 'Cosmetic Dentistry',
    isBestValue: false,
  },
  {
    id: 'CO005',
    doctorLabel: 'Dr. #5',
    avatarSeed: 'epsilon',
    rating: 4.6,
    reviewCount: 145,
    priceMin: 395,
    priceMax: 480,
    exactQuote: 440,
    date: 'Mon, Apr 14',
    time: '3:00 PM',
    specialMentions: ['Sedation available', 'Child-friendly', 'Free consultation'],
    matchScore: 88,
    savingsVsAvg: 35,
    validUntil: '2025-04-19',
    treatmentCategory: 'Cosmetic Dentistry',
    isBestValue: false,
  },
];

// TODO connect to SpringBoot API calls later
export const MOCK_CONFIRMED_APPOINTMENTS: ConfirmedAppointment[] = [
  {
    date: 'Tue, Apr 8',
    time: '10:00 AM',
    treatment: 'Teeth Whitening',
    status: 'Match Confirmed',
  },
];

// TODO connect to SpringBoot API calls later
export const MOCK_MATCHED_CLINIC: MatchedClinic = {
  name: 'DentaSmile Clinic Cluj',
  doctorName: 'Dr. Andrei Ionescu',
  rating: 4.8,
  reviewCount: 212,
  phone: '+40 264 123 456',
  email: 'contact@dentasmile.ro',
  address: 'Str. Avram Iancu 22, Cluj-Napoca, Romania',
  procedures: ['Teeth Whitening', 'Follow-up Polishing'],
  totalPrice: 410,
  revealDate: 'Apr 7, 2025 – 14:32',
};