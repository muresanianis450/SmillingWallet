package backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage implements Serializable {

    private String messageId;      // UUID string
    private String appointmentId;  // which chat room
    private String senderId;       // user UUID
    private String senderName;     // display name
    private String senderRole;     // "PATIENT" or "DENTIST"
    private String content;
    private Instant timestamp;

    public static ChatMessage of(String appointmentId, String senderId,
                                 String senderName, String senderRole, String content) {
        ChatMessage msg = new ChatMessage();
        msg.setMessageId(UUID.randomUUID().toString());
        msg.setAppointmentId(appointmentId);
        msg.setSenderId(senderId);
        msg.setSenderName(senderName);
        msg.setSenderRole(senderRole);
        msg.setContent(content);
        msg.setTimestamp(Instant.now());
        return msg;
    }
}