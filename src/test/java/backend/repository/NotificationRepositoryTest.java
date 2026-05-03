package backend.repository;

import backend.enums.NotificationType;
import backend.model.Notification;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = com.example.smillingwallet.SmilingWalletApplication.class)
@Transactional
@ActiveProfiles("test")
class NotificationRepositoryTest {

    @Autowired
    private NotificationRepository notificationRepository;

    private UUID recipientA;
    private UUID recipientB;
    private Notification n1;
    private Notification n2;
    private Notification n3;
    private Notification n4;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();

        recipientA = UUID.randomUUID();
        recipientB = UUID.randomUUID();

        // Build all objects fully BEFORE any save call
        n1 = new Notification(recipientA, NotificationType.NEW_OFFER, "You have a new offer");

        n2 = new Notification(recipientA, NotificationType.OFFER_ACCEPTED, "Your offer was accepted");
        n2.setRead(true); // ← BEFORE save

        n3 = new Notification(recipientB, NotificationType.OFFER_REJECTED, "Your offer was rejected");

        n4 = new Notification(recipientB, NotificationType.NEW_OFFER, "Another new offer");

        // Save all at once after all mutations
        notificationRepository.save(n1);
        notificationRepository.save(n2);
        notificationRepository.save(n3);
        notificationRepository.save(n4);
    }

    // --- CRUD ---

    @Test
    void save_andFindById_works() {
        Notification found = notificationRepository.findById(n1.getId()).orElseThrow();
        assertThat(found.getPayload()).isEqualTo("You have a new offer");
        assertThat(found.isRead()).isFalse();
    }

    @Test
    void update_markAsRead_works() {
        n1.setRead(true);
        notificationRepository.save(n1);

        Notification updated = notificationRepository.findById(n1.getId()).orElseThrow();
        assertThat(updated.isRead()).isTrue();
    }

    @Test
    void delete_works() {
        notificationRepository.delete(n1);
        assertThat(notificationRepository.findById(n1.getId())).isEmpty();
    }

    @Test
    void findAll_returnsAll() {
        assertThat(notificationRepository.findAll()).hasSize(4);
    }

    // --- Custom queries ---

    @Test
    void findByRecipientId_returnsAllForRecipient() {
        List<Notification> results = notificationRepository.findByRecipientId(recipientA);
        assertThat(results).hasSize(2);
        assertThat(results).allMatch(n -> n.getRecipientId().equals(recipientA));
    }

    @Test
    void findByRecipientId_unknownRecipient_returnsEmpty() {
        assertThat(notificationRepository.findByRecipientId(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findByRecipientIdAndRead_unread_returnsCorrect() {
        List<Notification> unread = notificationRepository.findByRecipientIdAndRead(recipientA, false);
        assertThat(unread).hasSize(1);
        assertThat(unread.get(0).getType()).isEqualTo(NotificationType.NEW_OFFER);
    }

    @Test
    void findByRecipientIdAndRead_read_returnsCorrect() {
        List<Notification> read = notificationRepository.findByRecipientIdAndRead(recipientA, true);
        assertThat(read).hasSize(1);
        assertThat(read.get(0).getType()).isEqualTo(NotificationType.OFFER_ACCEPTED);
    }

    @Test
    void findByRecipientIdAndRead_allUnreadForRecipientB() {
        List<Notification> unread = notificationRepository.findByRecipientIdAndRead(recipientB, false);
        assertThat(unread).hasSize(2);
    }

    @Test
    void findByType_newOffer_returnsBothRecipients() {
        List<Notification> newOffers = notificationRepository.findByType(NotificationType.NEW_OFFER);
        assertThat(newOffers).hasSize(2);
    }

    @Test
    void findByType_offerRejected_returnsOne() {
        List<Notification> rejected = notificationRepository.findByType(NotificationType.OFFER_REJECTED);
        assertThat(rejected).hasSize(1);
        assertThat(rejected.get(0).getRecipientId()).isEqualTo(recipientB);
    }

    @Test
    void findByType_offerAccepted_returnsOne() {
        List<Notification> accepted = notificationRepository.findByType(NotificationType.OFFER_ACCEPTED);
        assertThat(accepted).hasSize(1);
        assertThat(accepted.get(0).isRead()).isTrue();
    }
}