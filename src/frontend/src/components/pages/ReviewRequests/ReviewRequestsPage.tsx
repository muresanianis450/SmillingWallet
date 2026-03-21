import React, { useState, useMemo } from 'react';
import { DentalRequest } from '../../../types';
import { TREATMENT_CATEGORIES, INITIAL_REQUESTS } from '../../../data/constants';
import { usePagination } from '../../../hooks/usePagination';
import { useToast } from '../../../hooks/useToast';
import { Pagination } from '../../shared/Pagination';
import { EmptyState } from '../../shared/EmptyState';
import { Toast } from '../../shared/Toast';
import { SendOfferModal } from './SendOfferModal';
import styles from './ReviewRequestsPage.module.css';

const PER_PAGE = 7;

export function ReviewRequestsPage() {
  const [hiddenIds,  setHiddenIds]  = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [search,     setSearch]     = useState('');
  const [filterCat,  setFilterCat]  = useState('All');
  const [sendModal,  setSendModal]  = useState<DentalRequest | null>(null);
  const { toast, show: showToast }  = useToast();

  function toggleHide(id: string) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleRequests = useMemo(
    () =>
      INITIAL_REQUESTS.filter((r) => {
        const isHidden = hiddenIds.has(r.id);
        return showHidden ? isHidden : !isHidden;
      }),
    [hiddenIds, showHidden]
  );

  const filtered = useMemo(
    () =>
      visibleRequests.filter((r) => {
        const q = search.toLowerCase();
        const matchQ =
          !q ||
          r.id.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.symptoms.toLowerCase().includes(q);
        const matchC = filterCat === 'All' || r.category === filterCat;
        return matchQ && matchC;
      }),
    [visibleRequests, search, filterCat]
  );

  const { page, setPage, totalPages, slice } = usePagination<DentalRequest>(filtered, PER_PAGE);

  function handleSendOffer(fields: Record<string, any>) {
    setSendModal(null);
    showToast(`Offer sent to patient #${fields.patientId}!`, 'success');
  }

  const hiddenCount = hiddenIds.size;

  return (
    <div className={styles.page}>
      {/* ── Page Header ── */}
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Review Requests</h1>
          {hiddenCount > 0 && (
            <p className={styles.hiddenHint}>
              {hiddenCount} request{hiddenCount > 1 ? 's' : ''} hidden
            </p>
          )}
        </div>
        {hiddenCount > 0 && (
          <button
            className={`${styles.toggleHiddenBtn} ${showHidden ? styles.active : ''}`}
            onClick={() => setShowHidden((s) => !s)}
          >
            {showHidden ? '👁 Showing Hidden' : `🙈 View Hidden (${hiddenCount})`}
          </button>
        )}
      </div>

      {/* ── Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.toolbar}>
          <input
            className={styles.searchBox}
            placeholder="Search by ID, category, symptoms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.filterSel}
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option>All</option>
            {TREATMENT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Treatment Category</th>
              <th>Symptoms Summary</th>
              <th>Time Slot Available</th>
              <th>Dental CT Scan</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={showHidden ? '🙈' : '🔍'}
                    message={showHidden ? 'No hidden requests' : 'No requests found'}
                  />
                </td>
              </tr>
            ) : (
              slice.map((r) => {
                const isHidden = hiddenIds.has(r.id);
                return (
                  <tr key={r.id} style={{ opacity: isHidden ? 0.55 : 1 }}>
                    <td><strong>#{r.id}</strong></td>
                    <td>{r.category}</td>
                    <td className={styles.symptomsCell}>{r.symptoms}</td>
                    <td>{r.timeSlot}</td>
                    <td>
                      {r.ctScan ? (
                        <span className={styles.ctLink}>{r.ctScan}</span>
                      ) : (
                        <span className={styles.dash}>—</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button
                          className={styles.iconBtn}
                          title={isHidden ? 'Unhide request' : 'Hide request'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHide(r.id);
                          }}
                        >
                          {isHidden ? '🙈' : '👁'}
                        </button>
                        {!isHidden && (
                          <button
                            className={styles.btnSendOffer}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSendModal(r);
                            }}
                          >
                            + Send Offer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>

      {sendModal && (
        <SendOfferModal
          request={sendModal}
          onClose={() => setSendModal(null)}
          onSend={handleSendOffer}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
