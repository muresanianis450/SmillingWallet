package backend.repository;

import backend.enums.OfferStatus;
import backend.model.Offer;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class OfferRepository {

    private final Map<UUID, Offer> store = new ConcurrentHashMap<>();


    public Offer save (Offer offer) {
        store.put(offer.getId(),offer);
        return offer;
    }

    public Optional<Offer> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<Offer> findAll() {
        return new ArrayList<>(store.values());
    }

    public List<Offer> findByRequestId(UUID requestId) {
        return store.values().stream()
                .filter(r -> r.getRequestId().equals(requestId))
                .collect(Collectors.toList());
    }
    public List<Offer> findByDentistPublicId(UUID dentistPublicId) {
        return store.values().stream()
                .filter(o -> o.getDentistPublicId().equals(dentistPublicId))
                .collect(Collectors.toList());
    }

    public List<Offer> findByStatus(OfferStatus status) {
        return store.values().stream()
                .filter(o -> o.getStatus() == status)
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
