package backend.repository;

import backend.enums.AppointmentStatus;
import backend.model.Appointment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = com.example.smillingwallet.SmilingWalletApplication.class)
@Transactional
@ActiveProfiles("test")
class AppointmentRepositoryTest {

    @Autowired
    private AppointmentRepository appointmentRepository;

    private UUID patientA;
    private UUID patientB;
    private UUID dentistA;
    private UUID dentistB;
    private UUID offerId1;
    private UUID offerId2;
    private UUID offerId3;

    private Appointment appt1;
    private Appointment appt2;
    private Appointment appt3;

    @BeforeEach
    void setUp() {
        appointmentRepository.deleteAll();

        patientA = UUID.randomUUID();
        patientB = UUID.randomUUID();
        dentistA = UUID.randomUUID();
        dentistB = UUID.randomUUID();
        offerId1 = UUID.randomUUID();
        offerId2 = UUID.randomUUID();
        offerId3 = UUID.randomUUID();

        LocalDateTime future = LocalDateTime.now().plusDays(7);

        appt1 = new Appointment(offerId1, patientA, dentistA, future, new BigDecimal("800.00"));
        appt2 = new Appointment(offerId2, patientA, dentistB, future.plusDays(1), new BigDecimal("950.00"));
        appt3 = new Appointment(offerId3, patientB, dentistA, future.plusDays(2), new BigDecimal("600.00"));

        appointmentRepository.save(appt1);
        appointmentRepository.save(appt2);
        appointmentRepository.save(appt3);
    }

    // --- CRUD ---

    @Test
    void save_andFindById_works() {
        Appointment found = appointmentRepository.findById(appt1.getId()).orElseThrow();
        assertThat(found.getConfirmedPrice()).isEqualByComparingTo("800.00");
        assertThat(found.getStatus()).isEqualTo(AppointmentStatus.PENDING);
    }

    @Test
    void update_status_works() {
        appt1.setStatus(AppointmentStatus.CONFIRMED);
        appointmentRepository.save(appt1);

        Appointment updated = appointmentRepository.findById(appt1.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(AppointmentStatus.CONFIRMED);
    }

    @Test
    void delete_works() {
        appointmentRepository.delete(appt1);
        assertThat(appointmentRepository.findById(appt1.getId())).isEmpty();
    }

    @Test
    void findAll_returnsAll() {
        assertThat(appointmentRepository.findAll()).hasSize(3);
    }

    // --- Custom queries ---

    @Test
    void findByOfferId_returnsCorrectAppointment() {
        Optional<Appointment> found = appointmentRepository.findByOfferId(offerId1);
        assertThat(found).isPresent();
        assertThat(found.get().getPatientPublicId()).isEqualTo(patientA);
    }

    @Test
    void findByOfferId_unknownOffer_returnsEmpty() {
        assertThat(appointmentRepository.findByOfferId(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findByPatientPublicId_returnsPatientAppointments() {
        List<Appointment> results = appointmentRepository.findByPatientPublicId(patientA);
        assertThat(results).hasSize(2);
        assertThat(results).allMatch(a -> a.getPatientPublicId().equals(patientA));
    }

    @Test
    void findByPatientPublicId_unknownPatient_returnsEmpty() {
        assertThat(appointmentRepository.findByPatientPublicId(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findByDentistPublicId_returnsDentistAppointments() {
        List<Appointment> results = appointmentRepository.findByDentistPublicId(dentistA);
        assertThat(results).hasSize(2);
        assertThat(results).allMatch(a -> a.getDentistPublicId().equals(dentistA));
    }

    @Test
    void findByDentistPublicId_unknownDentist_returnsEmpty() {
        assertThat(appointmentRepository.findByDentistPublicId(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findByStatus_pending_returnsAll() {
        List<Appointment> pending = appointmentRepository.findByStatus(AppointmentStatus.PENDING);
        assertThat(pending).hasSize(3);
    }

    @Test
    void findByStatus_confirmed_returnsCorrect() {
        appt2.setStatus(AppointmentStatus.CONFIRMED);
        appointmentRepository.save(appt2);

        List<Appointment> confirmed = appointmentRepository.findByStatus(AppointmentStatus.CONFIRMED);
        assertThat(confirmed).hasSize(1);
        assertThat(confirmed.get(0).getId()).isEqualTo(appt2.getId());
    }

    @Test
    void findByStatus_cancelled_returnsCorrect() {
        appt1.setStatus(AppointmentStatus.CANCELLED);
        appt3.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appt1);
        appointmentRepository.save(appt3);

        List<Appointment> cancelled = appointmentRepository.findByStatus(AppointmentStatus.CANCELLED);
        assertThat(cancelled).hasSize(2);
    }
}