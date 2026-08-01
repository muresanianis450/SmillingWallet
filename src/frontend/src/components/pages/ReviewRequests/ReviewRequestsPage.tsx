import {useCallback, useEffect, useMemo, useState} from 'react';
import {useNotificationSocket} from '../../../hooks/useNotificationSocket';
import {TREATMENT_CATEGORIES} from '../../../data/constants';
import {usePagination} from '../../../hooks/usePagination';
import {useToast} from '../../../hooks/useToast';
import {Pagination} from '../../shared/Pagination';
import {EmptyState} from '../../shared/EmptyState';
import {Toast} from '../../shared/Toast';
import {SendOfferModal} from './SendOfferModal';
import {Icon} from '../../shared/Icon';
import {api} from '../../../services/api';
import styles from './ReviewRequestsPage.module.css';
import {AuthUser, DentalRequest, PageName} from '../../../types/types.ts';
import {DEFAULT_AVATAR} from '../../../assets/avatars';

const PER_PAGE = 7;

const SPECIALTY_DISPLAY: Record<string, string> = {
  GENERAL_DENTISTRY:  'General Dentistry',
  IMPLANTS:           'Implant Dentistry',
  ORTHODONTICS:       'Orthodontics',
  COSMETIC_DENTISTRY: 'Cosmetic Dentistry',
  PEDIATRIC_DENTISTRY:'Pediatric Dentistry',
  ORAL_SURGERY:       'Emergency Dentistry',
  PERIODONTICS:       'General Dentistry',
  ENDODONTICS:        'General Dentistry',
};

interface ReviewRequestsPageProps {
  setPage: (page: PageName) => void;
  user?: AuthUser | null;
}

export function ReviewRequestsPage({ setPage, user }: ReviewRequestsPageProps) {
  const [requests,   setRequests]   = useState<DentalRequest[]>([]);
  const [hiddenIds,  setHiddenIds]  = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [search,     setSearch]     = useState('');
  const [filterCat,  setFilterCat]  = useState('All');
  const [sendModal,  setSendModal]  = useState<DentalRequest | null>(null);
  const { toast, show: showToast }  = useToast();

  const specialtyMissing = user?.missingFields?.includes('specialty') ?? false;

  async function loadRequests() {
    try {
      const res = await api.get('/requests?page=0&size=50');
      setRequests(res.data.content || []);
    } catch {
      // silent
    }
  }

  // Initial load
  useEffect(() => { loadRequests(); }, []);

  // Real-time: reload when a new request is posted
  const handlePush = useCallback((type: string) => {
    if (type === 'NEW_OFFER' || type === 'GENERAL') loadRequests();
  }, []);
  useNotificationSocket(handlePush);

  function toggleHide(id: string) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleRequests = useMemo(
    () => requests.filter((r) => {
      const isHidden = hiddenIds.has(r.id);
      return showHidden ? isHidden : !isHidden;
    }),
    [requests, hiddenIds, showHidden]
  );

  const filtered = useMemo(
    () => visibleRequests.filter((r) => {
      const q = search.toLowerCase();
      const displayCat = SPECIALTY_DISPLAY[r.specialty] || r.specialty;
      const matchQ =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.patientPublicId.toLowerCase().includes(q) ||
        r.specialty.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.preferredCities || []).some((c) => c.toLowerCase().includes(q));
      const matchC = filterCat === 'All' || displayCat === filterCat;
      return matchQ && matchC;
    }),
    [visibleRequests, search, filterCat]
  );

  const { page: currentPage, setPage: setTablePage, totalPages, slice } = usePagination<DentalRequest>(filtered, PER_PAGE);

  async function handleSendOffer(fields: Record<string, any>) {
    try {
      await api.post('/offers', {
        requestId:          fields.requestId,
        dentistPublicId:    user?.id,
        price:              fields.price,
        procedureDays:      Number(fields.procedureDays) || 0,
        notes:              fields.notes || '',
        includesXray:       false,
        includesAnesthesia: false,
        variant1Start:      fields.variant1Start || null,
        variant1End:        fields.variant1End || null,
        variant2Start:      fields.variant2Start || null,
        variant2End:        fields.variant2End || null,
      });
      setSendModal(null);
      showToast('Offer sent successfully!', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to send offer.', 'error');
    }
  }

  const hiddenCount = hiddenIds.size;

  return (
    <div className={styles.page}>
      {specialtyMissing && (
        <div className={styles.specialtyWarning}>
          Your specialty is not set. You must add it before you can send offers.{' '}
          <button className={styles.goProfileLink} onClick={() => setPage('profile')} type="button">
            Go to Profile
          </button>
        </div>
      )}

      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Review Requests</h1>
          {hiddenCount > 0 && (
            <p className={styles.hiddenHint}>
              {hiddenCount} request{hiddenCount > 1 ? 's' : ''} hidden
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className={styles.toggleHiddenBtn} onClick={loadRequests} title="Refresh">
            <Icon name="refresh" size={15} /> Refresh
          </button>
          {hiddenCount > 0 && (
            <button
              className={`${styles.toggleHiddenBtn} ${showHidden ? styles.active : ''}`}
              onClick={() => setShowHidden((s) => !s)}
            >
              {showHidden ? (
                <><Icon name="eye" size={15} /> Showing Hidden</>
              ) : (
                <><Icon name="eye-off" size={15} /> View Hidden ({hiddenCount})</>
              )}
            </button>
          )}
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.toolbar}>
          <input
            className={styles.searchBox}
            placeholder="Search by specialty, description, city…"
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
              <th>Patient</th>
              <th>Specialty</th>
              <th>Description</th>
              <th>Preferred Cities</th>
              <th>Available</th>

              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={showHidden ? 'eye-off' : 'search'}
                    message={showHidden ? 'No hidden requests' : 'No open requests found'}
                  />
                </td>
              </tr>
            ) : (
              slice.map((r) => {
                const isHidden = hiddenIds.has(r.id);
                return (
                  <tr key={r.id} style={{ opacity: isHidden ? 0.55 : 1 }}>
                    <td>
                      <div className={styles.patientCell}>
                        <img
                          src={r.patientProfilePicture || DEFAULT_AVATAR}
                          alt=""
                          className={styles.patientAvatar}
                        />
                        <strong>#{r.patientPublicId.substring(0, 8)}</strong>
                      </div>
                    </td>
                    <td>{SPECIALTY_DISPLAY[r.specialty] || r.specialty}</td>
                    <td className={styles.symptomsCell}>{r.description}</td>
                    <td>{(r.preferredCities || []).join(', ') || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#4a3fbf' }}>
                      {r.availableFrom && r.availableTo ? (
                        <>
                          {new Date(r.availableFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {' → '}
                          {new Date(r.availableTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </>
                      ) : (
                        <span style={{ color: '#aaa' }}>—</span>
                      )}
                    </td>

                    <td>
                      <div className={styles.actionCell}>
                        <button
                          className={styles.iconBtn}
                          title={isHidden ? 'Unhide request' : 'Hide request'}
                          onClick={(e) => { e.stopPropagation(); toggleHide(r.id); }}
                        >
                          {isHidden ? <Icon name="eye-off" size={16} /> : <Icon name="eye" size={16} />}
                        </button>
                        {!isHidden && (
                          <button
                            data-testid="open-send-offer-btn"
                            className={styles.btnSendOffer}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (specialtyMissing) {
                                showToast('Set your specialty first — go to Profile to add it', 'error');
                                return;
                              }
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

        <Pagination page={currentPage} totalPages={totalPages} setPage={setTablePage} />
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
