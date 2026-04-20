package backend.model;

import backend.enums.OfferStatus;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class Offer {

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


    public Offer(UUID requestId, UUID dentistPublicId, BigDecimal price,
                 int estimatedWaitDays, String notes,
                 boolean includesXray, boolean includesAnesthesia) {
        this.id = UUID.randomUUID();
        this.requestId = requestId;
        this.dentistPublicId = dentistPublicId;
        this.price = price;
        this.estimatedWaitDays = estimatedWaitDays;
        this.notes = notes;
        this.includesXray = includesXray;
        this.includesAnesthesia = includesAnesthesia;
        this.status = OfferStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
