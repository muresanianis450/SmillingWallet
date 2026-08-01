import {useEffect, useState} from 'react';
import {PageName} from '../../../types/types.ts';
import {api, AUTH_COOKIE} from '../../../services/api';
import {DEFAULT_AVATAR} from '../../../assets/avatars';
import {getCookie} from '../../../tracking/cookies';
import {Icon} from '../../shared/Icon';
import styles from './AppointmentsPage.module.css';

interface AppointmentsPageProps {
    setPage: (page: PageName) => void;
}

interface AppointmentDTO {
    id: string;
    startDate: string;
    endDate: string;
    confirmedPrice: number;
    status: string;
    dentistPublicId: string;
}

interface ClinicInfo {
    name: string;
    doctorName: string;
    rating: number;
    phone: string;
    email: string;
    address: string;
    specialty: string;
    profilePicture?: string | null;
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span
                    key={n}
                    className={n <= Math.round(rating) ? styles.starFilled : styles.starEmpty}
                    style={{ display: 'inline-flex' }}
                >
                    <Icon name="star" size={14} fill={n <= Math.round(rating) ? 'currentColor' : 'none'} />
                </span>
            ))}
            <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
        </div>
    );
}

function formatDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Builds a "Add to Google Calendar" template URL for an appointment.
 * Uses an all-day event spanning the treatment interval (Google's end date
 * is exclusive, so we add one day).
 */
