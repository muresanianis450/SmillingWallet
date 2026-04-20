package backend.service;

import backend.enums.NotificationType;
import backend.exception.ResourceNotFoundException;
import backend.model.Notification;
import backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Send a notification to a patient.
     */
    public Notification notifyPatient(UUID patientId, NotificationType type, String payload) {
        return persist(patientId, type, payload);
    }

    /**
     * Send a notification to a dentist.
     */
    public Notification notifyDentist(UUID dentistId, NotificationType type, String payload) {
        return persist(dentistId, type, payload);
    }

    /**
     * Broadcast a notification to multiple recipients (e.g. all dentists).
     */
    public void broadcastToTopic(List<UUID> recipientIds, NotificationType type, String payload) {
        recipientIds.forEach(id -> persist(id, type, payload));
    }

    /**
     * Get all notifications for a recipient, sorted newest first.
     */
    public List<Notification> findByRecipient(UUID recipientId) {
        return notificationRepository.findByRecipientId(recipientId);
    }

    /**
     * Get only unread notifications for a recipient.
     */
    public List<Notification> findUnread(UUID recipientId) {
        return notificationRepository.findByRecipientIdAndRead(recipientId, false);
    }

    /**
     * Mark a notification as read.
     */
    public Notification markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found: " + notificationId));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    /**
     * Mark all notifications as read for a recipient.
     */
    public void markAllAsRead(UUID recipientId) {
        notificationRepository.findByRecipientIdAndRead(recipientId, false)
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
    }


    /**
     * Persists a notification to the in-memory store.
     * In production this would also call messagingTemplate.convertAndSend() via WebSocket.
     */
    Notification persist(UUID recipientId, NotificationType type, String payload) {
        Notification notification = new Notification(recipientId, type, payload);
        return notificationRepository.save(notification);
    }
}