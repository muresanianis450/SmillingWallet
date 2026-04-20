package backend.repository;

import backend.enums.NotificationType;
import backend.model.Notification;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class NotificationRepository {

    private final Map<UUID, Notification> store = new ConcurrentHashMap<>();

    public Notification save(Notification notification) {
        store.put(notification.getId(), notification);
        return notification;
    }

    public Optional<Notification> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<Notification> findAll() {
        return new ArrayList<>(store.values());
    }

    public List<Notification> findByRecipientId(UUID recipientId) {
        return store.values().stream()
                .filter(n -> n.getRecipientId().equals(recipientId))
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    public List<Notification> findByRecipientIdAndRead(UUID recipientId, boolean read) {
        return store.values().stream()
                .filter(n -> n.getRecipientId().equals(recipientId) && n.isRead() == read)
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    public List<Notification> findByType(NotificationType type) {
        return store.values().stream()
                .filter(n -> n.getType() == type)
                .collect(Collectors.toList());
    }

    public boolean existsById(UUID id) {
        return store.containsKey(id);
    }

    public void deleteById(UUID id) {
        store.remove(id);
    }

    public int count() {
        return store.size();
    }

    public void clear() {
        store.clear();
    }
}
