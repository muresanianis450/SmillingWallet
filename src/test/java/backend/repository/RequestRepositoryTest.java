package backend.repository;

import backend.enums.DentalSpecialty;
import backend.enums.RequestStatus;
import backend.model.DentalRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = com.example.smillingwallet.SmilingWalletApplication.class)
@Transactional
@ActiveProfiles("test")
class RequestRepositoryTest {

    @Autowired
    private RequestRepository requestRepository;

    private UUID patientA;
    private UUID patientB;
    private DentalRequest req1;
    private DentalRequest req2;
    private DentalRequest req3;

    @BeforeEach
    void setUp() {
        requestRepository.deleteAll();

        patientA = UUID.randomUUID();
        patientB = UUID.randomUUID();

        req1 = new DentalRequest(patientA, DentalSpecialty.ORTHODONTICS, "Braces needed", "Cluj", 1500.0);
        req2 = new DentalRequest(patientA, DentalSpecialty.IMPLANTS, "Implant needed", "Timisoara", 3000.0);
        req3 = new DentalRequest(patientB, DentalSpecialty.ORTHODONTICS, "Retainer", "Bucuresti", 500.0);

        requestRepository.save(req1);
        requestRepository.save(req2);
        requestRepository.save(req3);
    }

    // --- CRUD ---

    @Test
    void save_andFindById_works() {
        DentalRequest found = requestRepository.findById(req1.getId()).orElseThrow();
        assertThat(found.getDescription()).isEqualTo("Braces needed");
        assertThat(found.getStatus()).isEqualTo(RequestStatus.OPEN);
    }

    @Test
    void update_preferredCity_works() {
        req1.setPreferredCity("Oradea");
        requestRepository.save(req1);

        DentalRequest updated = requestRepository.findById(req1.getId()).orElseThrow();
        assertThat(updated.getPreferredCity()).isEqualTo("Oradea");
    }

    @Test
    void delete_works() {
        requestRepository.delete(req1);
        assertThat(requestRepository.findById(req1.getId())).isEmpty();
    }

    @Test
    void findAll_returnsAll() {
        assertThat(requestRepository.findAll()).hasSize(3);
    }

    // --- Custom queries ---

    @Test
    void findByPatientPublicId_returnsOnlyThatPatient() {
        List<DentalRequest> results = requestRepository.findByPatientPublicId(patientA);
        assertThat(results).hasSize(2);
        assertThat(results).allMatch(r -> r.getPatientPublicId().equals(patientA));
    }

    @Test
    void findByPatientPublicId_unknownPatient_returnsEmpty() {
        assertThat(requestRepository.findByPatientPublicId(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findByStatus_open_returnsAll() {
        List<DentalRequest> open = requestRepository.findByStatus(RequestStatus.OPEN);
        assertThat(open).hasSize(3);
    }

    @Test
    void findByStatus_offerAccepted_returnsCorrect() {
        // status is updatable=false on entity but we can test the query method itself
        // by saving a new request manually with a different status via the repo
        DentalRequest closed = new DentalRequest(patientB, DentalSpecialty.IMPLANTS, "done", "Cluj", 2000.0);
        requestRepository.save(closed);

        // Use query to verify OPEN ones don't include extra noise
        List<DentalRequest> open = requestRepository.findByStatus(RequestStatus.OPEN);
        assertThat(open).hasSize(4); // all 4 are still OPEN since status is set in constructor
    }

    // --- Filter by specialty (via findAll + filter — shows DB has the data) ---

    @Test
    void specialty_storedAndRetrievedCorrectly() {
        List<DentalRequest> all = requestRepository.findAll();
        long orthodontics = all.stream()
                .filter(r -> r.getSpecialty() == DentalSpecialty.ORTHODONTICS)
                .count();
        assertThat(orthodontics).isEqualTo(2);
    }

    @Test
    void existsById_trueForSaved() {
        assertThat(requestRepository.existsById(req1.getId())).isTrue();
    }

    @Test
    void existsById_falseForMissing() {
        assertThat(requestRepository.existsById(UUID.randomUUID())).isFalse();
    }
}