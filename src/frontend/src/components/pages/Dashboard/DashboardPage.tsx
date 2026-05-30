import { useEffect, useState, useMemo } from 'react';
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
import { getCookie } from '../../../tracking/cookies';
// @ts-ignore
import styles from './DashboardPage.module.css';
import { IconView, IconEdit, IconDelete } from '../../shared/Icons';
import { trackEvent } from '../../../tracking/tracker';

const PER_PAGE = 5;

const STATUS_MAP: Record<string, OfferStatus> = {
  PENDING:   'Sent',
  ACCEPTED:  'Accepted',
  REJECTED:  'Declined',
  WITHDRAWN: 'Declined',
};

function mapApiOffer(o: any): Offer {
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
  };
}

export function DashboardPage() {
  usePageTracking('dashboard');

  const { toast, show: showToast } = useToast();

  const [offers,        setOffers]        = useState<Offer[]>([]);
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('All');
  const [modal,         setModal]         = useState<ModalState | null>(null);
  const [appointments,  setAppointments]  = useState<any[]>([]);

  const dentist = JSON.parse(getCookie(AUTH_COOKIE) || '{}');

  // Load dentist's sent offers
  useEffect(() => {
    if (!dentist?.id) return;
    api.get(`/offers/dentist/${dentist.id}?page=0&size=50`)
      .then((res) => setOffers((res.data.content || []).map(mapApiOffer)))
      .catch(() => {});
  }, []);

  // Load accepted appointments (includes patient identity)
  useEffect(() => {
    if (!dentist?.id) return;
    api.get(`/dashboard/clinic/${dentist.id}`)
      .then((res) => setAppointments(res.data.upcomingAppointments || []))
      .catch(() => {});
  }, []);

  const stats = useMemo(() => ({
    total:    offers.length,
    accepted: offers.filter((o) => o.status === 'Accepted').length,
  }), [offers]);

  const filtered = useMemo(
    () => offers.filter((o) => {
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
              <th>Request</th>
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
                  <EmptyState icon="📋" message="No offers sent yet" />
                </td>
              </tr>
            ) : (
              slice.map((o) => (
                <tr key={o.id} onClick={() => { setModal({ type: 'view', offer: o }); trackEvent('SEARCH', { value: o.id }); }}>
                  <td><strong>#{String(o.id).substring(0, 8)}</strong></td>
                  <td>{o.patientName}</td>
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
              <th>Date & Time</th>
              <th>Patient Name</th>
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
                  <EmptyState icon="📅" message="No accepted appointments yet" />
                </td>
              </tr>
            ) : (
              appointments.map((apt) => (
                <tr key={apt.id}>
                  <td><strong>#{apt.requestId ? String(apt.requestId).substring(0, 8) : '—'}</strong></td>
                  <td>{apt.scheduledAt ? new Date(apt.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</td>
                  <td><strong>{apt.patientName || '—'}</strong></td>
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
