package backend.repository;


import backend.enums.AppointmentStatus;
import backend.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment,UUID> {
    Optional<Appointment> findByOfferId(UUID offerId);
    List<Appointment> findByPatientPublicId(UUID patientPublicId);
    List<Appointment> findByDentistPublicId(UUID dentistPublicId);
    List<Appointment> findByStatus(AppointmentStatus status);
}


