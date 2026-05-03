package backend.model;

import backend.enums.OfferStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "offers")
@Getter
@Setter
@NoArgsConstructor
public class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "request_id", nullable = false)
    private UUID requestId;

    @Column(name = "dentist_public_id",nullable = false)
    private UUID dentistPublicId;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "estimated_wait_days",  nullable = false)
    private int estimatedWaitDays;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "includes_xray")
    private boolean includesXray;

    @Column(name = "includes_anesthesia")
    private boolean includesAnesthesia;

    @Column(name = "created_at",nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private OfferStatus status;


    public Offer(UUID requestId, UUID dentistPublicId, BigDecimal price,
                 int estimatedWaitDays, String notes,
                 boolean includesXray, boolean includesAnesthesia) {
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
