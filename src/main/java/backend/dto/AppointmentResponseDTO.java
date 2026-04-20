package backend.dto;

import backend.enums.AppointmentStatus;
import backend.model.Appointment;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class AppointmentResponseDTO {

    private UUID id;
    private UUID offerId;
    private UUID patientPublicId;
    private UUID dentistPublicId;
    private LocalDateTime scheduledAt;
    private BigDecimal confirmedPrice;
    private AppointmentStatus status;
    private LocalDateTime createdAt;

    public static AppointmentResponseDTO from(Appointment a) {
        AppointmentResponseDTO dto = new AppointmentResponseDTO();
        dto.id = a.getId();
        dto.offerId = a.getOfferId();
        dto.patientPublicId = a.getPatientPublicId();
        dto.dentistPublicId = a.getDentistPublicId();
        dto.scheduledAt = a.getScheduledAt();
        dto.confirmedPrice = a.getConfirmedPrice();
        dto.status = a.getStatus();
        dto.createdAt = a.getCreatedAt();
        return dto;
    }
}
