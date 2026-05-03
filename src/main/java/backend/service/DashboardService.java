package backend.service;

import backend.dto.AppointmentResponseDTO;
import backend.dto.DentalRequestResponseDTO;
import backend.enums.AppointmentStatus;
import backend.exception.ResourceNotFoundException;
import backend.repository.AppointmentRepository;
import backend.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class DashboardService {

    @PersistenceContext
    private EntityManager em;

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public DashboardService(AppointmentRepository appointmentRepository,
                            UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    /**
     * Clinic (dentist) dashboard stats — delegates counts/revenue to get_clinic_stats().
     * Upcoming appointments are still fetched via JPA (they need sorting + DTO mapping).
     */
    @Transactional(readOnly = true)
    public ClinicStatsDTO getClinicStats(UUID dentistId) {
        if (!userRepository.existsById(dentistId)) {
            throw new ResourceNotFoundException("Dentist not found: " + dentistId);
        }

        // Call stored procedure via native SQL
        Object[] row = (Object[]) em.createNativeQuery(
                        "CALL get_clinic_stats(:dentistId, null, null, null, null, null, null)")
                .setParameter("dentistId", dentistId)
                .getSingleResult();

        long   totalOffers      = ((Number) row[1]).longValue();
        long   acceptedOffers   = ((Number) row[2]).longValue();
        long   pendingOffers    = ((Number) row[3]).longValue();
        long   rejectedOffers   = ((Number) row[4]).longValue();
        double acceptanceRate   = ((Number) row[5]).doubleValue();
        BigDecimal totalRevenue = (BigDecimal) row[6];

        List<AppointmentResponseDTO> upcomingAppointments = appointmentRepository
                .findByDentistPublicId(dentistId).stream()
                .filter(a -> a.getStatus() == AppointmentStatus.PENDING
                        || a.getStatus() == AppointmentStatus.CONFIRMED)
                .sorted((a, b) -> a.getScheduledAt().compareTo(b.getScheduledAt()))
                .map(AppointmentResponseDTO::from)
                .toList();

        return new ClinicStatsDTO(
                totalOffers, acceptedOffers, pendingOffers, rejectedOffers,
                acceptanceRate, totalRevenue, upcomingAppointments
        );
    }

    /**
     * Patient history — requests and appointments, newest first.
     */
    @Transactional(readOnly = true)
    public PatientHistoryDTO getPatientHistory(UUID patientId) {
        if (!userRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found: " + patientId);
        }

        // Call stored procedure — it populates temp tables _ph_requests and _ph_appointments
        em.createNativeQuery("CALL get_patient_history(:patientId)")
                .setParameter("patientId", patientId)
                .executeUpdate();

        @SuppressWarnings("unchecked")
        List<Object[]> reqRows = em.createNativeQuery(
                        "SELECT id, patient_public_id, description, preferred_city, " +
                                "budget_max, created_at, updated_at, status, specialty " +
                                "FROM _ph_requests")
                .getResultList();

        @SuppressWarnings("unchecked")
        List<Object[]> apptRows = em.createNativeQuery(
                        "SELECT id, offer_id, patient_public_id, dentist_public_id, " +
                                "scheduled_at, confirmed_price, created_at, status " +
                                "FROM _ph_appointments")
                .getResultList();

        List<DentalRequestResponseDTO> requests = reqRows.stream()
                .map(DentalRequestResponseDTO::fromRow)
                .toList();

        List<AppointmentResponseDTO> appointments = apptRows.stream()
                .map(AppointmentResponseDTO::fromRow)
                .toList();

        return new PatientHistoryDTO(requests, appointments);
    }

    // -------------------------------------------------------------------------
    // DTOs
    // -------------------------------------------------------------------------

    @Getter @Setter @NoArgsConstructor
    public static class ClinicStatsDTO {
        private long totalOffers;
        private long acceptedOffers;
        private long pendingOffers;
        private long rejectedOffers;
        private double acceptanceRatePercent;
        private BigDecimal totalRevenue;
        private List<AppointmentResponseDTO> upcomingAppointments;

        public ClinicStatsDTO(long totalOffers, long acceptedOffers, long pendingOffers,
                              long rejectedOffers, double acceptanceRatePercent,
                              BigDecimal totalRevenue,
                              List<AppointmentResponseDTO> upcomingAppointments) {
            this.totalOffers = totalOffers;
            this.acceptedOffers = acceptedOffers;
            this.pendingOffers = pendingOffers;
            this.rejectedOffers = rejectedOffers;
            this.acceptanceRatePercent = acceptanceRatePercent;
            this.totalRevenue = totalRevenue;
            this.upcomingAppointments = upcomingAppointments;
        }
    }

    @Getter @Setter @NoArgsConstructor
    public static class PatientHistoryDTO {
        private List<DentalRequestResponseDTO> requests;
        private List<AppointmentResponseDTO> appointments;

        public PatientHistoryDTO(List<DentalRequestResponseDTO> requests,
                                 List<AppointmentResponseDTO> appointments) {
            this.requests = requests;
            this.appointments = appointments;
        }
    }
}