package backend.controller;

import backend.dto.ChatMessageDTO;
import backend.model.ChatMessage;
import backend.service.ChatService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * STOMP endpoint — frontend sends to /app/chat.send
     * Spring broadcasts saved message to /topic/chat/{appointmentId}
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageDTO dto) {
        ChatMessage saved = chatService.save(dto);
        messagingTemplate.convertAndSend(
                "/topic/chat/" + dto.getAppointmentId(),
                saved
        );
    }

    /**
     * REST endpoint — loads chat history on page open
     * GET /api/chat/{appointmentId}/history
     */
    @GetMapping("/api/chat/{appointmentId}/history")
    public List<ChatMessage> getHistory(@PathVariable String appointmentId) {
        return chatService.getHistory(appointmentId);
    }
}