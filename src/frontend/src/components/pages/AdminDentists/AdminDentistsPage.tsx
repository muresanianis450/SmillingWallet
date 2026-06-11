import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Icon } from '../../shared/Icon';
// @ts-ignore
import styles from './AdminDentistsPage.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Dentist {
    id: string;
    email: string;
    username: string;
    phone: string;
    city: string;
    specialty: string | null;
    accountActive: boolean;
    createdAt: string;
}

const SPECIALTIES = [
    { value: 'GENERAL_DENTISTRY',  label: 'General Dentistry' },
    { value: 'IMPLANTS',           label: 'Implants' },
    { value: 'ORTHODONTICS',       label: 'Orthodontics' },
    { value: 'COSMETIC_DENTISTRY', label: 'Cosmetic Dentistry' },
    { value: 'PEDIATRIC_DENTISTRY',label: 'Pediatric Dentistry' },
    { value: 'ORAL_SURGERY',       label: 'Oral Surgery' },
    { value: 'PERIODONTICS',       label: 'Periodontics' },
    { value: 'ENDODONTICS',        label: 'Endodontics' },
];

function formatSpecialty(raw: string | null): string {
    if (!raw) return '—';
    const found = SPECIALTIES.find(s => s.value === raw);
    return found ? found.label : raw;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

// ── Invite Modal ──────────────────────────────────────────────────────────────

interface ModalProps {
    onClose: () => void;
    onSuccess: (dentist: Dentist) => void;
}

function InviteModal({ onClose, onSuccess }: ModalProps) {
    const [form, setForm] = useState({
        clinicName: '',
        email: '',
        phone: '',
        city: '',
        address: '',
        specialty: '',
    });
    const [errors, setErrors]       = useState<Partial<typeof form>>({});
    const [globalError, setGlobalError] = useState('');
    const [loading, setLoading]     = useState(false);

    function set(field: keyof typeof form, value: string) {
        setForm(f => ({ ...f, [field]: value }));
        setErrors(e => ({ ...e, [field]: '' }));
    }

    function validate(): boolean {
        const next: Partial<typeof form> = {};
        if (!form.clinicName.trim())  next.clinicName = 'Clinic name is required';
        if (!form.email.trim())       next.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = 'Email must be valid';
        if (!form.phone.trim())       next.phone = 'Phone is required';
        if (!form.city.trim())        next.city = 'City is required';
        if (!form.specialty)          next.specialty = 'Specialty is required';
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setGlobalError('');
        try {
            const { data } = await api.post('/admin/dentists', {
                clinicName: form.clinicName.trim(),
                email:      form.email.trim(),
                phone:      form.phone.trim(),
                city:       form.city.trim(),
                address:    form.address.trim() || undefined,
                specialty:  form.specialty,
            });
            onSuccess(data);
        } catch (err: any) {
            setGlobalError(
                err.response?.data?.message ||
                'Failed to create dentist account. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close"><Icon name="close" size={18} /></button>
                <h2 className={styles.modalTitle}>Invite a Dentist</h2>
                <p className={styles.modalSubtitle}>
                    An invitation email will be sent to the clinic so they can set their password.
                </p>

                {globalError && <div className={styles.globalError}>{globalError}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    {/* Clinic Name */}
                    <div className={styles.field}>
                        <label className={styles.label}>Clinic Name *</label>
                        <input
                            className={`${styles.input} ${errors.clinicName ? styles.inputError : ''}`}
                            value={form.clinicName}
                            onChange={e => set('clinicName', e.target.value)}
                            placeholder="e.g. Bright Smile Dental Clinic"
                            autoFocus
                        />
                        {errors.clinicName && <p className={styles.errorMsg}>{errors.clinicName}</p>}
                    </div>

                    {/* Email */}
                    <div className={styles.field}>
                        <label className={styles.label}>Email Address *</label>
                        <input
                            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                            type="email"
                            value={form.email}
                            onChange={e => set('email', e.target.value)}
                            placeholder="clinic@example.com"
                        />
                        {errors.email && <p className={styles.errorMsg}>{errors.email}</p>}
                    </div>

                    {/* Phone + City */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Phone *</label>
                            <input
                                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                                value={form.phone}
                                onChange={e => set('phone', e.target.value)}
                                placeholder="+40 712 345 678"
                            />
                            {errors.phone && <p className={styles.errorMsg}>{errors.phone}</p>}
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>City *</label>
                            <input
                                className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
                                value={form.city}
                                onChange={e => set('city', e.target.value)}
                                placeholder="e.g. Bucharest"
                            />
                            {errors.city && <p className={styles.errorMsg}>{errors.city}</p>}
                        </div>
                    </div>

                    {/* Address */}
                    <div className={styles.field}>
                        <label className={styles.label}>Address</label>
                        <input
                            className={styles.input}
                            value={form.address}
                            onChange={e => set('address', e.target.value)}
                            placeholder="Street, number (optional)"
                        />
                    </div>

                    {/* Specialty */}
                    <div className={styles.field}>
                        <label className={styles.label}>Specialty *</label>
                        <select
                            className={`${styles.select} ${errors.specialty ? styles.inputError : ''}`}
                            value={form.specialty}
                            onChange={e => set('specialty', e.target.value)}
                        >
                            <option value="">Select specialty…</option>
                            {SPECIALTIES.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                        {errors.specialty && <p className={styles.errorMsg}>{errors.specialty}</p>}
                    </div>

                    <div className={styles.modalActions}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? 'Sending invite…' : <><Icon name="mail" size={16} /> Send Invitation</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AdminDentistsPage() {
    const [dentists, setDentists]   = useState<Dentist[]>([]);
    const [loading, setLoading]     = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

    useEffect(() => {
        api.get('/admin/dentists')
            .then(r => setDentists(r.data))
            .catch(() => showToast('Failed to load dentists.', false))
            .finally(() => setLoading(false));
    }, []);

    function showToast(msg: string, ok: boolean) {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 4000);
    }

    function handleInviteSuccess(dentist: Dentist) {
        setDentists(prev => [dentist, ...prev]);
        setShowModal(false);
        showToast(`Invitation sent to ${dentist.email}`, true);
    }

    return (
        <div className={styles.page}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 2000,
                    background: toast.ok ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${toast.ok ? '#6ee7b7' : '#fecaca'}`,
                    color: toast.ok ? '#065f46' : '#b91c1c',
                    borderRadius: 10, padding: '12px 18px',
                    fontFamily: 'Nunito, sans-serif', fontWeight: 700,
                    fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Manage Dentists</h1>
                    <p className={styles.subtitle}>
                        {dentists.length} dentist{dentists.length !== 1 ? 's' : ''} registered
                    </p>
                </div>
                <button className={styles.inviteBtn} onClick={() => setShowModal(true)}>
                    + Invite Dentist
                </button>
            </div>

            {/* Table */}
            <div className={styles.tableWrap}>
                {loading ? (
                    <div className={styles.empty}>Loading…</div>
                ) : dentists.length === 0 ? (
                    <div className={styles.empty}>
                        No dentist accounts yet. Invite the first one!
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Clinic Name</th>
                                <th>Email</th>
                                <th>City</th>
                                <th>Specialty</th>
                                <th>Status</th>
                                <th>Invited</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dentists.map(d => (
                                <tr key={d.id}>
                                    <td className={styles.nameCell}>{d.username}</td>
                                    <td className={styles.emailCell}>{d.email}</td>
                                    <td>{d.city || '—'}</td>
                                    <td>{formatSpecialty(d.specialty)}</td>
                                    <td>
                                        {d.accountActive ? (
                                            <span className={styles.badgeActive}>
                                                <span className={`${styles.dot} ${styles.dotGreen}`} />
                                                Active
                                            </span>
                                        ) : (
                                            <span className={styles.badgePending}>
                                                <span className={`${styles.dot} ${styles.dotOrange}`} />
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td>{formatDate(d.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Invite modal */}
            {showModal && (
                <InviteModal
                    onClose={() => setShowModal(false)}
                    onSuccess={handleInviteSuccess}
                />
            )}
        </div>
    );
}
