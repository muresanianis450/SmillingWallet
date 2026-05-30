package backend.dto;

import backend.enums.OfferStatus;
import backend.model.Offer;
import backend.model.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
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
    private int estimatedWaitDays;
    private String notes;
    private boolean includesXray;
    private boolean includesAnesthesia;
    private OfferStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String patientProfilePicture;
    private String dentistProfilePicture;
    private List<LocalDateTime> proposedSlots;

    public static OfferResponseDTO from(Offer o) {
        OfferResponseDTO dto = new OfferResponseDTO();
        dto.id = o.getId();
        dto.requestId = o.getRequestId();
        dto.dentistPublicId = o.getDentistPublicId();
        dto.price = o.getPrice();
        dto.estimatedWaitDays = o.getEstimatedWaitDays();
        dto.notes = o.getNotes();
        dto.includesXray = o.isIncludesXray();
        dto.includesAnesthesia = o.isIncludesAnesthesia();
        dto.status = o.getStatus();
        dto.createdAt = o.getCreatedAt();
        dto.updatedAt = o.getUpdatedAt();
        List<LocalDateTime> slots = new ArrayList<>();
        if (o.getProposedSlot1() != null) slots.add(o.getProposedSlot1());
        if (o.getProposedSlot2() != null) slots.add(o.getProposedSlot2());
        if (o.getProposedSlot3() != null) slots.add(o.getProposedSlot3());
        dto.proposedSlots = slots;
        return dto;
    }

    public static OfferResponseDTO fromWithUsers(Offer o, User patient, User dentist) {
        OfferResponseDTO dto = from(o);
        if (patient != null) dto.patientProfilePicture = patient.getProfilePicture();
        if (dentist != null) dto.dentistProfilePicture = dentist.getProfilePicture();
        return dto;
    }
}
