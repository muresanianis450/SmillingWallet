import { useState, useMemo } from 'react';
import { PageName, ClientOffer } from '../../../types/types.ts';
import { MOCK_CLIENT_OFFERS } from '../../../data/constants';
import { useToast } from '../../../hooks/useToast';
import { usePagination } from '../../../hooks/usePagination';
import { Pagination } from '../../shared/Pagination';
import { Toast } from '../../shared/Toast';
import { Button } from '../../shared/Button';
// @ts-ignore
import DefaultAvatar from '../../../../assets/default-avatar.png';
// @ts-ignore
import styles from './MyOffersPage.module.css';

interface MyOffersPageProps {
    setPage: (page: PageName) => void;
}

const PER_PAGE = 4;

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
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
    const max = Math.max(...data.map((d) => d.value), 1);

    return (
        <div className={styles.barChart}>
            {data.map((d) => (
                <div key={d.label} className={styles.barGroup}>
                    <div className={styles.barTrack}>
                        <div
                            className={styles.barFill}
                            style={{ height: `${(d.value / max) * 100}%`, background: d.color }}
                        />
                    </div>
                    <span className={styles.barLabel}>{d.label}</span>
                    <span className={styles.barVal}>{d.value}</span>
                </div>
            ))}
        </div>
    );
}
function PieChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
    const total = segments.reduce((s, d) => s + d.value, 0) || 1;
    let cumulative = 0;

    const slices = segments.map((seg) => {
        const startAngle = (cumulative / total) * 360;
        cumulative += seg.value;
        const endAngle = (cumulative / total) * 360;
        return { ...seg, startAngle, endAngle };
    });

    function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
        const rad = ((angleDeg - 90) * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    function describeSlice(cx: number, cy: number, r: number, start: number, end: number) {
        if (end - start >= 360) end = 359.99;
        const s = polarToCartesian(cx, cy, r, start);
        const e = polarToCartesian(cx, cy, r, end);
        const large = end - start > 180 ? 1 : 0;
        return `M${cx},${cy} L${s.x},${s.y} A${r},${r} 0 ${large} 1 ${e.x},${e.y} Z`;
    }

    return (
        <div className={styles.pieWrap}>
            <svg viewBox="0 0 120 120" className={styles.pieSvg}>
                {slices.map((s) => (
                    <path
                        key={s.label}
                        d={describeSlice(60, 60, 54, s.startAngle, s.endAngle)}
                        fill={s.color}
                        stroke="#fff"
                        strokeWidth="2"
                    />
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

export function MyOffersPage({ setPage }: MyOffersPageProps) {
    const offers = MOCK_CLIENT_OFFERS;
    const [selected, setSelected] = useState<ClientOffer>(offers[0]);
    const [showStats, setShowStats] = useState(false);
    const { toast, show: showToast } = useToast();
    const { page, setPage: setTablePage, totalPages, slice } = usePagination<ClientOffer>(offers, PER_PAGE);

    const avgPrice = useMemo(
        () => Math.round(offers.reduce((s, o) => s + o.exactQuote, 0) / offers.length),
        [offers]
    );

    const bestOffer = useMemo(
        () => offers.reduce((best, o) => (o.exactQuote < best.exactQuote ? o : best), offers[0]),
        [offers]
    );

    const priceBuckets = useMemo(() => {
        const under400 = offers.filter((o) => o.exactQuote < 400).length;
        const mid = offers.filter((o) => o.exactQuote >= 400 && o.exactQuote < 500).length;
        const over500 = offers.filter((o) => o.exactQuote >= 500).length;
        return [
            { label: 'Under €400', value: under400, color: '#1D9E75' },
            { label: '€400–€500', value: mid, color: '#7F77DD' },
            { label: 'Over €500', value: over500, color: '#E8593C' },
        ];
    }, [offers]);

    const starBuckets = useMemo(() => {
        const buckets = ['< 4.0', '4.0–4.4', '4.5–4.9', '5.0'];
        const counts = [
            offers.filter((o) => o.rating < 4.0).length,
            offers.filter((o) => o.rating >= 4.0 && o.rating < 4.5).length,
            offers.filter((o) => o.rating >= 4.5 && o.rating < 5.0).length,
            offers.filter((o) => o.rating === 5.0).length,
        ];
        const colors = ['#E8593C', '#f5a623', '#1D9E75', '#7F77DD'];
        return buckets.map((label, i) => ({ label, value: counts[i], color: colors[i] }));
    }, [offers]);

    function handleAccept() {
        showToast(`Offer from ${selected.doctorLabel} accepted! Redirecting…`, 'success');
        setTimeout(() => setPage('appointments'), 1800);
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.pageHead}>
                <div>
                    <h1 className={styles.title}>My Offers</h1>
                    <p className={styles.sub}>{offers.length} clinics responded to your request</p>
                </div>
                <button
                    className={`${styles.statsToggle} ${showStats ? styles.statsToggleActive : ''}`}
                    onClick={() => setShowStats((s) => !s)}
                >
                    {showStats ? '📊 Hide Statistics' : '📊 Show Statistics'}
                </button>
            </div>

            {/* MAIN PANEL */}
            <div className={styles.mainPanel}>

                {/* LEFT PANEL */}
                <div className={styles.leftPanel}>
                    {slice.map((offer) => (
                        <div
                            key={offer.id}
                            className={`${styles.doctorCard} ${selected.id === offer.id ? styles.doctorCardActive : ''}`}
                            onClick={() => setSelected(offer)}
                        >
                            {offer.isBestValue && (
                                <span className={styles.bestBadge}>Best Value</span>
                            )}
                            <div className={styles.doctorCardRow}>
                                <img src={offer.avatar || DefaultAvatar}
                                    className={styles.doctorAvatarImg}
                                />
                                <div className={styles.doctorInfo}>
                                    <div className={styles.doctorName}>{offer.doctorLabel}</div>
                                    <StarRating rating={offer.rating} />
                                    <div className={styles.reviewCount}>{offer.reviewCount} reviews</div>
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

                {/* RIGHT PANEL */}
                <div className={styles.rightPanel}>

                    {/* HEADER - ADDED DOCTOR AVATAR HERE */}
                    <div className={styles.detailHeader}>

                        {/* Unified Profile Block (Avatar + Name/Stars) */}
                        <div className={styles.detailDoctorProfile}>
                            <img
                                src={selected.avatar || DefaultAvatar} // Use selected doctor's avatar
                                className={styles.detailDoctorAvatarImg} // New style for the large avatar
                                alt="Doctor Profile"
                            />
                            <div className={styles.doctorInfoText}>
                                <h2 className={styles.detailDoctor}>{selected.doctorLabel}</h2>
                                <StarRating rating={selected.rating} />
                            </div>
                        </div>

                        {/* Existing Best Value Badge */}
                        {selected.isBestValue && (
                            <span className={styles.bestBadgeLg}>🏆 Best Value</span>
                        )}
                    </div>

                    {/* PRICE + INFO */}
                    <div className={styles.sectionBox}>
                        <div className={styles.detailGrid}>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Price Range</span>
                                <span className={styles.detailVal}>
                                    €{selected.priceMin} – €{selected.priceMax}
                                </span>
                            </div>

                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Exact Quote</span>
                                <span className={`${styles.detailVal} ${styles.teal}`}>
                                    €{selected.exactQuote}
                                </span>
                            </div>

                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Date & Time</span>
                                <span className={styles.detailVal}>
                                    {selected.date}, {selected.time}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* STATS */}
                    <div className={styles.sectionBox}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Match Score</span>
                            <span className={`${styles.detailVal} ${styles.purple}`}>
                                {selected.matchScore}%
                            </span>
                        </div>

                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Savings vs Avg</span>
                            <span className={`${styles.detailVal} ${selected.savingsVsAvg >= 0 ? styles.teal : styles.danger}`}>
                                {selected.savingsVsAvg >= 0
                                    ? `Save €${selected.savingsVsAvg}`
                                    : `+€${Math.abs(selected.savingsVsAvg)} above avg`}
                            </span>
                        </div>

                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Offer Valid Until</span>
                            <span className={styles.detailVal}>{selected.validUntil}</span>
                        </div>
                    </div>

                    {/* SPECIAL MENTIONS */}
                    <div className={styles.sectionBox}>
                        <div className={styles.specialMentions}>
                            <span className={styles.detailLabel}>Special Mentions</span>
                            <ul className={styles.mentionList}>
                                {selected.specialMentions.map((m) => (
                                    <li key={m} className={styles.mentionItem}>✓ {m}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className={styles.detailActions}>
                        <button className={styles.altTimeBtn}>
                            🕐 Request Alternative Time
                        </button>
                        <Button variant="cta" onClick={handleAccept}>
                            Accept Offer
                        </Button>
                    </div>

                    <div className={styles.lockNote}>
                        🔒 Clinic identity revealed after paying 1% matchmaking fee (€{Math.round(selected.exactQuote * 0.01)})
                    </div>

                </div>
            </div>

            {/* ANALYTICS */}
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
                            <div className={styles.statIcon}></div>
                            <div className={styles.statLabel}>Best Value Offer</div>
                            <div className={`${styles.statVal} ${styles.teal}`}>€{bestOffer.exactQuote}</div>
                            <div className={styles.statSub}>{bestOffer.doctorLabel}</div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>📋</div>
                            <div className={styles.statLabel}>Total Offers</div>
                            <div className={`${styles.statVal} ${styles.purple}`}>{offers.length}</div>
                        </div>
                    </div>

                    <div className={styles.chartsRow}>
                        <div className={styles.chartCard}>
                            <h3 className={styles.chartTitle}>Price Range Distribution</h3>
                            <PieChart segments={priceBuckets} />
                        </div>

                        <div className={styles.chartCard}>
                            <h3 className={styles.chartTitle}>Offers per Star Rating</h3>
                            <BarChart data={starBuckets} />
                        </div>
                    </div>
                </div>
            )}

            <Toast toast={toast} />
        </div>
    );
}
