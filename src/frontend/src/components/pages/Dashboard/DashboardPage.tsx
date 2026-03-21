import React, { useState, useMemo } from 'react';
import { Offer, ModalState } from '../../../types';
import { OFFER_STATUSES, INITIAL_OFFERS } from '../../../data/constants';
import { useOffers } from '../../../hooks/useOffers';
import { usePagination } from '../../../hooks/usePagination';
import { useToast } from '../../../hooks/useToast';
import { StatusBadge } from '../../shared/StatusBadge';
import { Pagination } from '../../shared/Pagination';
import { Toast } from '../../shared/Toast';
import { EmptyState } from '../../shared/EmptyState';
import { OfferFormModal } from './OfferFormModal';
import { DeleteModal } from './DeleteModal';
import styles from './DashboardPage.module.css';
import { IconView, IconEdit, IconDelete} from "../../shared/Icons";

const PER_PAGE = 5;

interface DashboardPageProps {
    offersHook: ReturnType<typeof useOffers>;
}

export function DashboardPage({ offersHook} : DashboardPageProps) {
  const { offers, updateOffer, deleteOffer, stats } = offersHook;
  const { toast, show: showToast } = useToast();

  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal,        setModal]        = useState<ModalState | null>(null);

  const filtered = useMemo(
    () =>
      offers.filter((o) => {
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
    if (!modal?.offer) return;
    updateOffer(modal.offer.id, fields);
    setModal(null);
    showToast('Offer updated!', 'success');
  }

  function handleDelete() {
    if (!modal?.offer) return;
    deleteOffer(modal.offer.id);
    setModal(null);
    showToast('Offer deleted.', 'error');
  }

  return (
    <div className={styles.page}>
      {/* ── Header + Stats ── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Clinic DashBoard</h1>
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

      {/* ── Table Card ── */}
      <div className={styles.tableCard}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <input
            className={styles.searchBox}
            placeholder="Search by offer ID or patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.filterSel}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>All</option>
            {OFFER_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
    </div>

        {/* Table */}
        <table>
          <thead>
            <tr>
              <th>Offer ID</th>
              <th>Patient Name</th>
              <th>Price Quote</th>
              <th>Date / Time</th>
              <th>Offer Status</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon="📋" message="No offers found" />
                </td>
              </tr>
            ) : (
              slice.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setModal({ type: 'view', offer: o })}
                >
                  <td><strong>#{o.id}</strong></td>
                  <td>{o.patientName}</td>
                  <td className={styles.priceTeal}>€{o.priceQuote}</td>
                  <td className={styles.dateMuted}>
                    {o.date && o.time ? `${o.date}, ${o.time}` : '—'}
                  </td>
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
                      <button className={`${styles.iconBtn} ${styles.del}`} title="Delete"
                              onClick={() => setModal({ type: 'delete', offer: o })}>
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

      {/* ── Modals ── */}
      {(modal?.type === 'edit' || modal?.type === 'view') && modal.offer && (
        <OfferFormModal
          offer={modal.offer}
          onClose={() => setModal(null)}
          onSubmit={handleEdit}
        />
      )}
      {modal?.type === 'delete' && modal.offer && (
        <DeleteModal
          offer={modal.offer}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
