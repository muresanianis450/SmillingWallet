package backend.repository;


import backend.enums.AppointmentStatus;
import backend.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment,UUID> {
    Optional<Appointment> findByOfferId(UUID offerId);
    List<Appointment> findByPatientPublicId(UUID patientPublicId);
    List<Appointment> findByDentistPublicId(UUID dentistPublicId);
    List<Appointment> findByStatus(AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE a.scheduledAt BETWEEN :from AND :to AND a.status IN :statuses")
    List<Appointment> findUpcomingInWindow(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("statuses") List<AppointmentStatus> statuses);
}


