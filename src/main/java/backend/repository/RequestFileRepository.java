package backend.repository;

import backend.model.RequestFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RequestFileRepository extends JpaRepository<RequestFile, UUID> {
    List<RequestFile> findByRequestIdOrderByCreatedAtAsc(UUID requestId);
    long countByRequestId(UUID requestId);
}
