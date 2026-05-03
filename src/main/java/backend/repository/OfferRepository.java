package backend.repository;


import backend.enums.OfferStatus;
import backend.model.Offer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OfferRepository extends JpaRepository<Offer, UUID> {
    List<Offer> findByRequestId(UUID requestId);
    List<Offer> findByDentistPublicId(UUID dentistPublicId);
    List<Offer> findByStatus(OfferStatus status);
}
