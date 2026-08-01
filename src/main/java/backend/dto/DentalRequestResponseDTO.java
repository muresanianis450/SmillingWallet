package backend.dto;

import backend.enums.DentalSpecialty;
import backend.enums.RequestStatus;
import backend.model.DentalRequest;
import backend.model.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
public class DentalRequestResponseDTO {
    private UUID id;
    private UUID patientPublicId;
    private DentalSpecialty specialty;
    private String description;
    private List<String> preferredCities;
    private Double budgetMax;
    private RequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String patientProfilePicture;
    private LocalDate availableFrom;
    private LocalDate availableTo;

    public static DentalRequestResponseDTO from(DentalRequest r) {
        DentalRequestResponseDTO dto = new DentalRequestResponseDTO();
        dto.id = r.getId();
        dto.patientPublicId = r.getPatientPublicId();
        dto.specialty = r.getSpecialty();
        dto.description = r.getDescription();
        dto.preferredCities = r.getPreferredCities() != null ? r.getPreferredCities() : new ArrayList<>();
        dto.budgetMax = r.getBudgetMax();
        dto.status = r.getStatus();
        dto.createdAt = r.getCreatedAt();
        dto.updatedAt = r.getUpdatedAt();
        dto.availableFrom = r.getAvailableFrom();
        dto.availableTo = r.getAvailableTo();
        return dto;
    }

    public static DentalRequestResponseDTO fromWithPatient(DentalRequest r, User patient) {
        DentalRequestResponseDTO dto = from(r);
        if (patient != null) {
            dto.patientProfilePicture = patient.getProfilePicture();
        }
        return dto;
    }

    /**
     * Maps a raw Object[] row from the _ph_requests temp table.
     * Column order: id, patient_public_id, description, preferred_cities,
     *               budget_max, created_at, updated_at, status, specialty
     */
    public static DentalRequestResponseDTO fromRow(Object[] row) {
        DentalRequestResponseDTO dto = new DentalRequestResponseDTO();
        dto.id               = UUID.fromString(row[0].toString());
        dto.patientPublicId  = UUID.fromString(row[1].toString());
        dto.description      = row[2] != null ? row[2].toString() : null;
        dto.preferredCities  = row[3] != null
                ? Arrays.stream(row[3].toString().split(","))
                        .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList())
                : new ArrayList<>();
        dto.budgetMax        = row[4] != null ? ((Number) row[4]).doubleValue() : null;
        dto.createdAt        = row[5] != null ? ((java.sql.Timestamp) row[5]).toLocalDateTime() : null;
        dto.updatedAt        = row[6] != null ? ((java.sql.Timestamp) row[6]).toLocalDateTime() : null;
        dto.status           = row[7] != null ? RequestStatus.valueOf(row[7].toString()) : null;
        dto.specialty        = row[8] != null ? DentalSpecialty.valueOf(row[8].toString()) : null;
        return dto;
    }
}
