import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNotificationSocket } from '../../../hooks/useNotificationSocket';
import { Offer, ModalState, OfferStatus } from '../../../types/types.ts';
import { OFFER_STATUSES } from '../../../data/constants';
import { usePagination } from '../../../hooks/usePagination';
import { useToast } from '../../../hooks/useToast';
import { StatusBadge } from '../../shared/StatusBadge';
import { Pagination } from '../../shared/Pagination';
import { Toast } from '../../shared/Toast';
import { EmptyState } from '../../shared/EmptyState';
import { OfferFormModal } from './OfferFormModal';
import { DeleteModal } from './DeleteModal';
import { usePageTracking } from '../../../hooks/useTracking';
import { api, AUTH_COOKIE } from '../../../services/api';
import { DEFAULT_AVATAR } from '../../../assets/avatars';
import { getCookie } from '../../../tracking/cookies';
// @ts-ignore
import styles from './DashboardPage.module.css';
import { IconView, IconEdit, IconDelete } from '../../shared/Icons';
import { Icon } from '../../shared/Icon';
import { trackEvent } from '../../../tracking/tracker';

const PER_PAGE = 5;

const STATUS_MAP: Record<string, OfferStatus> = {
  PENDING:               'Sent',
  RESCHEDULE_REQUESTED:  'Sent',
  ACCEPTED:              'Accepted',
  REJECTED:              'Declined',
  WITHDRAWN:             'Declined',
};

function mapApiOffer(o: any): Offer & { patientProfilePicture?: string } {
  return {
    id: o.id,
    patientId: o.requestId,
    patientName: `Request #${String(o.requestId).substring(0, 8)}`,
    priceQuote: Number(o.price),
    date: null,
    time: null,
    status: STATUS_MAP[o.status] ?? 'Sent',
    treatmentCategory: '',
    treatmentReq: o.notes || '',
    ctScan: null,
    symptoms: o.notes || '',
    patientProfilePicture: o.patientProfilePicture || null,
    procedureDays: o.procedureDays || 0,
    variations: (o.variations || []).filter((v: any) => v && v.startDate && v.endDate),
  };
}

