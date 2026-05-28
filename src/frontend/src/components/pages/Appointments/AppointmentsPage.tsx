import { useEffect, useState } from 'react';
import { PageName } from '../../../types/types.ts';
import { api } from '../../../services/api';
// @ts-ignore
import styles from './AppointmentsPage.module.css';

interface AppointmentsPageProps {
    setPage: (page: PageName) => void;
}

interface AppointmentDTO {
    id: string;
    scheduledAt: string;
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
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span
                    key={n}
                    className={n <= Math.round(rating) ? styles.starFilled : styles.starEmpty}
                >
                    ★
                </span>
            ))}
            <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
        </div>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString();
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function AppointmentsPage({}: AppointmentsPageProps) {
    const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
    const [clinic, setClinic] = useState<ClinicInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        api.get(`/dashboard/patient/${user.id}`)
            .then(async (res) => {
                const appts: AppointmentDTO[] = res.data.appointments || [];
                setAppointments(appts);

                if (appts.length > 0) {
                    try {
                        const dentistRes = await api.get(`/auth/user/${appts[0].dentistPublicId}`);
                        const d = dentistRes.data;
                        setClinic({
                            name: d.username,
                            doctorName: d.username,
                            rating: d.rating ?? 0,
                            phone: d.phone || 'N/A',
                            email: d.email || 'N/A',
                            address: d.address || d.city || 'N/A',
                            specialty: d.specialty || '',
                        });
                    } catch {
                        setClinic({ name: 'Unknown', doctorName: 'Unknown', rating: 0, phone: 'N/A', email: 'N/A', address: 'N/A', specialty: '' });
                    }
                } else {
                    setClinic(null);
                }
            })
            .catch(() => setClinic(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className={styles.wrap}>Loading...</div>;

    return (
        <div className={styles.wrap}>
            <div className={styles.hero}>
                <div className={styles.heroIcon}>{clinic ? '🎉' : '📋'}</div>
                <h1 className={styles.heroTitle}>{clinic ? 'Congratulations!' : 'My Appointments'}</h1>
                <p className={styles.heroSub}>
                    {clinic ? 'Your Perfect Smile is on its way.' : 'No appointments yet. Accept an offer to get started.'}
                </p>
                {clinic && (
                    <div className={styles.clinicReveal}>
                        <span className={styles.clinicRevealLabel}>Matched Clinic</span>
                        <span className={styles.clinicRevealName}>{clinic.name}</span>
                    </div>
                )}
            </div>

            <div className={styles.content}>
                {/* APPOINTMENTS */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Confirmed Appointments</h2>
                    <div className={styles.tableCard}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Price</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={4}>No appointments yet</td>
                                </tr>
                            ) : (
                                appointments.map((apt) => (
                                    <tr key={apt.id}>
                                        <td>{formatDate(apt.scheduledAt)}</td>
                                        <td>{formatTime(apt.scheduledAt)}</td>
                                        <td>€{apt.confirmedPrice?.toFixed(2)}</td>
                                        <td>
                                                <span className={styles.statusBadge}>
                                                    ✓ {apt.status}
                                                </span>
                                        </td>
                                    </tr>
                                ))
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
                                <div className={styles.doctorAvatar}>
                                    {clinic.doctorName
                                        .split(' ')
                                        .map((w) => w[0])
                                        .join('')}
                                </div>
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
                                    <span>📞</span>
                                    <span>{clinic.phone}</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span>✉️</span>
                                    <span>{clinic.email}</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span>📍</span>
                                    <span>{clinic.address}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                )}

                {/* MAP */}
                {clinic && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Directions</h2>
                    <div className={styles.mapPlaceholder}>
                        <div className={styles.mapPin}>📍</div>
                        <div className={styles.mapAddress}>{clinic.address}</div>
                        <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(
                                clinic.address
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.mapLink}
                        >
                            Open in Google Maps →
                        </a>
                    </div>
                </section>
                )}

            </div>
        </div>
    );
}