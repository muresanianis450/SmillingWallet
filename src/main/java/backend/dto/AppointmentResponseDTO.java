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
        dto.id               = a.getId();
        dto.offerId          = a.getOfferId();
        dto.patientPublicId  = a.getPatientPublicId();
        dto.dentistPublicId  = a.getDentistPublicId();
        dto.scheduledAt      = a.getScheduledAt();
        dto.confirmedPrice   = a.getConfirmedPrice();
        dto.status           = a.getStatus();
        dto.createdAt        = a.getCreatedAt();
        return dto;
    }

    /**
     * Maps a raw Object[] row from the _ph_appointments temp table.
     * Column order: id, offer_id, patient_public_id, dentist_public_id,
     *               scheduled_at, confirmed_price, created_at, status
     */
    public static AppointmentResponseDTO fromRow(Object[] row) {
        AppointmentResponseDTO dto = new AppointmentResponseDTO();
        dto.id               = UUID.fromString(row[0].toString());
        dto.offerId          = UUID.fromString(row[1].toString());
        dto.patientPublicId  = UUID.fromString(row[2].toString());
        dto.dentistPublicId  = UUID.fromString(row[3].toString());
        dto.scheduledAt      = row[4] != null ? ((java.sql.Timestamp) row[4]).toLocalDateTime() : null;
        dto.confirmedPrice   = row[5] != null ? (BigDecimal) row[5] : null;
        dto.createdAt        = row[6] != null ? ((java.sql.Timestamp) row[6]).toLocalDateTime() : null;
        dto.status           = row[7] != null ? AppointmentStatus.valueOf(row[7].toString()) : null;
        return dto;
    }
}