export function DashboardPage() {
  usePageTracking('dashboard');

  const { toast, show: showToast } = useToast();

  const [offers,        setOffers]        = useState<Offer[]>([]);
  const [rawOffers,     setRawOffers]     = useState<any[]>([]);
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('All');
  const [modal,         setModal]         = useState<ModalState | null>(null);
  const [appointments,  setAppointments]  = useState<any[]>([]);
  const [reproposeOffer, setReproposeOffer] = useState<any | null>(null);
  const [reproposeSlots, setReproposeSlots] = useState({ procedureDays: '', variant1Start: '', variant2Start: '', price: '' });
  const [reproposing,   setReproposing]   = useState(false);

  const dentist = JSON.parse(getCookie(AUTH_COOKIE) || '{}');

  // Load dentist's sent offers
  function loadOffers() {
    if (!dentist?.id) return;
    api.get(`/offers/dentist/${dentist.id}?page=0&size=50`)
      .then((res) => {
        const raw = res.data.content || [];
        setRawOffers(raw);
        setOffers(raw.map(mapApiOffer));
      })
      .catch(() => {});
  }

  // Load accepted appointments
  function loadAppointments() {
    if (!dentist?.id) return;
    api.get(`/dashboard/clinic/${dentist.id}/appointments`)
      .then((res) => setAppointments(res.data || []))
      .catch(() => {});
  }

  useEffect(() => {
    loadOffers();
    loadAppointments();
  }, []);

  // Real-time: refresh offers and appointments when relevant push arrives
  const handlePush = useCallback((type: string) => {
    if (type === 'OFFER_ACCEPTED' || type === 'NEW_OFFER' || type === 'APPOINTMENT_SCHEDULED') {
      loadOffers();
      loadAppointments();
    }
  }, []);
  useNotificationSocket(handlePush);

  const stats = useMemo(() => ({
    total:    offers.length,
    accepted: offers.filter((o) => o.status === 'Accepted').length,
  }), [offers]);

  const filtered = useMemo(
    () => offers.filter((o) => {
      if (o.status === 'Accepted') return false;
      const q = search.toLowerCase();
      const matchQ =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.patientName.toLowerCase().includes(q) ||
        o.patientId.toLowerCase().includes(q);
      const matchS = filterStatus === 'All' || o.status === filterStatus;
      return matchQ && matchS;
    }),
    [offers, search, filterStatus]
  );

  const { page, setPage, totalPages, slice } = usePagination<Offer>(filtered, PER_PAGE);

  function handleEdit(fields: any) {
    trackEvent('EDIT_OFFER', { offerId: modal?.offer?.id });
    if (!modal?.offer) return;
    setOffers((prev) => prev.map((o) => o.id === modal.offer!.id
      ? { ...o, ...fields, priceQuote: parseFloat(String(fields.priceQuote)) || o.priceQuote }
      : o
    ));
    setModal(null);
    showToast('Offer updated!', 'success');
  }

  function endDateFor(startISO: string, days: number): string {
    if (!startISO || !days || days < 1) return '';
    const d = new Date(startISO + 'T00:00:00');
    d.setDate(d.getDate() + days - 1);
    // Format from local components (not toISOString) to avoid a UTC day-shift.
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async function handleRepropose() {
    const days = parseInt(String(reproposeSlots.procedureDays), 10);
    if (!reproposeOffer || !reproposeSlots.variant1Start || !days || days < 1) return;
    setReproposing(true);
    try {
      const v2Start = reproposeSlots.variant2Start || null;
      await api.patch(`/offers/${reproposeOffer.id}/repropose-slots`, {
        procedureDays: days,
        variant1Start: reproposeSlots.variant1Start,
        variant1End:   endDateFor(reproposeSlots.variant1Start, days),
        variant2Start: v2Start,
        variant2End:   v2Start ? endDateFor(reproposeSlots.variant2Start, days) : null,
        price: reproposeSlots.price ? Number(reproposeSlots.price) : null,
      });
      showToast('New date options sent to patient!', 'success');
      setReproposeOffer(null);
      setReproposeSlots({ procedureDays: '', variant1Start: '', variant2Start: '', price: '' });
      api.get(`/offers/dentist/${dentist.id}?page=0&size=50`)
        .then((res) => { const raw = res.data.content || []; setRawOffers(raw); setOffers(raw.map(mapApiOffer)); })
        .catch(() => {});
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to send new dates.', 'error');
    } finally {
      setReproposing(false);
    }
  }

  function handleDelete() {
    trackEvent('DELETE_OFFER', { offerId: modal?.offer?.id });
    if (!modal?.offer) return;
    setOffers((prev) => prev.filter((o) => o.id !== modal.offer!.id));
    setModal(null);
    showToast('Offer removed from view.', 'error');
  }

  return (
    <div className={styles.page} data-testid="dashboard-page">
      <div className={styles.header}>
        <h1 className={styles.title}>Clinic Dashboard</h1>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Offers Sent</div>
            <div className={`${styles.statVal} ${styles.purple}`}>{stats.total}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Accepted Offers</div>
            <div className={`${styles.statVal} ${styles.teal}`}>{stats.accepted}</div>
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.toolbar}>
          <input
            className={styles.searchBox}
            placeholder="Search by offer ID or request…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); trackEvent('SEARCH', { value: e.target.value }); }}
          />
          <select
            className={styles.filterSel}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); trackEvent('SEARCH', { value: e.target.value }); }}
          >
            <option>All</option>
            {OFFER_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <table data-testid="offers-table">
          <thead>
            <tr>
              <th>Offer ID</th>
              <th>Patient</th>
              <th>Price</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon="clipboard" message="No offers sent yet" />
                </td>
              </tr>
            ) : (
              slice.map((o) => (
                <tr key={o.id} onClick={() => { setModal({ type: 'view', offer: o }); trackEvent('SEARCH', { value: o.id }); }}>
                  <td><strong>#{String(o.id).substring(0, 8)}</strong></td>
                  <td>
                    <div className={styles.patientCell}>
                      <img
                        src={(o as any).patientProfilePicture || DEFAULT_AVATAR}
                        alt=""
                        className={styles.patientAvatar}
                      />
                      {o.patientName}
                    </div>
                  </td>
                  <td className={styles.priceTeal}>€{o.priceQuote}</td>
                  <td className={styles.dateMuted}>{o.treatmentReq || '—'}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className={styles.rowActions}>
                      <button className={`${styles.iconBtn} ${styles.view}`} title="View"
                        onClick={() => setModal({ type: 'view', offer: o })}>
                        <IconView />
                      </button>
                      <button className={`${styles.iconBtn} ${styles.edit}`} title="Edit"
                        onClick={() => setModal({ type: 'edit', offer: o })}>
                        <IconEdit />
                      </button>
                      <button
                        data-testid="delete-offer-btn"
                        className={`${styles.iconBtn} ${styles.del}`}
                        title="Remove"
                        onClick={(e) => { e.stopPropagation(); setModal({ type: 'delete', offer: o }); }}
                      >
                        <IconDelete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>

      {/* Accepted appointments — patient identity revealed post-acceptance */}
      <div className={styles.tableCard} style={{ marginTop: 28 }}>
        <div className={styles.toolbar}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Accepted Appointments</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Request</th>
              <th>Treatment Dates</th>
              <th>Patient</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon="calendar" message="No accepted appointments yet" />
                </td>
              </tr>
            ) : (
              appointments.map((apt) => (
                <tr key={apt.id}>
                  <td><strong>#{apt.requestId ? String(apt.requestId).substring(0, 8) : '—'}</strong></td>
                  <td>{apt.startDate ? `${new Date(apt.startDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} → ${new Date((apt.endDate || apt.startDate) + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : '—'}</td>
                  <td>
                    <div className={styles.patientCell}>
                      <img
                        src={apt.patientProfilePicture || DEFAULT_AVATAR}
                        alt=""
                        className={styles.patientAvatar}
                      />
                      <strong>{apt.patientName || '—'}</strong>
                    </div>
                  </td>
                  <td>{apt.patientPhone || '—'}</td>
                  <td>{apt.patientEmail || '—'}</td>
                  <td className={styles.priceTeal}>€{apt.confirmedPrice}</td>
                  <td>{apt.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reschedule requests — patient asked for new times */}
      {rawOffers.filter((o) => o.status === 'RESCHEDULE_REQUESTED').length > 0 && (
        <div className={styles.tableCard} style={{ marginTop: 28, border: '2px solid #f59e0b' }}>
          <div className={styles.toolbar}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="warning" size={16} /> Reschedule Requests — Patient asked for new time slots
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Offer ID</th>
                <th style={{ width: '35%' }}>Patient</th>
                <th style={{ width: '15%' }}>Price</th>
                <th style={{ width: '25%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rawOffers.filter((o) => o.status === 'RESCHEDULE_REQUESTED').map((o) => (
                <tr key={o.id}>
                  <td><strong>#{String(o.id).substring(0, 8)}</strong></td>
                  <td>
                    <div className={styles.patientCell}>
                      <img src={o.patientProfilePicture || DEFAULT_AVATAR} alt="" className={styles.patientAvatar} />
                      Request #{String(o.requestId).substring(0, 8)}
                    </div>
                  </td>
                  <td className={styles.priceTeal}>€{o.price}</td>
                  <td>
                    <button
                      className={styles.btnSendOffer ?? styles.iconBtn}
                      style={{ background: '#d97706', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', textAlign: 'center', width: '100%' }}
                      onClick={() => {
                        setReproposeOffer(o);
                        setReproposeSlots({ procedureDays: String(o.procedureDays || ''), variant1Start: '', variant2Start: '', price: String(o.price) });
                      }}
                    >
                      Propose New Dates
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Re-propose modal */}
      {reproposeOffer && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '16px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '14px', padding: '36px 40px',
            maxWidth: '560px', width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            boxSizing: 'border-box',
          }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 700, color: '#1a1a2e' }}>
              Propose New Treatment Dates
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '28px', lineHeight: 1.5 }}>
              Patient requested new dates for offer <strong style={{ color: '#1a1a2e' }}>#{String(reproposeOffer.id).substring(0, 8)}</strong>.
              Set the procedure length and propose 1–2 start dates. Exact times are arranged by phone.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '0.875rem', fontWeight: 600, color: '#374151',
                display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px',
              }}>
                Procedure Length (days)
                <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>required</span>
              </label>
              <input
                type="number"
                min={1}
                value={reproposeSlots.procedureDays}
                onChange={(e) => setReproposeSlots((p) => ({ ...p, procedureDays: e.target.value }))}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 14px', borderRadius: '8px',
                  border: '1.5px solid #e5e7eb', fontSize: '0.95rem', color: '#1a1a2e', outline: 'none',
                }}
              />
            </div>

            {[
              { key: 'variant1Start' as const, label: 'Option A — start date', required: true },
              { key: 'variant2Start' as const, label: 'Option B — start date', required: false },
            ].map(({ key, label, required }) => {
              const days = parseInt(String(reproposeSlots.procedureDays), 10);
              const start = reproposeSlots[key];
              const end = start && days >= 1 ? endDateFor(start, days) : '';
              return (
                <div key={key} style={{ marginBottom: '16px' }}>
                  <label style={{
                    fontSize: '0.875rem', fontWeight: 600, color: '#374151',
                    display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px',
                  }}>
                    {label}
                    {required
                      ? <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>required</span>
                      : <span style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 400 }}>optional</span>
                    }
                  </label>
                  <input
                    type="date"
                    value={reproposeSlots[key]}
                    onChange={(e) => setReproposeSlots((p) => ({ ...p, [key]: e.target.value }))}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 14px', borderRadius: '8px',
                      border: '1.5px solid #e5e7eb', fontSize: '0.95rem',
                      color: '#1a1a2e', outline: 'none',
                    }}
                  />
                  {end && (
                    <span style={{ fontSize: '0.8rem', color: '#4a3fbf', display: 'block', marginTop: '4px' }}>
                      → ends {new Date(end + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                fontSize: '0.875rem', fontWeight: 600, color: '#374151',
                display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px',
              }}>
                Update Price
                <span style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 400 }}>
                  optional — current: €{reproposeOffer.price}
                </span>
              </label>
              <input
                type="number"
                placeholder={`€${reproposeOffer.price}`}
                value={reproposeSlots.price}
                onChange={(e) => setReproposeSlots((p) => ({ ...p, price: e.target.value }))}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 14px', borderRadius: '8px',
                  border: '1.5px solid #e5e7eb', fontSize: '0.95rem', color: '#1a1a2e',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setReproposeOffer(null)}
                disabled={reproposing}
                style={{
                  padding: '11px 24px', borderRadius: '8px',
                  border: '1.5px solid #e5e7eb', background: '#fff',
                  fontSize: '0.95rem', fontWeight: 600, color: '#374151', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              {(() => {
                const incomplete = !reproposeSlots.variant1Start || !reproposeSlots.procedureDays;
                return (
              <button
                onClick={handleRepropose}
                disabled={reproposing || incomplete}
                style={{
                  padding: '11px 24px', borderRadius: '8px', border: 'none',
                  background: reproposing || incomplete ? '#c4bdf7' : '#7b68ee',
                  color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: reproposing || incomplete ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {reproposing ? 'Sending…' : 'Send New Dates'}
              </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {(modal?.type === 'edit' || modal?.type === 'view') && modal.offer && (
        <OfferFormModal offer={modal.offer} onClose={() => setModal(null)} onSubmit={handleEdit} />
      )}
      {modal?.type === 'delete' && modal.offer && (
        <DeleteModal data-testid="delete-modal" offer={modal.offer} onClose={() => setModal(null)} onConfirm={handleDelete} />
      )}

      <Toast toast={toast} />
    </div>
  );
}
