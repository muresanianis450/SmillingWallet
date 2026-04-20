package backend.repository;


import backend.enums.AppointmentStatus;
import backend.model.Appointment;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class AppointmentRepository {

    private final Map<UUID, Appointment> store = new ConcurrentHashMap<>();

    public Appointment save(Appointment appointment) {
        store.put(appointment.getId(), appointment);
        return appointment;
    }

    public Optional<Appointment> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public List<Appointment> findAll() {
        return new ArrayList<>(store.values());
    }

    public Optional<Appointment> findByOfferId(UUID offerId) {
        return store.values().stream()
                .filter(a -> a.getOfferId().equals(offerId))
                .findFirst();
    }

    public List<Appointment> findByPatientPublicId(UUID patientPublicId) {
        return store.values().stream()
                .filter(a -> a.getPatientPublicId().equals(patientPublicId))
                .collect(Collectors.toList());
    }

    public List<Appointment> findByDentistPublicId(UUID dentistPublicId) {
        return store.values().stream()
                .filter(a -> a.getDentistPublicId().equals(dentistPublicId))
                .collect(Collectors.toList());
    }

    public List<Appointment> findByStatus(AppointmentStatus status) {
        return store.values().stream()
                .filter(a -> a.getStatus() == status)
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
