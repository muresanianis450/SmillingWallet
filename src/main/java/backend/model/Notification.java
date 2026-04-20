package backend.model;

import backend.enums.NotificationType;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class Notification {

    private UUID id;
    private UUID recipientId;
    private NotificationType type;
    private String payload;
    private boolean read;
    private LocalDateTime createdAt;


    public Notification(UUID recipientId, NotificationType type, String payload) {
        this.id = UUID.randomUUID();
        this.recipientId = recipientId;
        this.type = type;
        this.payload = payload;
        this.read = false;
        this.createdAt = LocalDateTime.now();
    }
}
