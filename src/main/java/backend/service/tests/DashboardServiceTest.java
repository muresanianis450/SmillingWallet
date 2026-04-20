package backend.service.tests;

import backend.enums.AppointmentStatus;
import backend.enums.OfferStatus;
import backend.exception.ResourceNotFoundException;
import backend.model.Appointment;
import backend.model.Offer;
import backend.repository.*;
import backend.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock private OfferRepository offerRepository;
    @Mock private RequestRepository requestRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private DashboardService dashboardService;

    private UUID dentistId;
    private UUID patientId;

    @BeforeEach
    void setUp() {
        dentistId = UUID.randomUUID();
        patientId = UUID.randomUUID();
    }

    @Test
    void getClinicStats_shouldThrow_whenDentistNotFound() {
        when(userRepository.existsById(dentistId)).thenReturn(false);
        assertThatThrownBy(() -> dashboardService.getClinicStats(dentistId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getClinicStats_shouldReturn_zeroStats_whenNoOffers() {
        when(userRepository.existsById(dentistId)).thenReturn(true);
        when(offerRepository.findByDentistPublicId(dentistId)).thenReturn(List.of());
        when(appointmentRepository.findByDentistPublicId(dentistId)).thenReturn(List.of());
        DashboardService.ClinicStatsDTO stats = dashboardService.getClinicStats(dentistId);
        assertThat(stats.getTotalOffers()).isZero();
        assertThat(stats.getAcceptanceRatePercent()).isZero();
        assertThat(stats.getTotalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getClinicStats_shouldCalculateCorrectly() {
        Offer accepted = mockOffer(OfferStatus.ACCEPTED, BigDecimal.valueOf(300));
        Offer pending = mockOffer(OfferStatus.PENDING, BigDecimal.valueOf(200));
        Offer rejected = mockOffer(OfferStatus.REJECTED, BigDecimal.valueOf(100));
        when(userRepository.existsById(dentistId)).thenReturn(true);
        when(offerRepository.findByDentistPublicId(dentistId)).thenReturn(List.of(accepted, pending, rejected));
        when(appointmentRepository.findByDentistPublicId(dentistId)).thenReturn(List.of());
        DashboardService.ClinicStatsDTO stats = dashboardService.getClinicStats(dentistId);
        assertThat(stats.getTotalOffers()).isEqualTo(3);
        assertThat(stats.getAcceptedOffers()).isEqualTo(1);
        assertThat(stats.getTotalRevenue()).isEqualByComparingTo(BigDecimal.valueOf(300));
        assertThat(stats.getAcceptanceRatePercent()).isEqualTo(33.33);
    }

    @Test
    void getClinicStats_shouldIncludeOnlyUpcomingAppointments() {
        Appointment upcoming = mockAppointment(AppointmentStatus.CONFIRMED);
        Appointment done = mockAppointment(AppointmentStatus.COMPLETED);
        when(userRepository.existsById(dentistId)).thenReturn(true);
        when(offerRepository.findByDentistPublicId(dentistId)).thenReturn(List.of());
        when(appointmentRepository.findByDentistPublicId(dentistId)).thenReturn(List.of(upcoming, done));
        DashboardService.ClinicStatsDTO stats = dashboardService.getClinicStats(dentistId);
        assertThat(stats.getUpcomingAppointments()).hasSize(1);
    }

    @Test
    void getPatientHistory_shouldThrow_whenPatientNotFound() {
        when(userRepository.existsById(patientId)).thenReturn(false);
        assertThatThrownBy(() -> dashboardService.getPatientHistory(patientId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getPatientHistory_shouldReturnRequestsAndAppointments() {
        when(userRepository.existsById(patientId)).thenReturn(true);
        when(requestRepository.findByPatientPublicId(patientId)).thenReturn(List.of());
        when(appointmentRepository.findByPatientPublicId(patientId)).thenReturn(List.of());
        DashboardService.PatientHistoryDTO history = dashboardService.getPatientHistory(patientId);
        assertThat(history.getRequests()).isEmpty();
        assertThat(history.getAppointments()).isEmpty();
    }

    private Offer mockOffer(OfferStatus status, BigDecimal price) {
        Offer o = new Offer(UUID.randomUUID(), dentistId, price, 5, "note", false, false);
        o.setStatus(status);
        return o;
    }

    private Appointment mockAppointment(AppointmentStatus status) {
        Appointment a = new Appointment(UUID.randomUUID(), patientId, dentistId,
                LocalDateTime.now().plusDays(1), BigDecimal.valueOf(200));
        a.setStatus(status);
        return a;
    }
}