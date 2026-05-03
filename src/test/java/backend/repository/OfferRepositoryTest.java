package backend.repository;

import backend.enums.DentalSpecialty;
import backend.enums.OfferStatus;
import backend.model.DentalRequest;
import backend.model.Offer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = com.example.smillingwallet.SmilingWalletApplication.class)
@Transactional
@ActiveProfiles("test")
class OfferRepositoryTest {

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private RequestRepository requestRepository;

    private UUID dentistA;
    private UUID dentistB;
    private UUID requestId;
    private Offer offer1;
    private Offer offer2;
    private Offer offer3;

    @BeforeEach
    void setUp() {
        offerRepository.deleteAll();
        requestRepository.deleteAll();

        dentistA = UUID.randomUUID();
        dentistB = UUID.randomUUID();

        DentalRequest request = new DentalRequest(UUID.randomUUID(), DentalSpecialty.ORTHODONTICS,
                "Need braces", "Cluj", 1500.0);
        requestRepository.save(request);
        requestId = request.getId();

        offer1 = new Offer(requestId, dentistA, new BigDecimal("800.00"), 5, "Includes check-up", true, false);
        offer2 = new Offer(requestId, dentistB, new BigDecimal("950.00"), 3, "Fast service", false, true);

        UUID otherRequestId = UUID.randomUUID(); // no FK constraint since offers.request_id has no FK to a missing row in H2 test
        offer3 = new Offer(otherRequestId, dentistA, new BigDecimal("600.00"), 7, null, false, false);

        offerRepository.save(offer1);
        offerRepository.save(offer2);
        offerRepository.save(offer3);
    }

    // --- CRUD ---

    @Test
    void save_andFindById_works() {
        Offer found = offerRepository.findById(offer1.getId()).orElseThrow();
        assertThat(found.getPrice()).isEqualByComparingTo("800.00");
        assertThat(found.getStatus()).isEqualTo(OfferStatus.PENDING);
    }

    @Test
    void update_status_works() {
        offer1.setStatus(OfferStatus.ACCEPTED);
        offerRepository.save(offer1);

        Offer updated = offerRepository.findById(offer1.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OfferStatus.ACCEPTED);
    }

    @Test
    void delete_works() {
        offerRepository.delete(offer1);
        assertThat(offerRepository.findById(offer1.getId())).isEmpty();
    }

    @Test
    void findAll_returnsAll() {
        assertThat(offerRepository.findAll()).hasSize(3);
    }

    // --- Custom queries ---

    @Test
    void findByRequestId_returnsOffersForRequest() {
        List<Offer> results = offerRepository.findByRequestId(requestId);
        assertThat(results).hasSize(2);
        assertThat(results).allMatch(o -> o.getRequestId().equals(requestId));
    }

    @Test
    void findByRequestId_unknownRequest_returnsEmpty() {
        assertThat(offerRepository.findByRequestId(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findByDentistPublicId_returnsCorrectOffers() {
        List<Offer> results = offerRepository.findByDentistPublicId(dentistA);
        assertThat(results).hasSize(2);
        assertThat(results).allMatch(o -> o.getDentistPublicId().equals(dentistA));
    }

    @Test
    void findByDentistPublicId_unknownDentist_returnsEmpty() {
        assertThat(offerRepository.findByDentistPublicId(UUID.randomUUID())).isEmpty();
    }

    @Test
    void findByStatus_pending_returnsAll() {
        List<Offer> pending = offerRepository.findByStatus(OfferStatus.PENDING);
        assertThat(pending).hasSize(3);
    }

    @Test
    void findByStatus_accepted_returnsCorrect() {
        offer2.setStatus(OfferStatus.ACCEPTED);
        offerRepository.save(offer2);

        List<Offer> accepted = offerRepository.findByStatus(OfferStatus.ACCEPTED);
        assertThat(accepted).hasSize(1);
        assertThat(accepted.get(0).getId()).isEqualTo(offer2.getId());
    }

    @Test
    void findByStatus_rejected_returnsCorrect() {
        offer1.setStatus(OfferStatus.REJECTED);
        offer3.setStatus(OfferStatus.REJECTED);
        offerRepository.save(offer1);
        offerRepository.save(offer3);

        List<Offer> rejected = offerRepository.findByStatus(OfferStatus.REJECTED);
        assertThat(rejected).hasSize(2);
    }
}