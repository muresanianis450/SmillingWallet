package backend.model;

import backend.enums.AppointmentStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "confirmed_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal confirmedPrice;

    @Column(name = "created_at", nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false,length = 30)
    private AppointmentStatus status;


    public Appointment(UUID offerId, UUID patientPublicId, UUID dentistPublicId,
                       LocalDate startDate, LocalDate endDate, BigDecimal confirmedPrice) {

        this.offerId = offerId;
        this.patientPublicId = patientPublicId;
        this.dentistPublicId = dentistPublicId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.confirmedPrice = confirmedPrice;
        this.status = AppointmentStatus.CONFIRMED;
        this.createdAt = LocalDateTime.now();
    }


}
