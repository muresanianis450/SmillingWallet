package backend.dto;

import lombok.Data;

@Data
public class ChatMessageDTO {
    private String appointmentId;
    private String senderId;
    private String senderName;
    private String senderRole;
    private String content;
}
