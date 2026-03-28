import { PageName, ConfirmedAppointment, MatchedClinic } from '../../../types/types.ts';
import { MOCK_CONFIRMED_APPOINTMENTS, MOCK_MATCHED_CLINIC } from '../../../data/constants';
import { Button } from '../../shared/Button';
// @ts-ignore
import styles from './AppointmentsPage.module.css';

interface AppointmentsPageProps {
    setPage: (page: PageName) => void;
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={n <= Math.round(rating) ? styles.starFilled : styles.starEmpty}>★</span>
            ))}
            <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
        </div>
    );
}

export function AppointmentsPage({ setPage }: AppointmentsPageProps) {
    const appointments: ConfirmedAppointment[] = MOCK_CONFIRMED_APPOINTMENTS;
    const clinic: MatchedClinic = MOCK_MATCHED_CLINIC;

    return (
        <div className={styles.wrap}>
            {/* ── Hero ── */}
            <div className={styles.hero}>
                <div className={styles.heroIcon}>🎉</div>
                <h1 className={styles.heroTitle}>Congratulations!</h1>
                <p className={styles.heroSub}>Your Perfect Smile is on its way.</p>
                <div className={styles.clinicReveal}>
                    <span className={styles.clinicRevealLabel}>Matched Clinic</span>
                    <span className={styles.clinicRevealName}>{clinic.name}</span>
                </div>
            </div>

            <div className={styles.content}>
                {/* ── Confirmed Appointments Table ── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Confirmed Appointments</h2>
                    <div className={styles.tableCard}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Treatment</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {appointments.map((apt, i) => (
                                <tr key={i}>
                                    <td>{apt.date}</td>
                                    <td>{apt.time}</td>
                                    <td>{apt.treatment}</td>
                                    <td>
                                        <span className={styles.statusBadge}>✓ {apt.status}</span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className={styles.twoCol}>
                    {/* ── Dental Team Card ── */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Your Dental Team</h2>
                        <div className={styles.card}>
                            <div className={styles.doctorRow}>
                                <div className={styles.doctorAvatar}>
                                    {clinic.doctorName.split(' ').map((w) => w[0]).join('')}
                                </div>
                                <div>
                                    <div className={styles.doctorName}>{clinic.doctorName}</div>
                                    <StarRating rating={clinic.rating} />
                                    <div className={styles.reviewCount}>{clinic.reviewCount} verified reviews</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Clinic Contact ── */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Clinic Contact</h2>
                        <div className={styles.card}>
                            <div className={styles.contactList}>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}>📞</span>
                                    <span>{clinic.phone}</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}>✉️</span>
                                    <span>{clinic.email}</span>
                                </div>
                                <div className={styles.contactItem}>
                                    <span className={styles.contactIcon}>📍</span>
                                    <span>{clinic.address}</span>
                                </div>
                            </div>

                            <div className={styles.actionBtns}>
                                <a href={`mailto:${clinic.email}`} className={styles.btnOutline}>
                                    ✉️ Message Dr.
                                </a>
                                <a href={`tel:${clinic.phone}`} className={styles.btnOutline}>
                                    📞 Call Clinic
                                </a>
                            </div>
                        </div>
                    </section>
                </div>

                {/* ── Map Placeholder ── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Directions</h2>
                    <div className={styles.mapPlaceholder}>
                        <div className={styles.mapPin}>📍</div>
                        <div className={styles.mapAddress}>{clinic.address}</div>
                        <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(clinic.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.mapLink}
                        >
                            Open in Google Maps →
                        </a>
                    </div>
                </section>

                {/* ── Footer Summary ── */}
                <section className={styles.footerSummary}>
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>🔓 Reveal Triggered</span>
                            <span className={styles.summaryVal}>{clinic.revealDate}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>💳 1% Fee Applied</span>
                            <span className={styles.summaryVal}>€{Math.round(clinic.totalPrice * 0.01)}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>🦷 Procedures</span>
                            <span className={styles.summaryVal}>{clinic.procedures.join(', ')}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>💰 Total Accepted Price</span>
                            <span className={`${styles.summaryVal} ${styles.teal}`}>€{clinic.totalPrice}</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}