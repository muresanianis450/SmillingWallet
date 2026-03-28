// ─── Domain Types ───────────────────────────────────────────────────────────

export type OfferStatus = 'Accepted' | 'Sent' | 'Declined' | 'Pending';

export type TreatmentCategory =
    | 'Cosmetic Dentistry'
    | 'Implant Dentistry'
    | 'Pediatric Dentistry'
    | 'General Dentistry'
    | 'Orthodontics'
    | 'Emergency Dentistry';

export type PageName =
    | 'home'
    | 'send-request'
    | 'my-offers'
    | 'appointments'
    | 'about'
    | 'requests'
    | 'dashboard';

export type ToastType = 'success' | 'error' | 'info';

export type PaymentMethod = 'Insurance' | 'Self-Pay' | 'Financing';

// ─── Entity Interfaces ───────────────────────────────────────────────────────

export interface Offer {
  id: string;
  patientId: string;
  patientName: string;
  priceQuote: number;
  date: string | null;
  time: string | null;
  status: OfferStatus;
  treatmentCategory: TreatmentCategory | string;
  treatmentReq: string;
  ctScan: string | null;
  symptoms: string;
}

export interface DentalRequest {
  id: string;
  category: TreatmentCategory | string;
  symptoms: string;
  timeSlot: string;
  ctScan: string | null;
}

// ─── Client-side types ───────────────────────────────────────────────────────

export interface ClientOffer {
  id: string;
  doctorLabel: string;       // "Dr. #1", "Dr. #2" …
  avatarSeed: string;        // for deterministic placeholder
  rating: number;            // 1–5 fractional
  reviewCount: number;
  priceMin: number;
  priceMax: number;
  exactQuote: number;
  date: string;
  time: string;
  specialMentions: string[];
  matchScore: number;        // 0–100
  savingsVsAvg: number;      // € saved vs average
  validUntil: string;        // ISO date string
  treatmentCategory: string;
  isBestValue: boolean;
}

export interface SendRequestFormFields {
  // Personal
  firstName: string;
  lastName: string;
  location: string;
  date: string;
  phone: string;
  email: string;
  // Clinical
  treatmentCategory: string;
  treatmentRequirement: string;
  ctScan: string | null;
  symptomSummary: string;
  // Insurance & Payment
  paymentMethod: PaymentMethod;
  budgetRange: string;
  insuranceProvider: string;
}

export interface ConfirmedAppointment {
  date: string;
  time: string;
  treatment: string;
  status: 'Match Confirmed';
}

export interface MatchedClinic {
  name: string;
  doctorName: string;
  rating: number;
  reviewCount: number;
  phone: string;
  email: string;
  address: string;
  procedures: string[];
  totalPrice: number;
  revealDate: string;
}

// ─── Form Field Types ────────────────────────────────────────────────────────

export interface OfferFormFields {
  patientName: string;
  priceQuote: string | number;
  date: string;
  time: string;
  status: OfferStatus | string;
  treatmentCategory: string;
  treatmentReq: string;
  symptoms: string;
  ctScan: string;
}

export interface SendOfferFormFields {
  priceQuote: string | number;
  date: string;
  time: string;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export type ValidationErrors = Partial<
    Record<keyof OfferFormFields | keyof SendOfferFormFields | keyof SendRequestFormFields, string>
>;

// ─── Modal State ─────────────────────────────────────────────────────────────

export type ModalType = 'add' | 'edit' | 'view' | 'delete';

export interface ModalState {
  type: ModalType;
  offer?: Offer;
}

// ─── Toast ───────────────────────────────────────────────────────────────────

export interface ToastState {
  msg: string;
  type: ToastType;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface OfferStats {
  total: number;
  accepted: number;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationResult<T> {
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  totalPages: number;
  slice: T[];
}