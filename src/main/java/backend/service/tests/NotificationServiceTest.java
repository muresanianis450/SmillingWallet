package backend.service.tests;

import backend.enums.NotificationType;
import backend.exception.ResourceNotFoundException;
import backend.model.Notification;
import backend.repository.NotificationRepository;
import backend.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private NotificationService notificationService;

    private UUID recipientId;
    private Notification notification;

    @BeforeEach
    void setUp() {
        recipientId = UUID.randomUUID();
        notification = new Notification(recipientId, NotificationType.NEW_OFFER, "test payload");
    }

    @Test
    void notifyPatient_shouldPersistAndReturn() {
        when(notificationRepository.save(any())).thenReturn(notification);
        Notification result = notificationService.notifyPatient(recipientId, NotificationType.NEW_OFFER, "payload");
        assertThat(result).isNotNull();
        verify(notificationRepository).save(any());
    }

    @Test
    void notifyDentist_shouldPersistAndReturn() {
        when(notificationRepository.save(any())).thenReturn(notification);
        Notification result = notificationService.notifyDentist(recipientId, NotificationType.OFFER_ACCEPTED, "payload");
        assertThat(result).isNotNull();
    }

    @Test
    void broadcastToTopic_shouldPersistForEachRecipient() {
        List<UUID> ids = List.of(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
        when(notificationRepository.save(any())).thenReturn(notification);
        notificationService.broadcastToTopic(ids, NotificationType.NEW_OFFER, "broadcast");
        verify(notificationRepository, times(3)).save(any());
    }

    @Test
    void findByRecipient_shouldReturnList() {
        when(notificationRepository.findByRecipientId(recipientId)).thenReturn(List.of(notification));
        assertThat(notificationService.findByRecipient(recipientId)).hasSize(1);
    }

    @Test
    void findUnread_shouldReturnUnreadOnly() {
        when(notificationRepository.findByRecipientIdAndRead(recipientId, false)).thenReturn(List.of(notification));
        assertThat(notificationService.findUnread(recipientId)).hasSize(1);
    }

    @Test
    void markAsRead_shouldThrow_whenNotFound() {
        UUID id = UUID.randomUUID();
        when(notificationRepository.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> notificationService.markAsRead(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void markAsRead_shouldSetReadTrue() {
        UUID id = UUID.randomUUID();
        when(notificationRepository.findById(id)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any())).thenReturn(notification);
        Notification result = notificationService.markAsRead(id);
        assertThat(result.isRead()).isTrue();
    }

    @Test
    void markAllAsRead_shouldMarkAll() {
        Notification n2 = new Notification(recipientId, NotificationType.OFFER_REJECTED, "other");
        when(notificationRepository.findByRecipientIdAndRead(recipientId, false))
                .thenReturn(List.of(notification, n2));
        when(notificationRepository.save(any())).thenReturn(notification);
        notificationService.markAllAsRead(recipientId);
        verify(notificationRepository, times(2)).save(any());
    }
}