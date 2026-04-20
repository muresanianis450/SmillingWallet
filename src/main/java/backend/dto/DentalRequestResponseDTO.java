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
}
