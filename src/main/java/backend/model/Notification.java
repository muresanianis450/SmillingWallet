package backend.model;

import backend.enums.NotificationType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy =   GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "recipient_id",nullable = false)
    private UUID recipientId;

    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(name = "created_at",nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private NotificationType type;

    public Notification(UUID recipientId, NotificationType type, String payload) {
        this.id = UUID.randomUUID();
        this.recipientId = recipientId;
        this.type = type;
        this.payload = payload;
        this.read = false;
        this.createdAt = LocalDateTime.now();
    }
}
