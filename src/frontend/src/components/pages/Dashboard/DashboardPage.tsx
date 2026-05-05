import { useEffect, useRef, useState, useMemo } from 'react';
import { Offer, ModalState } from '../../../types/types.ts';
import { OFFER_STATUSES } from '../../../data/constants';
import { useOffers } from '../../../hooks/useOffers';
import { usePagination } from '../../../hooks/usePagination';
import { useToast } from '../../../hooks/useToast';
import { StatusBadge } from '../../shared/StatusBadge';
import { Pagination } from '../../shared/Pagination';
import { Toast } from '../../shared/Toast';
import { EmptyState } from '../../shared/EmptyState';
import { OfferFormModal } from './OfferFormModal';
import { DeleteModal } from './DeleteModal';
import { usePageTracking } from '../../../hooks/useTracking';
import { useWebSocket, ChatMessage } from '../../../hooks/useWebSocket';
import { api } from '../../../services/api';
// @ts-ignore
import styles from './DashboardPage.module.css';
import { IconView, IconEdit, IconDelete } from '../../shared/Icons';
import { trackEvent } from '../../../tracking/tracker';

const PER_PAGE = 5;

interface DashboardPageProps {
  offersHook: ReturnType<typeof useOffers>;
}

export function DashboardPage({ offersHook }: DashboardPageProps) {
  usePageTracking('dashboard');

  const { offers, updateOffer, deleteOffer, stats } = offersHook;
  const { toast, show: showToast } = useToast();

  // ── Offers state ──
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal,        setModal]        = useState<ModalState | null>(null);

  // ── Chat state ──
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeApptId, setActiveApptId] = useState<string | null>(null);
  const [messages,     setMessages]     = useState<ChatMessage[]>([]);
  const [chatInput,    setChatInput]    = useState('');
  const bottomRef                       = useRef<HTMLDivElement>(null);

  const dentist = JSON.parse(localStorage.getItem('user') || '{}');

  // ── WebSocket ──
  const { connected, sendMessage } = useWebSocket({
    appointmentId: activeApptId,
    onMessage: (msg) => setMessages((prev) => [...prev, msg]),
  });

  // Load dentist appointments from backend
  useEffect(() => {
    if (!dentist?.id) return;
    api.get(`/dashboard/clinic/${dentist.id}`)
        .then((res) => {
          const appts = res.data.upcomingAppointments || [];
          setAppointments(appts);
          if (appts.length > 0) setActiveApptId(appts[0].id);
        })
        .catch(() => {});
  }, []);

  // Load chat history when switching appointment rooms
  useEffect(() => {
    if (!activeApptId) return;
    setMessages([]);
    api.get(`/chat/${activeApptId}/history`)
        .then((res) => setMessages(res.data))
        .catch(() => {});
  }, [activeApptId]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text || !activeApptId) return;
    sendMessage({
      appointmentId: activeApptId,
      senderId:   String(dentist.id),
      senderName: dentist.username || 'Clinic',
      senderRole: 'DENTIST',
      content:    text,
    });
    setChatInput('');
  };

  // ── Offers filtering ──
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
    trackEvent('EDIT_OFFER', { offerId: modal?.offer?.id });
    if (!modal?.offer) return;
    updateOffer(modal.offer.id, fields);
    setModal(null);
    showToast('Offer updated!', 'success');
  }

  function handleDelete() {
    trackEvent('DELETE_OFFER', { offerId: modal?.offer?.id });
    if (!modal?.offer) return;
    deleteOffer(modal.offer.id);
    setModal(null);
    showToast('Offer deleted.', 'error');
  }

  // ── RENDER ──
  return (
      <div className={styles.page} data-testid="dashboard-page">

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

        {/* ── Offers Table ── */}
        <div className={styles.tableCard}>
          <div className={styles.toolbar}>
            <input
                className={styles.searchBox}
                placeholder="Search by offer ID or patient…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  trackEvent('SEARCH', { value: e.target.value });
                }}
            />
            <select
                className={styles.filterSel}
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  trackEvent('SEARCH', { value: e.target.value });
                }}
            >
              <option>All</option>
              {OFFER_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <table data-testid="offers-table">
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
                        onClick={() => {
                          setModal({ type: 'view', offer: o });
                          trackEvent('SEARCH', { value: o.id });
                        }}
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
                          <button
                              data-testid="delete-offer-btn"
                              className={`${styles.iconBtn} ${styles.del}`}
                              title="Delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModal({ type: 'delete', offer: o });
                              }}
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

        {/* ── Chat ── */}
        <div className={styles.chatSection}>
          <h2 className={styles.chatTitle}>
            Patient Chat
            <span className={connected ? styles.dotOnline : styles.dotOffline} />
          </h2>

          {appointments.length === 0 ? (
              <div className={styles.chatEmpty}>
                No upcoming appointments to chat with.
              </div>
          ) : (
              <div className={styles.chatLayout}>

                {/* Appointment selector sidebar */}
                <div className={styles.chatRooms}>
                  {appointments.map((apt) => (
                      <button
                          key={apt.id}
                          className={`${styles.roomBtn} ${apt.id === activeApptId ? styles.roomBtnActive : ''}`}
                          onClick={() => setActiveApptId(apt.id)}
                      >
                        <div className={styles.roomDate}>
                          {new Date(apt.scheduledAt).toLocaleDateString([], {
                            month: 'short', day: 'numeric',
                          })}
                        </div>
                        <div className={styles.roomPrice}>€{apt.confirmedPrice}</div>
                      </button>
                  ))}
                </div>

                {/* Chat window */}
                <div className={styles.chatCard}>
                  <div className={styles.chatMessages}>
                    {messages.length === 0 && (
                        <div className={styles.chatNoMessages}>No messages yet.</div>
                    )}
                    {messages.map((msg) => {
                      const isMe = msg.senderId === String(dentist.id);
                      return (
                          <div key={msg.messageId}
                               className={isMe ? styles.msgRowMe : styles.msgRowOther}>
                            {!isMe && (
                                <div className={styles.msgAvatar}>
                                  {msg.senderName?.[0] ?? '?'}
                                </div>
                            )}
                            <div className={styles.msgBubbleWrap}>
                              {!isMe && (
                                  <div className={styles.msgSender}>{msg.senderName}</div>
                              )}
                              <div className={isMe ? styles.bubbleMe : styles.bubbleOther}>
                                {msg.content}
                              </div>
                              <div className={styles.msgTime}>
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit', minute: '2-digit',
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
                        className={styles.chatInput}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleChatSend();
                          }
                        }}
                        placeholder="Type a message… (Enter to send)"
                        maxLength={1000}
                    />
                    <button
                        className={styles.chatSendBtn}
                        onClick={handleChatSend}
                        disabled={!chatInput.trim() || !connected}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
          )}
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
                data-testid="delete-modal"
                offer={modal.offer}
                onClose={() => setModal(null)}
                onConfirm={handleDelete}
            />
        )}

        <Toast toast={toast} />
      </div>
  );
}