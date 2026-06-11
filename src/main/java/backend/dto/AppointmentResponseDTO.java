package backend.dto;

import backend.enums.AppointmentStatus;
import backend.model.Appointment;
import backend.model.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal confirmedPrice;
    private AppointmentStatus status;
    private LocalDateTime createdAt;

    // Patient contact info — only populated on the clinic dashboard (post-acceptance)
    private String patientName;
    private String patientEmail;
    private String patientPhone;
    private String patientProfilePicture;
    private UUID requestId;

    public static AppointmentResponseDTO from(Appointment a) {
        AppointmentResponseDTO dto = new AppointmentResponseDTO();
        dto.id               = a.getId();
        dto.offerId          = a.getOfferId();
        dto.patientPublicId  = a.getPatientPublicId();
        dto.dentistPublicId  = a.getDentistPublicId();
        dto.startDate        = a.getStartDate();
        dto.endDate          = a.getEndDate();
        dto.confirmedPrice   = a.getConfirmedPrice();
        dto.status           = a.getStatus();
        dto.createdAt        = a.getCreatedAt();
        return dto;
    }

    public static AppointmentResponseDTO fromWithPatient(Appointment a, User patient) {
        AppointmentResponseDTO dto = from(a);
        if (patient != null) {
            dto.patientName           = patient.getUsername();
            dto.patientEmail          = patient.getEmail();
            dto.patientPhone          = patient.getPhone();
            dto.patientProfilePicture = patient.getProfilePicture();
        }
        return dto;
    }

    public static AppointmentResponseDTO fromWithPatientAndRequest(Appointment a, User patient, UUID requestId) {
        AppointmentResponseDTO dto = fromWithPatient(a, patient);
        dto.requestId = requestId;
        return dto;
    }

    /**
     * Maps a raw Object[] row from the _ph_appointments temp table.
     * Column order: id, offer_id, patient_public_id, dentist_public_id,
     *               start_date, end_date, confirmed_price, created_at, status
     */
    public static AppointmentResponseDTO fromRow(Object[] row) {
        AppointmentResponseDTO dto = new AppointmentResponseDTO();
        dto.id               = UUID.fromString(row[0].toString());
        dto.offerId          = UUID.fromString(row[1].toString());
        dto.patientPublicId  = UUID.fromString(row[2].toString());
        dto.dentistPublicId  = UUID.fromString(row[3].toString());
        dto.startDate        = row[4] != null ? ((java.sql.Date) row[4]).toLocalDate() : null;
        dto.endDate          = row[5] != null ? ((java.sql.Date) row[5]).toLocalDate() : null;
        dto.confirmedPrice   = row[6] != null ? (BigDecimal) row[6] : null;
        dto.createdAt        = row[7] != null ? ((java.sql.Timestamp) row[7]).toLocalDateTime() : null;
        dto.status           = row[8] != null ? AppointmentStatus.valueOf(row[8].toString()) : null;
        return dto;
    }
}