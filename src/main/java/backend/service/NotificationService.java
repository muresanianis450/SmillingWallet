package backend.service;

import backend.enums.NotificationType;
import backend.exception.ResourceNotFoundException;
import backend.model.Notification;
import backend.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate      = messagingTemplate;
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
     * Persists a notification to the DB and pushes it to the recipient in real time
     * via WebSocket on /topic/notifications/{recipientId}.
     */
    Notification persist(UUID recipientId, NotificationType type, String payload) {
        Notification notification = new Notification(recipientId, type, payload);
        notificationRepository.save(notification);

        // Push to the recipient's personal topic so the frontend reacts instantly
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + recipientId,
                new NotificationPushDTO(type.name(), payload)
        );

        return notification;
    }

    /** Lightweight push payload sent over WebSocket. */
    public record NotificationPushDTO(String type, String payload) {}
}
