package backend.dto;

import backend.enums.OfferStatus;
import backend.model.Offer;
import backend.model.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class OfferResponseDTO {

    private UUID id;
    private UUID requestId;
    private UUID dentistPublicId;
    private BigDecimal price;
    private int procedureDays;
    private String notes;
    private boolean includesXray;
    private boolean includesAnesthesia;
    private OfferStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String patientProfilePicture;
    private String dentistProfilePicture;
    private String dentistCity;
    private String dentistSpecialty;
    private List<Variation> variations;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Variation {
        private LocalDate startDate;
        private LocalDate endDate;

        public Variation(LocalDate startDate, LocalDate endDate) {
            this.startDate = startDate;
            this.endDate = endDate;
        }
    }

    public static OfferResponseDTO from(Offer o) {
        OfferResponseDTO dto = new OfferResponseDTO();
        dto.id = o.getId();
        dto.requestId = o.getRequestId();
        dto.dentistPublicId = o.getDentistPublicId();
        dto.price = o.getPrice();
        dto.procedureDays = o.getProcedureDays();
        dto.notes = o.getNotes();
        dto.includesXray = o.isIncludesXray();
        dto.includesAnesthesia = o.isIncludesAnesthesia();
        dto.status = o.getStatus();
        dto.createdAt = o.getCreatedAt();
        dto.updatedAt = o.getUpdatedAt();
        List<Variation> variations = new ArrayList<>();
        if (o.getVariant1Start() != null && o.getVariant1End() != null)
            variations.add(new Variation(o.getVariant1Start(), o.getVariant1End()));
        if (o.getVariant2Start() != null && o.getVariant2End() != null)
            variations.add(new Variation(o.getVariant2Start(), o.getVariant2End()));
        dto.variations = variations;
        return dto;
    }

    public static OfferResponseDTO fromWithUsers(Offer o, User patient, User dentist) {
        OfferResponseDTO dto = from(o);
        if (patient != null) dto.patientProfilePicture = patient.getProfilePicture();
        if (dentist != null) {
            dto.dentistProfilePicture = dentist.getProfilePicture();
            dto.dentistCity = dentist.getCity();
            dto.dentistSpecialty = dentist.getSpecialty() != null ? dentist.getSpecialty().name() : null;
        }
        return dto;
    }
}
