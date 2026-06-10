import { useState, useEffect } from 'react';
import { PageName, SendRequestFormFields, PaymentMethod, ValidationErrors } from '../../../types/types.ts';
import { TREATMENT_CATEGORIES, INSURANCE_PROVIDERS } from '../../../data/constants';
import { CityPicker } from '../../shared/CityPicker';
import { useToast } from '../../../hooks/useToast';
import { api, AUTH_COOKIE } from '../../../services/api';
import { getCookie } from '../../../tracking/cookies';
import { Toast } from '../../shared/Toast';
import { Button } from '../../shared/Button';
// @ts-ignore
import styles from './SendRequestPage.module.css';
import { BlobBackground } from '../../shared/BlobBackground';

interface SendRequestPageProps {
    setPage: (page: PageName) => void;
}

const EMPTY_FORM: SendRequestFormFields = {
    firstName: '',
    lastName: '',
    location: '',
    availableFrom: '',
    availableTo: '',
    phone: '',
    email: '',
    treatmentCategory: '',
    treatmentRequirement: '',
    ctScan: null,
    symptomSummary: '',
    paymentMethod: 'Self-Pay',

    insuranceProvider: 'None',
};

function validate(form: SendRequestFormFields): ValidationErrors {
    const errors: ValidationErrors = {};
    if (!form.firstName.trim())            errors.firstName            = 'First name is required';
    if (!form.lastName.trim())             errors.lastName             = 'Last name is required';
    if (!form.location.trim())             errors.location             = 'Location is required';
    if (!form.availableFrom)               errors.availableFrom        = 'Arrival date is required';
    if (!form.availableTo)                 errors.availableTo          = 'Departure date is required';
    else if (form.availableFrom && form.availableTo && form.availableTo < form.availableFrom)
                                           errors.availableTo          = 'Departure must be after arrival';
    if (!form.phone.trim())                errors.phone                = 'Phone is required';
    if (!form.email.trim())                errors.email                = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email           = 'Invalid email address';
    if (!form.treatmentCategory)           errors.treatmentCategory    = 'Please select a category';
    if (!form.treatmentRequirement.trim()) errors.treatmentRequirement = 'Treatment requirement is required';
    if (!form.symptomSummary.trim())       errors.symptomSummary       = 'Symptom summary is required';

    return errors;
}

const SPECIALTY_MAP: Record<string, string> = {
    'Cosmetic Dentistry':  'COSMETIC_DENTISTRY',
    'Implant Dentistry':   'IMPLANTS',
    'Pediatric Dentistry': 'PEDIATRIC_DENTISTRY',
    'General Dentistry':   'GENERAL_DENTISTRY',
    'Orthodontics':        'ORTHODONTICS',
    'Emergency Dentistry': 'ORAL_SURGERY',
};


