package backend.model;

import backend.enums.AppointmentStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name ="id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "offer_id", nullable = false)
    private UUID offerId;

    @Column(name = "patient_public_id",nullable = false)
    private UUID patientPublicId;

    @Column(name = "dentist_public_id",nullable = false)
    private UUID dentistPublicId;

    @Column(name = "scheduled_at",nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "confirmed_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal confirmedPrice;

    @Column(name = "created_at", nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false,length = 30)
    private AppointmentStatus status;


    public Appointment(UUID offerId, UUID patientPublicId, UUID dentistPublicId,
                       LocalDateTime scheduledAt, BigDecimal confirmedPrice) {

        this.offerId = offerId;
        this.patientPublicId = patientPublicId;
        this.dentistPublicId = dentistPublicId;
        this.scheduledAt = scheduledAt;
        this.confirmedPrice = confirmedPrice;
        this.status = AppointmentStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }


}
