package backend.controller;

import backend.dto.*;
import backend.service.OfferService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/offers")
public class OfferController {

    private final OfferService offerService;

    public OfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @PostMapping
    public OfferResponseDTO sendOffer(@Valid @RequestBody OfferRequestDTO dto) {
        return offerService.sendOffer(dto);
    }

    @GetMapping("/{offerId}")
    public OfferResponseDTO getById(@PathVariable UUID offerId) {
        return offerService.findById(offerId);
    }

    @GetMapping("/request/{requestId}")
    public PagedResponseDTO<OfferResponseDTO> getForRequest(
            @PathVariable UUID requestId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return offerService.findOffers(requestId, page,size);
    }

    @GetMapping("/dentist/{dentistId}")
    public PagedResponseDTO<OfferResponseDTO>  getForDentist(
            @PathVariable UUID dentistId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return offerService.findByDentist(dentistId, page,size);
    }

    @PatchMapping("/{offerId}/select-slot")
    public AppointmentResponseDTO selectSlot(
            @PathVariable UUID offerId,
            @Valid @RequestBody SelectSlotRequestDTO dto
    ) {
        return offerService.selectSlot(offerId, dto);
    }

    @PatchMapping("/{offerId}/request-reschedule")
    public ResponseEntity<OfferResponseDTO> requestReschedule(@PathVariable UUID offerId) {
        return ResponseEntity.ok(offerService.requestReschedule(offerId));
    }

    @PatchMapping("/{offerId}/repropose-slots")
    public ResponseEntity<OfferResponseDTO> reproposeSlots(
            @PathVariable UUID offerId,
            @Valid @RequestBody ReproposeSlotRequestDTO dto
    ) {
        return ResponseEntity.ok(offerService.reproposeSlots(offerId, dto));
    }

}
