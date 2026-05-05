import { useEffect, useRef, useState } from 'react';
import { PageName } from '../../../types/types.ts';
import { api } from '../../../services/api';
import { useWebSocket, ChatMessage } from '../../../hooks/useWebSocket';
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
    const [appointmentId, setAppointmentId] = useState<string | null>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const { connected, sendMessage } = useWebSocket({
        appointmentId,
        onMessage: (msg) => setMessages((prev) => [...prev, msg]),
    });

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
                    setAppointmentId(appts[0].id);

                    const dentistRes = await api.get(
                        `/auth/user/${appts[0].dentistPublicId}`
                    );
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
                } else {
                    setClinic({
                        name: 'No clinic assigned',
                        doctorName: 'No doctor assigned',
                        rating: 0,
                        phone: 'N/A',
                        email: 'N/A',
                        address: 'N/A',
                        specialty: '',
                    });
                }
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!appointmentId) return;

        setMessages([]);

        api.get(`/chat/${appointmentId}/history`)
            .then((res) => setMessages(res.data))
            .catch(() => {});
    }, [appointmentId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !appointmentId) return;

        sendMessage({
            appointmentId,
            senderId: String(user.id),
            senderName: user.username || 'You',
            senderRole: user.role || 'PATIENT',
            content: input.trim(),
        });

        setInput('');
    };

    if (loading) return <div className={styles.wrap}>Loading...</div>;
    if (!clinic) return <div className={styles.wrap}>Loading clinic info...</div>;

    return (
        <div className={styles.wrap}>
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
                                    <tr
                                        key={apt.id}
                                        onClick={() => setAppointmentId(apt.id)}
                                        className={
                                            apt.id === appointmentId ? styles.activeRow : ''
                                        }
                                        style={{ cursor: 'pointer' }}
                                    >
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

                {/* MAP */}
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

                {/* CHAT */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        Chat with {clinic.name}
                        <span
                            className={
                                connected ? styles.dotOnline : styles.dotOffline
                            }
                        />
                    </h2>

                    {!appointmentId ? (
                        <div className={styles.chatEmpty}>
                            Chat is available once your appointment is confirmed.
                        </div>
                    ) : (
                        <div className={styles.chatCard}>
                            <div className={styles.chatMessages}>
                                {messages.length === 0 && (
                                    <div className={styles.chatNoMessages}>
                                        No messages yet. Say hello! 👋
                                    </div>
                                )}

                                {messages.map((msg) => {
                                    const isMe = msg.senderId === String(user.id);

                                    return (
                                        <div
                                            key={msg.messageId}
                                            className={
                                                isMe
                                                    ? styles.msgRowMe
                                                    : styles.msgRowOther
                                            }
                                        >
                                            {!isMe && (
                                                <div className={styles.msgAvatar}>
                                                    {msg.senderName?.[0] ?? '?'}
                                                </div>
                                            )}

                                            <div className={styles.msgBubbleWrap}>
                                                {!isMe && (
                                                    <div className={styles.msgSender}>
                                                        {msg.senderName}
                                                    </div>
                                                )}

                                                <div
                                                    className={
                                                        isMe
                                                            ? styles.bubbleMe
                                                            : styles.bubbleOther
                                                    }
                                                >
                                                    {msg.content}
                                                </div>

                                                <div className={styles.msgTime}>
                                                    {new Date(
                                                        msg.timestamp
                                                    ).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div ref={bottomRef} />
                            </div>

                            <div className={styles.chatInputRow}>
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Type a message…"
                                    className={styles.chatInput}
                                    maxLength={1000}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!connected || !input.trim()}
                                    className={styles.chatSendBtn}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}