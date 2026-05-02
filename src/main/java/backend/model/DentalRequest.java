package backend.model;

import backend.enums.DentalSpecialty;
import backend.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "dental_requests")
@Getter
@Setter
@NoArgsConstructor
public class DentalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "patient_public_id", nullable = false)
    private UUID patientPublicId;

    @Column(name = "description",columnDefinition = "TEXT")
    private String description;

    @Column(name = "preferred_city", length = 100)
    private String preferredCity;

    @Column(name = "budget_max")
    private Double budgetMax;

    @Column(name = "created_at",nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, updatable = false)
    private RequestStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "specialty",nullable = false, length = 50)
    private DentalSpecialty specialty;

    public DentalRequest(UUID patientPublicId, DentalSpecialty specialty,
                         String description, String preferredCity, Double budgetMax) {
        
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
