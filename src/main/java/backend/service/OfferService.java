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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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


    private String buildAddress(User dentist) {
        StringBuilder sb = new StringBuilder();
        if (dentist.getAddress() != null && !dentist.getAddress().isBlank()) sb.append(dentist.getAddress());
        if (dentist.getCity() != null && !dentist.getCity().isBlank()) {
            if (!sb.isEmpty()) sb.append(", ");
            sb.append(dentist.getCity());
        }
        return sb.isEmpty() ? "Address not provided" : sb.toString();
    }

    /**
     * Validates a dentist's proposed date-range variations against the request:
     * each variation must span exactly `procedureDays` days and sit within the
     * patient's availability window. Variation A is required; Variation B optional.
     */
    private void validateVariations(DentalRequest request, int procedureDays,
                                    LocalDate v1Start, LocalDate v1End,
                                    LocalDate v2Start, LocalDate v2End) {
        if (procedureDays < 1) {
            throw new UnprocessableEntityException("Procedure must take at least 1 day");
        }
        validateVariant("Option A", v1Start, v1End, procedureDays, request);
        if (v2Start != null || v2End != null) {
            validateVariant("Option B", v2Start, v2End, procedureDays, request);
        }
    }

    private void validateVariant(String label, LocalDate start, LocalDate end,
                                 int procedureDays, DentalRequest request) {
        if (start == null || end == null) {
            throw new UnprocessableEntityException(label + " must have a start and end date");
        }
        if (end.isBefore(start)) {
            throw new UnprocessableEntityException(label + " end date cannot be before its start date");
        }
        long span = ChronoUnit.DAYS.between(start, end) + 1;
        if (span != procedureDays) {
            throw new UnprocessableEntityException(
                    label + " must span exactly " + procedureDays + " day(s) to match the procedure length");
        }
        if (request.getAvailableFrom() != null && start.isBefore(request.getAvailableFrom())) {
            throw new UnprocessableEntityException(label + " starts before the patient's availability window");
        }
        if (request.getAvailableTo() != null && end.isAfter(request.getAvailableTo())) {
            throw new UnprocessableEntityException(label + " ends after the patient's availability window");
        }
    }

    private boolean matchesVariant(Offer offer, LocalDate start, LocalDate end) {
        boolean matchesA = offer.getVariant1Start() != null
                && start.equals(offer.getVariant1Start()) && end.equals(offer.getVariant1End());
        boolean matchesB = offer.getVariant2Start() != null
                && start.equals(offer.getVariant2Start()) && end.equals(offer.getVariant2End());
        return matchesA || matchesB;
    }

    /**
     * Dentist sends an offer for an open request.
     */
    @Caching(evict = {
            @CacheEvict(value = "offers-by-request", allEntries = true),
            @CacheEvict(value = "offers-by-dentist",  allEntries = true),
            @CacheEvict(value = "open-requests",       allEntries = true)
    })
    public OfferResponseDTO sendOffer(OfferRequestDTO dto){
        DentalRequest request = requestRepository.findById(dto.getRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + dto.getRequestId()));

        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ConflictException("Cannot send offer — request is " + request.getStatus());
        }

        User dentist = userRepository.findById(dto.getDentistPublicId())
                .orElseThrow(() -> new ResourceNotFoundException("Dentist not found: " + dto.getDentistPublicId()));

        if (dentist.getSpecialties() == null || dentist.getSpecialties().isEmpty()) {
            throw new UnprocessableEntityException("Please set your specialty in your profile before sending offers");
        }

        // Prevent dentist from sending duplicate offer on the same request
        boolean alreadySent = offerRepository.findByRequestId(dto.getRequestId()).stream()
                .anyMatch(o -> o.getDentistPublicId().equals(dto.getDentistPublicId())
                        && o.getStatus() != OfferStatus.WITHDRAWN);
        if (alreadySent) {
            throw new ConflictException("You already have an active offer for this request");
        }

        validateVariations(request, dto.getProcedureDays(),
                dto.getVariant1Start(), dto.getVariant1End(),
                dto.getVariant2Start(), dto.getVariant2End());

        Offer offer = new Offer(
                dto.getRequestId(),
                dto.getDentistPublicId(),
                dto.getPrice(),
                dto.getProcedureDays(),
                dto.getNotes(),
                dto.isIncludesXray(),
                dto.isIncludesAnesthesia(),
                dto.getVariant1Start(),
                dto.getVariant1End(),
                dto.getVariant2Start(),
                dto.getVariant2End()
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
    @Cacheable(value = "offers-by-request", key = "#requestId + ':' + #page + ':' + #size")
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
    @Cacheable(value = "offers-by-dentist", key = "#dentistPublicId + ':' + #page + ':' + #size")
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
    @Caching(evict = {
            @CacheEvict(value = "offers-by-request",   allEntries = true),
            @CacheEvict(value = "offers-by-dentist",    allEntries = true),
            @CacheEvict(value = "open-requests",         allEntries = true),
            @CacheEvict(value = "requests-by-patient",  allEntries = true)
    })
    @Transactional
    public AppointmentResponseDTO selectSlot(UUID offerId, SelectSlotRequestDTO dto) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + offerId));

        if (!EnumSet.of(OfferStatus.PENDING, OfferStatus.RESCHEDULE_REQUESTED).contains(offer.getStatus())) {
            throw new ConflictException("Offer is not awaiting slot selection (status: " + offer.getStatus() + ")");
        }

        LocalDate chosenStart = dto.getSelectedStartDate();
        LocalDate chosenEnd = dto.getSelectedEndDate();
        if (!matchesVariant(offer, chosenStart, chosenEnd)) {
            throw new ConflictException("Selected dates are not one of the proposed options");
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
                chosenStart,
                chosenEnd,
                offer.getPrice()
        );
        appointmentRepository.save(appointment);

        notificationService.notifyDentist(
                offer.getDentistPublicId(),
                NotificationType.OFFER_ACCEPTED,
                "Your offer was accepted! Treatment scheduled for " + chosenStart + " → " + chosenEnd
        );

        // Send appointment confirmation email to patient with clinic details + payment receipt
        User dentist = userRepository.findById(offer.getDentistPublicId()).orElse(null);
        User patient = userRepository.findById(request.getPatientPublicId()).orElse(null);
        if (patient != null && dentist != null) {
            String clinicAddress = buildAddress(dentist);
            String transactionId = appointment.getId().toString().substring(0, 8).toUpperCase();
            emailService.sendAppointmentConfirmedNotification(
                    patient.getEmail(),
                    patient.getUsername(),
                    dentist.getUsername(),
                    clinicAddress,
                    chosenStart,
                    chosenEnd,
                    transactionId
            );
            // Payment confirmation — 1% platform fee
            String feeAmount = String.format("%.2f", offer.getPrice().doubleValue() * 0.01);
            emailService.sendPaymentConfirmation(
                    patient.getEmail(),
                    patient.getUsername(),
                    dentist.getUsername(),
                    feeAmount,
                    transactionId
            );
        }

        return AppointmentResponseDTO.from(appointment);
    }

    /**
     * Patient requests new time slots from the dentist.
     */
    @Caching(evict = {
            @CacheEvict(value = "offers-by-request", allEntries = true),
            @CacheEvict(value = "offers-by-dentist",  allEntries = true)
    })
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
    @Caching(evict = {
            @CacheEvict(value = "offers-by-request", allEntries = true),
            @CacheEvict(value = "offers-by-dentist",  allEntries = true)
    })
    @Transactional
    public OfferResponseDTO reproposeSlots(UUID offerId, ReproposeSlotRequestDTO dto) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + offerId));

        if (!EnumSet.of(OfferStatus.PENDING, OfferStatus.RESCHEDULE_REQUESTED).contains(offer.getStatus())) {
            throw new ConflictException("Cannot repropose slots — offer status is " + offer.getStatus());
        }

        DentalRequest request = requestRepository.findById(offer.getRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + offer.getRequestId()));

        validateVariations(request, dto.getProcedureDays(),
                dto.getVariant1Start(), dto.getVariant1End(),
                dto.getVariant2Start(), dto.getVariant2End());

        offer.setProcedureDays(dto.getProcedureDays());
        offer.setVariant1Start(dto.getVariant1Start());
        offer.setVariant1End(dto.getVariant1End());
        offer.setVariant2Start(dto.getVariant2Start());
        offer.setVariant2End(dto.getVariant2End());
        if (dto.getPrice() != null) {
            offer.setPrice(dto.getPrice());
        }
        offer.setStatus(OfferStatus.PENDING);
        offer.setUpdatedAt(java.time.LocalDateTime.now());
        offerRepository.save(offer);

        notificationService.notifyPatient(
                request.getPatientPublicId(),
                NotificationType.NEW_OFFER,
                "The clinic proposed new treatment dates for your request"
        );
        userRepository.findById(request.getPatientPublicId()).ifPresent(patient ->
                emailService.sendNewSlotsProposedNotification(
                        patient.getEmail(),
                        patient.getUsername(),
                        offer.getDentistPublicId().toString().substring(0, 6)
                )
        );

        return OfferResponseDTO.from(offer);
    }
}
