package backend.service;

import backend.dto.*;
import backend.enums.NotificationType;
import backend.enums.OfferStatus;
import backend.enums.RequestStatus;
import backend.exception.ConflictException;
import backend.exception.ResourceNotFoundException;
import backend.model.Appointment;
import backend.model.DentalRequest;
import backend.model.Offer;
import backend.repository.AppointmentRepository;
import backend.repository.OfferRepository;
import backend.repository.RequestRepository;
import backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class OfferService {

    private final OfferRepository offerRepository;
    private final RequestRepository requestRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public OfferService(OfferRepository offerRepository,
                        RequestRepository requestRepository,
                        AppointmentRepository appointmentRepository,
                        UserRepository userRepository,
                        NotificationService notificationService) {
        this.offerRepository = offerRepository;
        this.requestRepository = requestRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
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

        if (!userRepository.existsById(dto.getDentistPublicId())) {
            throw new ResourceNotFoundException("Dentist not found: " + dto.getDentistPublicId());
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
                dto.isIncludesAnesthesia()
        );

        offerRepository.save(offer);

        // Notify patient that a new offer arrived
        notificationService.notifyPatient(
                request.getPatientPublicId(),
                NotificationType.NEW_OFFER,
                "New offer received for request " + request.getId()
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
                .map(OfferResponseDTO::from)
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
                .map(OfferResponseDTO::from)
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
     * Patient accepts an offer:
     * 1. Marks accepted offer as ACCEPTED
     * 2. Rejects all other PENDING offers on the same request
     * 3. Marks the request as OFFER_ACCEPTED
     * 4. Creates an Appointment
     * 5. Notifies the winning dentist
     */
    public AppointmentResponseDTO acceptOffer(UUID offerId, AppointmentRequestDTO dto) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + offerId));

        if (offer.getStatus() != OfferStatus.PENDING) {
            throw new ConflictException("Offer is already " + offer.getStatus());
        }

        DentalRequest request = requestRepository.findById(offer.getRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + offer.getRequestId()));

        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ConflictException("Request is no longer open");
        }

        // 1. Accept this offer
        offer.setStatus(OfferStatus.ACCEPTED);
        offerRepository.save(offer);

        // 2. Reject all other pending offers on the same request
        offerRepository.findByRequestId(offer.getRequestId()).stream()
                .filter(o -> !o.getId().equals(offerId) && o.getStatus() == OfferStatus.PENDING)
                .forEach(o -> {
                    o.setStatus(OfferStatus.REJECTED);
                    offerRepository.save(o);
                    notificationService.notifyDentist(
                            o.getDentistPublicId(),
                            NotificationType.OFFER_REJECTED,
                            "Your offer for request " + request.getId() + " was not selected"
                    );
                });

        // 3. Close the request
        request.setStatus(RequestStatus.OFFER_ACCEPTED);
        requestRepository.save(request);

        // 4. Create appointment
        Appointment appointment = new Appointment(
                offer.getId(),
                request.getPatientPublicId(),
                offer.getDentistPublicId(),
                dto.getScheduledAt(),
                offer.getPrice()
        );
        appointmentRepository.save(appointment);

        // 5. Notify the winning dentist
        notificationService.notifyDentist(
                offer.getDentistPublicId(),
                NotificationType.OFFER_ACCEPTED,
                "Your offer was accepted! Appointment scheduled for " + dto.getScheduledAt()
        );

        return AppointmentResponseDTO.from(appointment);
    }
}
