package backend.repository;

import backend.enums.RequestStatus;
import backend.model.DentalRequest;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class RequestRepository {


    private final Map<UUID, DentalRequest> store = new ConcurrentHashMap<>();

    public DentalRequest save(DentalRequest request) {
        store.put(request.getId(),request);
        return request;
    }

    public Optional<DentalRequest> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<DentalRequest> findAll() {
        return new ArrayList<>(store.values());
    }

    public List<DentalRequest> findByPatientPublicId(UUID patientPublicId) {
        return store.values().stream()
                .filter(r -> r.getPatientPublicId().equals(patientPublicId))
                .collect(Collectors.toList());
    }

    public List<DentalRequest> findByStatus(RequestStatus status) {
        return store.values().stream()
                .filter(r -> r.getStatus() == status)
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
