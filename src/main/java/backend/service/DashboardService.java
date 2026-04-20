package backend.service;

import backend.dto.AppointmentResponseDTO;
import backend.dto.DentalRequestResponseDTO;
import backend.enums.AppointmentStatus;
import backend.enums.OfferStatus;
import backend.exception.ResourceNotFoundException;
import backend.model.Offer;
import backend.repository.AppointmentRepository;
import backend.repository.OfferRepository;
import backend.repository.RequestRepository;
import backend.repository.UserRepository;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class DashboardService {

    private final OfferRepository offerRepository;
    private final RequestRepository requestRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public DashboardService(OfferRepository offerRepository,
                            RequestRepository requestRepository,
                            AppointmentRepository appointmentRepository,
                            UserRepository userRepository) {
        this.offerRepository = offerRepository;
        this.requestRepository = requestRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    /**
     * Clinic (dentist) dashboard stats.
     */
    public ClinicStatsDTO getClinicStats(UUID dentistId) {
        if (!userRepository.existsById(dentistId)) {
            throw new ResourceNotFoundException("Dentist not found: " + dentistId);
        }

        List<Offer> offers = offerRepository.findByDentistPublicId(dentistId);

        long totalOffers = offers.size();
        long acceptedOffers = offers.stream().filter(o -> o.getStatus() == OfferStatus.ACCEPTED).count();
        long pendingOffers = offers.stream().filter(o -> o.getStatus() == OfferStatus.PENDING).count();
        long rejectedOffers = offers.stream().filter(o -> o.getStatus() == OfferStatus.REJECTED).count();

        double acceptanceRate = totalOffers == 0 ? 0.0
                : BigDecimal.valueOf((double) acceptedOffers / totalOffers * 100)
                .setScale(2, RoundingMode.HALF_UP).doubleValue();

        BigDecimal totalRevenue = offers.stream()
                .filter(o -> o.getStatus() == OfferStatus.ACCEPTED)
                .map(Offer::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

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
     * Patient history — all their requests plus the accepted offer/appointment for each.
     */
    public PatientHistoryDTO getPatientHistory(UUID patientId) {
        if (!userRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found: " + patientId);
        }

        List<DentalRequestResponseDTO> requests = requestRepository
                .findByPatientPublicId(patientId).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(DentalRequestResponseDTO::from)
                .toList();

        List<AppointmentResponseDTO> appointments = appointmentRepository
                .findByPatientPublicId(patientId).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(AppointmentResponseDTO::from)
                .toList();

        return new PatientHistoryDTO(requests, appointments);
    }

    @Getter
    @Setter
    @NoArgsConstructor
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
                              BigDecimal totalRevenue, List<AppointmentResponseDTO> upcomingAppointments) {
            this.totalOffers = totalOffers;
            this.acceptedOffers = acceptedOffers;
            this.pendingOffers = pendingOffers;
            this.rejectedOffers = rejectedOffers;
            this.acceptanceRatePercent = acceptanceRatePercent;
            this.totalRevenue = totalRevenue;
            this.upcomingAppointments = upcomingAppointments;
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
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
