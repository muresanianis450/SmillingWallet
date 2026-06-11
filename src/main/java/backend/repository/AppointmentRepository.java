package backend.repository;


import backend.enums.AppointmentStatus;
import backend.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment,UUID> {
    Optional<Appointment> findByOfferId(UUID offerId);
    List<Appointment> findByPatientPublicId(UUID patientPublicId);
    List<Appointment> findByDentistPublicId(UUID dentistPublicId);
    List<Appointment> findByStatus(AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE a.startDate = :date AND a.status IN :statuses")
    List<Appointment> findStartingOn(
            @Param("date") LocalDate date,
            @Param("statuses") List<AppointmentStatus> statuses);
}


