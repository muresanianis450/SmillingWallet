import { useState, useMemo, useEffect } from 'react';
import { PageName, ClientOffer } from '../../../types/types.ts';
import { useToast } from '../../../hooks/useToast';
import { usePagination } from '../../../hooks/usePagination';
import { Pagination } from '../../shared/Pagination';
import { Toast } from '../../shared/Toast';
import { Button } from '../../shared/Button';
import { EmptyState } from '../../shared/EmptyState';
import { api, AUTH_COOKIE } from '../../../services/api';
import { getCookie } from '../../../tracking/cookies';
import { DEFAULT_AVATAR } from '../../../assets/avatars';
// @ts-ignore
import styles from './MyOffersPage.module.css';

interface MyOffersPageProps {
    setPage: (page: PageName) => void;
}

const PER_PAGE = 4;

function StarRating({ rating }: { rating: number }) {
    if (rating === 0) return <span style={{ color: '#888', fontSize: '0.8rem' }}>No rating yet</span>;
    return (
        <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={n <= Math.round(rating) ? styles.starFilled : styles.starEmpty}>★</span>
            ))}
            <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
        </div>
    );
}

function PieChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
    const total = segments.reduce((s, d) => s + d.value, 0) || 1;
    let cumulative = 0;
    const slices = segments.map((seg) => {
        const startAngle = (cumulative / total) * 360;
        cumulative += seg.value;
        return { ...seg, startAngle, endAngle: (cumulative / total) * 360 };
    });
    function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
        const rad = ((angleDeg - 90) * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }
    function describeSlice(cx: number, cy: number, r: number, start: number, end: number) {
        if (end - start >= 360) end = 359.99;
        const s = polarToCartesian(cx, cy, r, start);
        const e = polarToCartesian(cx, cy, r, end);
        return `M${cx},${cy} L${s.x},${s.y} A${r},${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x},${e.y} Z`;
    }
    return (
        <div className={styles.pieWrap}>
            <svg viewBox="0 0 120 120" className={styles.pieSvg}>
                {slices.map((s) => (
                    <path key={s.label} d={describeSlice(60, 60, 54, s.startAngle, s.endAngle)} fill={s.color} stroke="#fff" strokeWidth="2" />
                ))}
            </svg>
            <div className={styles.pieLegend}>
                {segments.map((s) => (
                    <div key={s.label} className={styles.pieLegendItem}>
                        <span className={styles.pieDot} style={{ background: s.color }} />
                        <span>{s.label}</span>
                        <strong>{s.value}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

function mapToClientOffer(o: any, avgPrice: number): ClientOffer {
    const price = Number(o.price);
    const specialMentions: string[] = [];
    if (o.notes) specialMentions.push(o.notes);
    if (o.includesXray) specialMentions.push('X-ray included');
    if (o.includesAnesthesia) specialMentions.push('Anesthesia included');
    if (o.estimatedWaitDays > 0) specialMentions.push(`Est. ${o.estimatedWaitDays}-day wait`);
    if (specialMentions.length === 0) specialMentions.push('Standard consultation');
    const validUntilDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const proposedSlots: string[] = (o.proposedSlots || []).filter(Boolean);
    return {
        id: o.id,
        doctorLabel: `Dr. #${String(o.dentistPublicId).substring(0, 6)}`,
        avatarSeed: String(o.dentistPublicId),
        avatar: o.dentistProfilePicture || '',
        rating: 0,
        reviewCount: 0,
        priceMin: Math.round(price * 0.9),
        priceMax: Math.round(price * 1.1),
        exactQuote: price,
        date: new Date(o.createdAt).toLocaleDateString('ro-RO'),
        time: new Date(o.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
        specialMentions,
        matchScore: 0,
        savingsVsAvg: Math.round(avgPrice - price),
        validUntil: validUntilDate.toISOString().split('T')[0],
        treatmentCategory: '',
        isBestValue: false,
        proposedSlots,
        offerStatus: o.status || 'PENDING',
    };
}

export function MyOffersPage({ setPage }: MyOffersPageProps) {
    const [offers,    setOffers]    = useState<ClientOffer[]>([]);
    const [selected,  setSelected]  = useState<ClientOffer | null>(null);
    const [loading,   setLoading]   = useState(true);
    const [showStats,      setShowStats]      = useState(false);
    const [slotModal,      setSlotModal]      = useState(false);
    const [actioning,      setActioning]      = useState(false);
    const { toast, show: showToast } = useToast();
    const { page, setPage: setTablePage, totalPages, slice } = usePagination<ClientOffer>(offers, PER_PAGE);

    async function load() {
        const user = JSON.parse(getCookie(AUTH_COOKIE) || '{}');
        if (!user?.id) { setLoading(false); return; }
        try {
            const reqRes = await api.get(`/requests/patient/${user.id}?page=0&size=20`);
            const requests: any[] = reqRes.data.content || [];
            const activeRequests = requests.filter((r: any) => r.status === 'OPEN');
            const allRaw: any[] = [];
            await Promise.all(
                activeRequests.map(async (req: any) => {
                    try {
                        const offRes = await api.get(`/offers/request/${req.id}?page=0&size=20`);
                        const offerList: any[] = offRes.data.content || [];
                        allRaw.push(...offerList);
                    } catch {}
                })
            );
            const prices = allRaw.map((o) => Number(o.price));
            const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
            const mapped = allRaw.map((o) => mapToClientOffer(o, avg));
            if (mapped.length > 0) {
                const best = mapped.reduce((b, o) => o.exactQuote < b.exactQuote ? o : b, mapped[0]);
                best.isBestValue = true;
            }
            setOffers(mapped);
            if (mapped.length > 0 && !selected) setSelected(mapped[0]);
        } catch {}
        setLoading(false);
    }

    useEffect(() => {
        load();
        const interval = setInterval(load, 30_000);
        return () => clearInterval(interval);
    }, []);

    async function handleSelectSlot(slot: string) {
        if (!selected) return;
        setActioning(true);
        try {
            await api.patch(`/offers/${selected.id}/select-slot`, { selectedSlot: slot });
            showToast('Appointment confirmed!', 'success');
            setSlotModal(false);
            setTimeout(() => setPage('appointments'), 1800);
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to confirm slot.', 'error');
        } finally {
            setActioning(false);
        }
    }

    async function handleRequestReschedule() {
        if (!selected) return;
        setActioning(true);
        try {
            await api.patch(`/offers/${selected.id}/request-reschedule`);
            showToast('Reschedule requested. The clinic will propose new times.', 'success');
            setSlotModal(false);
            load();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to request reschedule.', 'error');
        } finally {
            setActioning(false);
        }
    }

    const avgPrice = useMemo(
        () => offers.length > 0 ? Math.round(offers.reduce((s, o) => s + o.exactQuote, 0) / offers.length) : 0,
        [offers]
    );
    const bestOffer = useMemo(
        () => offers.length > 0 ? offers.reduce((best, o) => (o.exactQuote < best.exactQuote ? o : best), offers[0]) : null,
        [offers]
    );
    const priceBuckets = useMemo(() => [
        { label: 'Under €400', value: offers.filter((o) => o.exactQuote < 400).length,                color: '#1D9E75' },
        { label: '€400–€500',  value: offers.filter((o) => o.exactQuote >= 400 && o.exactQuote < 500).length, color: '#7F77DD' },
        { label: 'Over €500',  value: offers.filter((o) => o.exactQuote >= 500).length,               color: '#E8593C' },
    ], [offers]);

    if (loading) {
        return (
            <div className={styles.wrap}>
                <EmptyState icon="⏳" message="Loading your offers…" />
            </div>
        );
    }

    if (offers.length === 0) {
        return (
            <div className={styles.wrap}>
                <div className={styles.pageHead}>
                    <h1 className={styles.title}>My Offers</h1>
                </div>
                <EmptyState icon="📭" message="No offers yet. Submit a request and clinics will respond." />
                <Toast toast={toast} />
            </div>
        );
    }

    const current = selected ?? offers[0];

    return (
        <div className={styles.wrap}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.title}>My Offers</h1>
                    <p className={styles.sub}>{offers.length} clinic{offers.length !== 1 ? 's' : ''} responded to your request</p>
                </div>
                <button
                    className={`${styles.statsToggle} ${showStats ? styles.statsToggleActive : ''}`}
                    onClick={() => setShowStats((s) => !s)}
                >
                    {showStats ? '📊 Hide Statistics' : '📊 Show Statistics'}
                </button>
            </div>

            <div className={styles.mainPanel}>
                <div className={styles.leftPanel}>
                    {slice.map((offer) => (
                        <div
                            key={offer.id}
                            className={`${styles.doctorCard} ${current.id === offer.id ? styles.doctorCardActive : ''}`}
                            onClick={() => setSelected(offer)}
                        >
                            {offer.isBestValue && <span className={styles.bestBadge}>Best Value</span>}
                            <div className={styles.doctorCardRow}>
                                <img src={offer.avatar || DEFAULT_AVATAR} className={styles.doctorAvatarImg} alt="" />
                                <div className={styles.doctorInfo}>
                                    <div className={styles.doctorName}>{offer.doctorLabel}</div>
                                    <StarRating rating={offer.rating} />
                                </div>
                                <div className={styles.doctorPrice}>
                                    <div className={styles.priceRange}>€{offer.priceMin}–€{offer.priceMax}</div>
                                    <div className={styles.exactQuote}>€{offer.exactQuote} quoted</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <Pagination page={page} totalPages={totalPages} setPage={setTablePage} />
                </div>

                <div className={styles.rightPanel}>
                    <div className={styles.detailHeader}>
                        <div className={styles.detailDoctorProfile}>
                            <img src={current.avatar || DEFAULT_AVATAR} className={styles.detailDoctorAvatarImg} alt="Doctor" />
                            <div className={styles.doctorInfoText}>
                                <h2 className={styles.detailDoctor}>{current.doctorLabel}</h2>
                                <StarRating rating={current.rating} />
                            </div>
                        </div>
                        {current.isBestValue && <span className={styles.bestBadgeLg}>🏆 Best Value</span>}
                    </div>

                    <div className={styles.sectionBox}>
                        <div className={styles.detailGrid}>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Price Range</span>
                                <span className={styles.detailVal}>€{current.priceMin} – €{current.priceMax}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Exact Quote</span>
                                <span className={`${styles.detailVal} ${styles.teal}`}>€{current.exactQuote}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Offer Received</span>
                                <span className={styles.detailVal}>{current.date}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionBox}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Savings vs Avg</span>
                            <span className={`${styles.detailVal} ${current.savingsVsAvg >= 0 ? styles.teal : styles.danger}`}>
                                {current.savingsVsAvg >= 0
                                    ? `Save €${current.savingsVsAvg}`
                                    : `+€${Math.abs(current.savingsVsAvg)} above avg`}
                            </span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Offer Valid Until</span>
                            <span className={styles.detailVal}>{current.validUntil}</span>
                        </div>
                    </div>

                    <div className={styles.sectionBox}>
                        <div className={styles.specialMentions}>
                            <span className={styles.detailLabel}>Details</span>
                            <ul className={styles.mentionList}>
                                {current.specialMentions.map((m, i) => (
                                    <li key={i} className={styles.mentionItem}>✓ {m}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className={styles.detailActions}>
                        {current.offerStatus === 'RESCHEDULE_REQUESTED' ? (
                            <p style={{ color: '#f59e0b', fontSize: '0.9rem', margin: 0 }}>
                                ⏳ Waiting for the clinic to propose new times…
                            </p>
                        ) : current.proposedSlots.length > 0 ? (
                            <Button variant="cta" onClick={() => setSlotModal(true)}>
                                Choose a Time Slot
                            </Button>
                        ) : (
                            <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>
                                No time slots proposed yet
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Slot Selection Modal */}
            {slotModal && current && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '12px', padding: '32px',
                        maxWidth: '440px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    }}>
                        <h3 style={{ marginBottom: '8px' }}>Choose a Time Slot</h3>
                        <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>
                            From <strong>{current.doctorLabel}</strong> — €{current.exactQuote}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            {current.proposedSlots.map((slot, i) => {
                                const d = new Date(slot);
                                return (
                                    <button
                                        key={i}
                                        disabled={actioning}
                                        onClick={() => handleSelectSlot(slot)}
                                        style={{
                                            padding: '14px 18px', borderRadius: '10px',
                                            border: '2px solid #7b68ee', background: '#f5f4ff',
                                            cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem',
                                            fontWeight: 600, color: '#4a3fbf',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#ece9ff')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f4ff')}
                                    >
                                        📅 {d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        &nbsp;·&nbsp;
                                        {d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button variant="secondary" onClick={handleRequestReschedule} disabled={actioning}>
                                Request Another Time
                            </Button>
                            <Button variant="secondary" onClick={() => setSlotModal(false)} disabled={actioning}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showStats && (
                <div className={styles.analyticsSection}>
                    <h2 className={styles.analyticsTitle}>📊 Offer Analytics</h2>
                    <div className={styles.statCards}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>💰</div>
                            <div className={styles.statLabel}>Average Price</div>
                            <div className={styles.statVal}>€{avgPrice}</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>⭐</div>
                            <div className={styles.statLabel}>Best Value</div>
                            <div className={`${styles.statVal} ${styles.teal}`}>€{bestOffer?.exactQuote ?? '—'}</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>📋</div>
                            <div className={styles.statLabel}>Total Offers</div>
                            <div className={`${styles.statVal} ${styles.purple}`}>{offers.length}</div>
                        </div>
                    </div>
                    <div className={styles.chartsRow}>
                        <div className={styles.chartCard}>
                            <h3 className={styles.chartTitle}>Price Distribution</h3>
                            <PieChart segments={priceBuckets} />
                        </div>
                    </div>
                </div>
            )}

            <Toast toast={toast} />
        </div>
    );
}
