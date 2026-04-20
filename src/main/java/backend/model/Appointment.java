package backend.model;

import backend.enums.AppointmentStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class Appointment {

    private UUID id;
    private UUID offerId;
    private UUID patientPublicId;
    private UUID dentistPublicId;
    private LocalDateTime scheduledAt;
    private BigDecimal confirmedPrice;
    private AppointmentStatus status;
    private LocalDateTime createdAt;


    public Appointment(UUID offerId, UUID patientPublicId, UUID dentistPublicId,
                       LocalDateTime scheduledAt, BigDecimal confirmedPrice) {
        this.id = UUID.randomUUID();
        this.offerId = offerId;
        this.patientPublicId = patientPublicId;
        this.dentistPublicId = dentistPublicId;
        this.scheduledAt = scheduledAt;
        this.confirmedPrice = confirmedPrice;
        this.status = AppointmentStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }


}
