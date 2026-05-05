package backend.service;

import backend.dto.ChatMessageDTO;
import backend.model.ChatMessage;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.MessageSource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final String KEY_PREFIX = "chat:";
    private static final long MAX_MESSAGES = 200;

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final MessageSource messageSource;

    public ChatService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper, MessageSource messageSource) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.objectMapper.registerModule(new JavaTimeModule());
        this.messageSource = messageSource;
    }

    /**
     * Persist a message and return it (with generated ID + timestamp)
     */
    public ChatMessage save(ChatMessageDTO chatMessageDTO) {
        //Prevent injection of malformed content
        if (chatMessageDTO.getContent() == null || chatMessageDTO.getContent().isBlank()){
            throw new IllegalArgumentException("Message content cannot be empty");
        }

        ChatMessage msg = ChatMessage.of(
                chatMessageDTO.getAppointmentId(),
                chatMessageDTO.getSenderId(),
                chatMessageDTO.getSenderName(),
                chatMessageDTO.getSenderRole(),
                chatMessageDTO.getContent().strip()
        );

        try {
            String json = objectMapper.writeValueAsString(msg);
            String key = KEY_PREFIX + chatMessageDTO.getAppointmentId();
            // Redis List - RPush keeps insertion order (oldest first)
            redisTemplate.opsForList().rightPush(key, json);
            //cap history to avoid unbounded growth
            redisTemplate.opsForList().trim(key, -MAX_MESSAGES, -1);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize chat message",e);
        }

        return msg;
    }

    /**
     * Load message history for a given appointment room.
     */
    public List<ChatMessage> getHistory(String appointmentId) {
        String key = KEY_PREFIX + appointmentId;
        List<String> jsons = redisTemplate.opsForList().range(key, 0, -1);
        if (jsons == null || jsons.isEmpty()) return Collections.emptyList();

        return jsons.stream()
                .map(json -> {
                    try {
                        return objectMapper.readValue(json, ChatMessage.class);
                    } catch (JsonProcessingException e) {
                        return null;
                    }
                })
                .filter(m -> m != null)
                .collect(Collectors.toList());
    }

}