export function SendRequestPage({ setPage }: SendRequestPageProps) {
    const [form,       setForm]       = useState<SendRequestFormFields>(EMPTY_FORM);
    const [errors,     setErrors]     = useState<ValidationErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const { toast, show: showToast }  = useToast();

    useEffect(() => {
        const stored = getCookie(AUTH_COOKIE);
        if (!stored) return;
        const user = JSON.parse(stored);
        if (!user?.id) return;
        api.get(`/auth/user/${user.id}`).then((res) => {
            const city: string | undefined = res.data?.city;
            if (city) setForm((prev) => ({ ...prev, location: city }));
        }).catch(() => {});
    }, []);

    function handleChange(field: keyof SendRequestFormFields, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field as keyof ValidationErrors]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    }

    async function handleSubmit() {
        const errs = validate(form);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            showToast('Please fix the errors below.', 'error');
            return;
        }
        const user = JSON.parse(getCookie(AUTH_COOKIE) || '{}');
        if (!user?.id) {
            showToast('You must be logged in to submit a request.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const description = `${form.treatmentRequirement}. ${form.symptomSummary}`.trim();
            await api.post('/requests', {
                patientPublicId: user.id,
                specialty:       SPECIALTY_MAP[form.treatmentCategory] || 'GENERAL_DENTISTRY',
                description,
                preferredCity:   form.location,

                availableFrom:   form.availableFrom,
                availableTo:     form.availableTo,
            });
            showToast('Request submitted! Clinics will respond shortly.', 'success');
            setTimeout(() => setPage('my-offers'), 1800);
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to submit. Please try again.';
            showToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className={styles.wrap}>
            <BlobBackground/>
            <div className={styles.container}>
                {/* ── Page Header ── */}
                <div className={styles.pageHead}>
                    <h1 className={styles.title}>Send a Dental Request</h1>
                    <p className={styles.subtitle}>
                        Fill in your details and let verified clinics compete for your care.
                        Your identity stays anonymous until you accept an offer.
                    </p>
                </div>

                {/* ── Section 1: Personal Information ── */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionNum}>1</div>
                        <div>
                            <h2 className={styles.sectionTitle}>Personal Information</h2>
                            <p className={styles.sectionSub}>Basic contact details for your appointment</p>
                        </div>
                    </div>

                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label>First Name <span className={styles.required}>*</span></label>
                            <input
                                type="text"
                                placeholder="e.g. Maria"
                                value={form.firstName}
                                onChange={(e) => handleChange('firstName', e.target.value)}
                                className={errors.firstName ? styles.inputError : ''}
                            />
                            {errors.firstName && <span className={styles.errorMsg}>{errors.firstName}</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Last Name <span className={styles.required}>*</span></label>
                            <input
                                type="text"
                                placeholder="e.g. Popescu"
                                value={form.lastName}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                                className={errors.lastName ? styles.inputError : ''}
                            />
                            {errors.lastName && <span className={styles.errorMsg}>{errors.lastName}</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Location <span className={styles.required}>*</span></label>
                            <CityPicker
                                value={form.location}
                                onChange={(city) => handleChange('location', city)}
                                hasError={!!errors.location}
                                placeholder="Select a city…"
                            />
                            {errors.location && <span className={styles.errorMsg}>{errors.location}</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Arriving in country <span className={styles.required}>*</span></label>
                            <input
                                type="date"
                                value={form.availableFrom}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleChange('availableFrom', e.target.value)}
                                className={errors.availableFrom ? styles.inputError : ''}
                            />
                            {errors.availableFrom && <span className={styles.errorMsg}>{errors.availableFrom}</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Leaving the country <span className={styles.required}>*</span></label>
                            <input
                                type="date"
                                value={form.availableTo}
                                min={form.availableFrom || new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleChange('availableTo', e.target.value)}
                                className={errors.availableTo ? styles.inputError : ''}
                            />
                            {errors.availableTo && <span className={styles.errorMsg}>{errors.availableTo}</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Phone <span className={styles.required}>*</span></label>
                            <input
                                type="tel"
                                placeholder="e.g. +40 712 345 678"
                                value={form.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className={errors.phone ? styles.inputError : ''}
                            />
                            {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Email <span className={styles.required}>*</span></label>
                            <input
                                type="email"
                                placeholder="e.g. maria@email.com"
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className={errors.email ? styles.inputError : ''}
                            />
                            {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
                        </div>
                    </div>
                </div>

                {/* ── Section 2: Clinical Details ── */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionNum}>2</div>
                        <div>
                            <h2 className={styles.sectionTitle}>Clinical Details</h2>
                            <p className={styles.sectionSub}>Help clinics understand your needs</p>
                        </div>
                    </div>

                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label>Treatment Category <span className={styles.required}>*</span></label>
                            <select
                                value={form.treatmentCategory}
                                onChange={(e) => handleChange('treatmentCategory', e.target.value)}
                                className={errors.treatmentCategory ? styles.inputError : ''}
                            >
                                <option value="">Select a category…</option>
                                {TREATMENT_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            {errors.treatmentCategory && <span className={styles.errorMsg}>{errors.treatmentCategory}</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Treatment Requirement <span className={styles.required}>*</span></label>
                            <input
                                type="text"
                                placeholder="e.g. Teeth whitening, molar implant…"
                                value={form.treatmentRequirement}
                                onChange={(e) => handleChange('treatmentRequirement', e.target.value)}
                                className={errors.treatmentRequirement ? styles.inputError : ''}
                            />
                            {errors.treatmentRequirement && <span className={styles.errorMsg}>{errors.treatmentRequirement}</span>}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Dental CT Scan / X-Ray</label>
                        <div className={styles.uploadBox}>
                            <span className={styles.uploadIcon}>📁</span>
                            <span className={styles.uploadText}>
                {form.ctScan ? form.ctScan : 'Click to upload or drag and drop'}
              </span>
                            <span className={styles.uploadSub}>DCM, CDM, JPG, PNG — max 50MB</span>
                            <input
                                type="file"
                                className={styles.uploadInput}
                                accept=".dcm,.cdm,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleChange('ctScan', file.name);
                                }}
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Symptom Summary <span className={styles.required}>*</span></label>
                        <textarea
                            rows={4}
                            placeholder="Describe your symptoms, pain level, and how long you've had them…"
                            value={form.symptomSummary}
                            onChange={(e) => handleChange('symptomSummary', e.target.value)}
                            className={errors.symptomSummary ? styles.inputError : ''}
                        />
                        {errors.symptomSummary && <span className={styles.errorMsg}>{errors.symptomSummary}</span>}
                    </div>
                </div>

                {/* ── Section 3: Insurance & Payment ── */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionNum}>3</div>
                        <div>
                            <h2 className={styles.sectionTitle}>Insurance &amp; Payment</h2>
                            <p className={styles.sectionSub}>How you plan to cover the treatment cost</p>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Payment Method Preference <span className={styles.required}>*</span></label>
                        <div className={styles.radioGroup}>
                            {(['Insurance', 'Self-Pay', 'Financing'] as PaymentMethod[]).map((method) => (
                                <label
                                    key={method}
                                    className={`${styles.radioCard} ${form.paymentMethod === method ? styles.radioCardActive : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={method}
                                        checked={form.paymentMethod === method}
                                        onChange={() => handleChange('paymentMethod', method)}
                                    />
                                    <span className={styles.radioLabel}>
                    {method === 'Insurance' && '🏥 Insurance'}
                                        {method === 'Self-Pay'  && '💳 Self-Pay / Out-of-Pocket'}
                                        {method === 'Financing' && '📅 Financing / Payment Plan'}
                  </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label>Insurance Provider</label>
                            <select
                                value={form.insuranceProvider}
                                onChange={(e) => handleChange('insuranceProvider', e.target.value)}
                                disabled={form.paymentMethod !== 'Insurance'}
                            >
                                {INSURANCE_PROVIDERS.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ── Submit ── */}
                <div className={styles.submitRow}>
                    <p className={styles.submitNote}>
                        🔒 Your personal details are never shared with clinics until you accept an offer.
                    </p>
                    <Button variant="cta" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Submitting…' : 'Submit Request →'}
                    </Button>
                </div>
            </div>

            <Toast toast={toast} />
        </div>
    );
}