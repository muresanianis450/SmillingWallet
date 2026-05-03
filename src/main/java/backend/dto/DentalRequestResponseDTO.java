package backend.dto;

import backend.enums.DentalSpecialty;
import backend.enums.RequestStatus;
import backend.model.DentalRequest;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class DentalRequestResponseDTO {
    private UUID id;
    private UUID patientPublicId;
    private DentalSpecialty specialty;
    private String description;
    private String preferredCity;
    private Double budgetMax;
    private RequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DentalRequestResponseDTO from(DentalRequest r) {
        DentalRequestResponseDTO dto = new DentalRequestResponseDTO();
        dto.id = r.getId();
        dto.patientPublicId = r.getPatientPublicId();
        dto.specialty = r.getSpecialty();
        dto.description = r.getDescription();
        dto.preferredCity = r.getPreferredCity();
        dto.budgetMax = r.getBudgetMax();
        dto.status = r.getStatus();
        dto.createdAt = r.getCreatedAt();
        dto.updatedAt = r.getUpdatedAt();
        return dto;
    }

    /**
     * Maps a raw Object[] row from the _ph_requests temp table.
     * Column order: id, patient_public_id, description, preferred_city,
     *               budget_max, created_at, updated_at, status, specialty
     */
    public static DentalRequestResponseDTO fromRow(Object[] row) {
        DentalRequestResponseDTO dto = new DentalRequestResponseDTO();
        dto.id               = UUID.fromString(row[0].toString());
        dto.patientPublicId  = UUID.fromString(row[1].toString());
        dto.description      = row[2] != null ? row[2].toString() : null;
        dto.preferredCity    = row[3] != null ? row[3].toString() : null;
        dto.budgetMax        = row[4] != null ? ((Number) row[4]).doubleValue() : null;
        dto.createdAt        = row[5] != null ? ((java.sql.Timestamp) row[5]).toLocalDateTime() : null;
        dto.updatedAt        = row[6] != null ? ((java.sql.Timestamp) row[6]).toLocalDateTime() : null;
        dto.status           = row[7] != null ? RequestStatus.valueOf(row[7].toString()) : null;
        dto.specialty        = row[8] != null ? DentalSpecialty.valueOf(row[8].toString()) : null;
        return dto;
    }
}