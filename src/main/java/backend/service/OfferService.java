package backend.service;

import backend.dto.*;
import backend.enums.NotificationType;
import backend.enums.OfferStatus;
import backend.enums.RequestStatus;
import backend.exception.ConflictException;
import backend.exception.ResourceNotFoundException;
import backend.exception.UnprocessableEntityException;
import backend.model.Appointment;
import backend.model.DentalRequest;
import backend.model.Offer;
import backend.model.User;
import backend.repository.AppointmentRepository;
import backend.repository.OfferRepository;
import backend.repository.RequestRepository;
import backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
public class OfferService {

    private final OfferRepository offerRepository;
    private final RequestRepository requestRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public OfferService(OfferRepository offerRepository,
                        RequestRepository requestRepository,
                        AppointmentRepository appointmentRepository,
                        UserRepository userRepository,
                        NotificationService notificationService,
                        EmailService emailService) {
        this.offerRepository = offerRepository;
        this.requestRepository = requestRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }


    /**
     * Dentist sends an offer for an open request.
     */
    public OfferResponseDTO sendOffer(OfferRequestDTO dto){
        DentalRequest request = requestRepository.findById(dto.getRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + dto.getRequestId()));

        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ConflictException("Cannot send offer — request is " + request.getStatus());
        }

        User dentist = userRepository.findById(dto.getDentistPublicId())
                .orElseThrow(() -> new ResourceNotFoundException("Dentist not found: " + dto.getDentistPublicId()));

        if (dentist.getSpecialty() == null) {
            throw new UnprocessableEntityException("Please set your specialty in your profile before sending offers");
        }

        // Prevent dentist from sending duplicate offer on the same request
        boolean alreadySent = offerRepository.findByRequestId(dto.getRequestId()).stream()
                .anyMatch(o -> o.getDentistPublicId().equals(dto.getDentistPublicId())
                        && o.getStatus() != OfferStatus.WITHDRAWN);
        if (alreadySent) {
            throw new ConflictException("You already have an active offer for this request");
        }

        Offer offer = new Offer(
                dto.getRequestId(),
                dto.getDentistPublicId(),
                dto.getPrice(),
                dto.getEstimatedWaitDays(),
                dto.getNotes(),
                dto.isIncludesXray(),
                dto.isIncludesAnesthesia(),
                dto.getProposedSlot1(),
                dto.getProposedSlot2(),
                dto.getProposedSlot3()
        );

        offerRepository.save(offer);

        // Notify patient that a new offer arrived
        notificationService.notifyPatient(
                request.getPatientPublicId(),
                NotificationType.NEW_OFFER,
                "New offer received for request " + request.getId()
        );
        userRepository.findById(request.getPatientPublicId()).ifPresent(patient ->
                emailService.sendNewOfferNotification(
                        patient.getEmail(),
                        patient.getUsername(),
                        request.getId().toString().substring(0, 8)
                )
        );

        return OfferResponseDTO.from(offer);
    }


    /**
     * Get all offers for a specific request, sorted by price ascendingly
     */
    public PagedResponseDTO<OfferResponseDTO> findOffers(UUID requestId, int page, int size) {
        if (!requestRepository.existsById(requestId)) {
            throw new ResourceNotFoundException("Request not found: " + requestId);
        }

        List<OfferResponseDTO> all = offerRepository.findByRequestId(requestId).stream()
                .sorted(Comparator.comparing(Offer::getPrice))
                .map(o -> {
                    User dentist = userRepository.findById(o.getDentistPublicId()).orElse(null);
                    return OfferResponseDTO.fromWithUsers(o, null, dentist);
                })
                .toList();
        return new PagedResponseDTO<>(all,page,size);
    }

    /**
     * Get all offers sent by a specific dentist
     */

    public PagedResponseDTO<OfferResponseDTO> findByDentist(UUID dentistPublicId, int page, int size) {
        if (!userRepository.existsById(dentistPublicId)){
            throw new ResourceNotFoundException("Dentist not found: " + dentistPublicId);
        }

        List<OfferResponseDTO> all = offerRepository.findByDentistPublicId(dentistPublicId).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(o -> {
                    User patient = requestRepository.findById(o.getRequestId())
                            .map(r -> userRepository.findById(r.getPatientPublicId()).orElse(null))
                            .orElse(null);
                    return OfferResponseDTO.fromWithUsers(o, patient, null);
                })
                .toList();

        return new PagedResponseDTO<>(all, page, size);
    }

    /**
     * Get a single offer by ID.
     */
    public OfferResponseDTO findById(UUID offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + offerId));
        return OfferResponseDTO.from(offer);
    }

    /**
     * Patient selects one of the proposed time slots.
     * DB triggers handle rejecting other offers and closing the request.
     */
    @Transactional
    public AppointmentResponseDTO selectSlot(UUID offerId, SelectSlotRequestDTO dto) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + offerId));

        if (!EnumSet.of(OfferStatus.PENDING, OfferStatus.RESCHEDULE_REQUESTED).contains(offer.getStatus())) {
            throw new ConflictException("Offer is not awaiting slot selection (status: " + offer.getStatus() + ")");
        }

        // Truncate to minutes to avoid nanosecond mismatches between JSON deserialization and DB storage.
        java.time.LocalDateTime chosen = dto.getSelectedSlot().truncatedTo(ChronoUnit.MINUTES);
        boolean validSlot = (offer.getProposedSlot1() != null && chosen.equals(offer.getProposedSlot1().truncatedTo(ChronoUnit.MINUTES)))
                || (offer.getProposedSlot2() != null && chosen.equals(offer.getProposedSlot2().truncatedTo(ChronoUnit.MINUTES)))
                || (offer.getProposedSlot3() != null && chosen.equals(offer.getProposedSlot3().truncatedTo(ChronoUnit.MINUTES)));
        if (!validSlot) {
            throw new ConflictException("Selected slot is not one of the proposed time slots");
        }

        DentalRequest request = requestRepository.findById(offer.getRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + offer.getRequestId()));

        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ConflictException("Request is no longer open");
        }

        // trg_after_offer_accepted rejects all other PENDING offers automatically
        offer.setStatus(OfferStatus.ACCEPTED);
        offerRepository.save(offer);

        // trg_after_appointment_created sets dental_request to OFFER_ACCEPTED automatically
        Appointment appointment = new Appointment(
                offer.getId(),
                request.getPatientPublicId(),
                offer.getDentistPublicId(),
                dto.getSelectedSlot(),
                offer.getPrice()
        );
        appointmentRepository.save(appointment);

        notificationService.notifyDentist(
                offer.getDentistPublicId(),
                NotificationType.OFFER_ACCEPTED,
                "Your offer was accepted! Appointment scheduled for " + dto.getSelectedSlot()
        );
        userRepository.findById(offer.getDentistPublicId()).ifPresent(dentist ->
                emailService.sendAppointmentConfirmedNotification(
                        dentist.getEmail(),
                        dentist.getUsername(),
                        dto.getSelectedSlot()
                )
        );

        return AppointmentResponseDTO.from(appointment);
    }

    /**
     * Patient requests new time slots from the dentist.
     */
    @Transactional
    public OfferResponseDTO requestReschedule(UUID offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + offerId));

        if (!EnumSet.of(OfferStatus.PENDING, OfferStatus.RESCHEDULE_REQUESTED).contains(offer.getStatus())) {
            throw new ConflictException("Cannot request reschedule — offer status is " + offer.getStatus());
        }

        offer.setStatus(OfferStatus.RESCHEDULE_REQUESTED);
        offer.setUpdatedAt(java.time.LocalDateTime.now());
        offerRepository.save(offer);

        notificationService.notifyDentist(
                offer.getDentistPublicId(),
                NotificationType.NEW_OFFER,
                "Patient requested new time slots for offer " + offerId
        );
        userRepository.findById(offer.getDentistPublicId()).ifPresent(dentist ->
                emailService.sendRescheduleRequestedNotification(
                        dentist.getEmail(),
                        dentist.getUsername(),
                        offerId.toString().substring(0, 8)
                )
        );

        return OfferResponseDTO.from(offer);
    }

    /**
     * Dentist proposes new time slots (and optionally a new price) after a reschedule request.
     */
    @Transactional
    public OfferResponseDTO reproposeSlots(UUID offerId, ReproposeSlotRequestDTO dto) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + offerId));

        if (!EnumSet.of(OfferStatus.PENDING, OfferStatus.RESCHEDULE_REQUESTED).contains(offer.getStatus())) {
            throw new ConflictException("Cannot repropose slots — offer status is " + offer.getStatus());
        }

        offer.setProposedSlot1(dto.getProposedSlot1());
        offer.setProposedSlot2(dto.getProposedSlot2());
        offer.setProposedSlot3(dto.getProposedSlot3());
        if (dto.getPrice() != null) {
            offer.setPrice(dto.getPrice());
        }
        offer.setStatus(OfferStatus.PENDING);
        offer.setUpdatedAt(java.time.LocalDateTime.now());
        offerRepository.save(offer);

        DentalRequest request = requestRepository.findById(offer.getRequestId()).orElse(null);
        if (request != null) {
            notificationService.notifyPatient(
                    request.getPatientPublicId(),
                    NotificationType.NEW_OFFER,
                    "The clinic proposed new time slots for your request"
            );
            userRepository.findById(request.getPatientPublicId()).ifPresent(patient ->
                    emailService.sendNewSlotsProposedNotification(
                            patient.getEmail(),
                            patient.getUsername(),
                            offer.getDentistPublicId().toString().substring(0, 6)
                    )
            );
        }

        return OfferResponseDTO.from(offer);
    }
}
