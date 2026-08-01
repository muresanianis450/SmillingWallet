// ─── Domain Types ───────────────────────────────────────────────────────────

export type OfferStatus = 'Accepted' | 'Sent' | 'Declined' | 'Pending';
export type Role = 'PATIENT' | 'DENTIST' | 'ADMIN';

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
    | 'dashboard'
    | 'login'
    | 'register'
    | 'forgot-password'
    | 'reset-password'
    | 'activate'
    | 'join-clinic'
    | 'admin-clinics'
    | 'profile';

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
  token: string;
  refreshToken: string;
  profilePicture?: string | null;
  twoFactorEnabled?: boolean;
  emailRemindersEnabled?: boolean;
  profileCompletionPct?: number;
  missingFields?: string[];
}

export type ToastType = 'success' | 'error' | 'info';

export type PaymentMethod = 'Insurance' | 'Self-Pay' | 'Financing';

// ─── Entity Interfaces ───────────────────────────────────────────────────────

/** A contiguous block of days a dentist proposes for a treatment (day-only, no time). */
export interface DateVariation {
  startDate: string;   // ISO date (yyyy-MM-dd)
  endDate: string;     // ISO date (yyyy-MM-dd)
}

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
  procedureDays?: number;
  variations?: DateVariation[];
}
export interface DentalRequest {
  id: string;
  patientPublicId: string;
  specialty: string;
  description: string;
  preferredCities: string[];

  status: string;
  createdAt: string;
  patientProfilePicture?: string | null;
  availableFrom?: string | null;
  availableTo?: string | null;
}

// ─── Client-side types ───────────────────────────────────────────────────────

export interface ClientOffer {
  avatar?: string;   // optional — generated at runtime from avatarSeed when not provided
  id: string;
  doctorLabel: string;       // "Dr. #1", "Dr. #2" …
  city: string;              // clinic (dentist) city
  specialty: string;         // clinic (dentist) specialty, display label
  avatarSeed: string;        // for deterministic placeholder
  rating: number;            // 1–5 fractional
  reviewCount: number;
  exactQuote: number;
  date: string;
  time: string;
  specialMentions: string[];
  matchScore: number;        // 0–100
  savingsVsAvg: number;      // € saved vs average
  validUntil: string;        // ISO date string
  treatmentCategory: string;
  isBestValue: boolean;
  procedureDays: number;          // how many days the treatment takes
  variations: DateVariation[];    // 1–2 date-range options from the dentist
  offerStatus: string;
}

export interface SendRequestFormFields {
  // Personal
  firstName: string;
  lastName: string;
  cities: string[];
  availableFrom: string;
  availableTo: string;
  phone: string;
  email: string;
  // Clinical
  treatmentCategory: string;
  treatmentRequirement: string;
  ctScan: File | null;
  symptomSummary: string;
  // Insurance & Payment
  paymentMethod: PaymentMethod;

  insuranceProvider: string;
}

/** An attachment (CT scan / X-ray) on a dental request, as returned by the API. */
export interface RequestFile {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  previewable: boolean;
  url: string;
  createdAt: string;
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
  procedureDays: string | number;
  notes: string;
  variant1Start: string;
  variant1End: string;
  variant2Start: string;
  variant2End: string;
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