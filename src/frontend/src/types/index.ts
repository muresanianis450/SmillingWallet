// ─── Domain Types ───────────────────────────────────────────────────────────

export type OfferStatus = 'Accepted' | 'Sent' | 'Declined' | 'Pending';

export type TreatmentCategory =
  | 'Cosmetic Dentistry'
  | 'Implant Dentistry'
  | 'Pediatric Dentistry'
  | 'General Dentistry'
  | 'Orthodontics'
  | 'Emergency Dentistry';

export type PageName = 'about' | 'requests' | 'dashboard';

export type ToastType = 'success' | 'error' | 'info';

// ─── Entity Interfaces ───────────────────────────────────────────────────────

export interface Offer {
  id: string;
  patientId: string;
  patientName: string;
  priceQuote: number;
  date: string | null;
  time: string | null;  //null means no appointment scheduled
  status: OfferStatus;  // 'Accepted' | 'Sent' | 'Declined' | 'Pending'
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

export type ValidationErrors = Partial<Record<keyof OfferFormFields | keyof SendOfferFormFields, string>>;

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
