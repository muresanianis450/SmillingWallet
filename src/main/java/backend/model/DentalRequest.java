package backend.model;

import backend.enums.DentalSpecialty;
import backend.enums.RequestStatus;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class DentalRequest {

    private UUID id;
    private UUID patientPublicId;
    private DentalSpecialty specialty;
    private String description;
    private String preferredCity;
    private Double budgetMax;
    private RequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


    public DentalRequest(UUID patientPublicId, DentalSpecialty specialty,
                         String description, String preferredCity, Double budgetMax) {
        this.id = UUID.randomUUID();
        this.patientPublicId = patientPublicId;
        this.specialty = specialty;
        this.description = description;
        this.preferredCity = preferredCity;
        this.budgetMax = budgetMax;
        this.status = RequestStatus.OPEN;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }


}
