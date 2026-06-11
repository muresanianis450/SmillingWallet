package backend.model;

import backend.enums.DentalSpecialty;
import backend.enums.RequestStatus;
import backend.util.CityListConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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

    @Convert(converter = CityListConverter.class)
    @Column(name = "preferred_cities", length = 400)
    private List<String> preferredCities = new ArrayList<>();

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

    @Column(name = "available_from")
    private LocalDate availableFrom;

    @Column(name = "available_to")
    private LocalDate availableTo;

    public DentalRequest(UUID patientPublicId, DentalSpecialty specialty,
                         String description, List<String> preferredCities, Double budgetMax,
                         LocalDate availableFrom, LocalDate availableTo) {
        this.patientPublicId = patientPublicId;
        this.specialty = specialty;
        this.description = description;
        this.preferredCities = preferredCities != null ? preferredCities : new ArrayList<>();
        this.budgetMax = budgetMax;
        this.availableFrom = availableFrom;
        this.availableTo = availableTo;
        this.status = RequestStatus.OPEN;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