function googleCalendarUrl(appt: AppointmentDTO, clinic: ClinicInfo) {
    const compact = (iso: string) => iso.replace(/-/g, '');
    const endExclusive = new Date(appt.endDate + 'T00:00:00');
    endExclusive.setDate(endExclusive.getDate() + 1);
    const endStr = `${endExclusive.getFullYear()}${String(endExclusive.getMonth() + 1).padStart(2, '0')}${String(endExclusive.getDate()).padStart(2, '0')}`;

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `Dental Treatment — ${clinic.name}`,
        dates: `${compact(appt.startDate)}/${endStr}`,
        details: `Treatment with ${clinic.doctorName}. Confirmed price: €${appt.confirmedPrice?.toFixed(2)}. Exact times are arranged with the clinic by phone (${clinic.phone}).`,
        location: clinic.address,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const UNKNOWN_CLINIC: ClinicInfo = {
    name: 'Unknown', doctorName: 'Unknown', rating: 0, phone: 'N/A', email: 'N/A', address: 'N/A', specialty: '',
};

export function AppointmentsPage(_props: AppointmentsPageProps) {
    const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
    // Clinic details keyed by dentistPublicId — appointments may span several clinics.
    const [clinics, setClinics] = useState<Record<string, ClinicInfo>>({});
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(getCookie(AUTH_COOKIE) || '{}');

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        api.get(`/dashboard/patient/${user.id}`)
            .then(async (res) => {
                const appts: AppointmentDTO[] = res.data.appointments || [];
                setAppointments(appts);
                setSelectedId(appts[0]?.id ?? null);

                // Fetch clinic details for every distinct dentist across appointments.
                const dentistIds = [...new Set(appts.map((a) => a.dentistPublicId))];
                const entries = await Promise.all(
                    dentistIds.map(async (id) => {
                        try {
                            const d = (await api.get(`/auth/user/${id}`)).data;
                            return [id, {
                                name: d.username,
                                doctorName: d.username,
                                rating: d.rating ?? 0,
                                phone: d.phone || 'N/A',
                                email: d.email || 'N/A',
                                address: d.address || d.city || 'N/A',
                                specialty: (d.specialties ?? []).join(', '),
                                profilePicture: d.profilePicture || null,
                            } as ClinicInfo] as const;
                        } catch {
                            return [id, UNKNOWN_CLINIC] as const;
                        }
                    })
                );
                setClinics(Object.fromEntries(entries));
            })
            .catch(() => { setAppointments([]); setClinics({}); })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className={styles.wrap}>Loading...</div>;

    const selectedAppt = appointments.find((a) => a.id === selectedId) ?? null;
    const clinic = selectedAppt ? clinics[selectedAppt.dentistPublicId] ?? null : null;
    const hasAppointments = appointments.length > 0;
    const multipleClinics = new Set(appointments.map((a) => a.dentistPublicId)).size > 1;

    return (
        <div className={styles.wrap}>
            <div className={styles.hero}>
                <div className={styles.heroIcon}>{hasAppointments ? <Icon name="celebrate" size={44} /> : <Icon name="clipboard" size={44} />}</div>
                <h1 className={styles.heroTitle}>{hasAppointments ? 'Congratulations!' : 'My Appointments'}</h1>
                <p className={styles.heroSub}>
                    {hasAppointments ? 'Your Perfect Smile is on its way.' : 'No appointments yet. Accept an offer to get started.'}
                </p>
                {clinic && (
                    <div className={styles.clinicReveal}>
                        <span className={styles.clinicRevealLabel}>Selected Clinic</span>
                        <span className={styles.clinicRevealName}>{clinic.name}</span>
                    </div>
                )}
            </div>

            <div className={styles.content}>
                {/* APPOINTMENTS */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Confirmed Appointments</h2>
                    {multipleClinics && (
                        <p className={styles.selectHint}>Select an appointment to view that clinic's details below.</p>
                    )}
                    <div className={styles.tableCard}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Clinic</th>
                                <th>Treatment Dates</th>
                                <th>Days</th>
                                <th>Price</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>No appointments yet</td>
                                </tr>
                            ) : (
                                appointments.map((apt) => {
                                    const days = Math.round(
                                        (new Date(apt.endDate + 'T00:00:00').getTime() - new Date(apt.startDate + 'T00:00:00').getTime())
                                        / 86400000) + 1;
                                    const isSelected = apt.id === selectedId;
                                    return (
                                    <tr
                                        key={apt.id}
                                        className={`${styles.row} ${isSelected ? styles.rowActive : ''}`}
                                        onClick={() => setSelectedId(apt.id)}
                                        aria-selected={isSelected}
                                    >
                                        <td>{clinics[apt.dentistPublicId]?.name ?? '—'}</td>
                                        <td>{formatDate(apt.startDate)} → {formatDate(apt.endDate)}</td>
                                        <td>{days} day{days !== 1 ? 's' : ''}</td>
                                        <td>€{apt.confirmedPrice?.toFixed(2)}</td>
                                        <td>
                                                <span className={styles.statusBadge}>
                                                    <Icon name="check" size={14} /> {apt.status}
                                                </span>
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* TEAM + CONTACT */}
                {clinic && (
                <div className={styles.twoCol}>
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Your Dental Team</h2>
                        <div className={styles.card}>
                            <div className={styles.doctorRow}>
                                <img
                                    src={clinic.profilePicture || DEFAULT_AVATAR}
                                    alt={clinic.doctorName}
                                    className={styles.doctorAvatar}
                                />
                                <div>
                                    <div className={styles.doctorName}>
                                        {clinic.doctorName}
                                    </div>
                                    {clinic.specialty && (
                                        <div className={styles.reviewCount}>
                                            {clinic.specialty}
                                        </div>
                                    )}
                                    <StarRating rating={clinic.rating} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Clinic Contact</h2>
                        <div className={styles.card}>
                            <div className={styles.contactList}>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}><Icon name="phone" size={17} /></span>
                                    <span>{clinic.phone}</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}><Icon name="mail" size={17} /></span>
                                    <span>{clinic.email}</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}><Icon name="pin" size={17} /></span>
                                    <span>{clinic.address}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                )}

                {/* CALENDAR + MAP */}
                {clinic && selectedAppt && (
                <div className={styles.twoCol}>
                    {/* Google Calendar sync — left of Directions */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Add to Calendar</h2>
                        <div className={styles.calendarCard}>
                            <div className={styles.calendarIcon}><Icon name="calendar" size={30} /></div>
                            <div className={styles.calendarBody}>
                                <div className={styles.calendarTitle}>
                                    {formatDate(selectedAppt.startDate)} → {formatDate(selectedAppt.endDate)}
                                </div>
                                <p className={styles.calendarText}>
                                    Save your treatment dates to Google Calendar so you never miss an appointment.
                                </p>
                            </div>
                            <a
                                href={googleCalendarUrl(selectedAppt, clinic)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.calendarBtn}
                            >
                                <Icon name="calendar" size={16} /> Sync with Google Calendar
                            </a>
                        </div>
                    </section>

                    {/* Directions with faded map preview */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Directions</h2>
                        <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.mapPlaceholder}
                            aria-label={`Open ${clinic.address} in Google Maps`}
                        >
                            <div className={styles.mapOverlay}>
                                <div className={styles.mapPin}><Icon name="pin" size={32} /></div>
                                <div className={styles.mapAddress}>{clinic.address}</div>
                                <span className={styles.mapLink}>Open in Google Maps →</span>
                            </div>
                        </a>
                    </section>
                </div>
                )}

            </div>
        </div>
    );
}