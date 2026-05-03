package backend.repository;

import backend.enums.RequestStatus;
import backend.model.DentalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RequestRepository extends JpaRepository<DentalRequest, UUID> {
    List<DentalRequest> findByPatientPublicId(UUID patientPublicId);
    List<DentalRequest> findByStatus(RequestStatus status);
}
