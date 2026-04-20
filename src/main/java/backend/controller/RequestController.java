package backend.controller;

import backend.dto.DentalRequestDTO;
import backend.dto.DentalRequestResponseDTO;
import backend.dto.PagedResponseDTO;
import backend.enums.DentalSpecialty;
import backend.service.RequestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping
    public DentalRequestResponseDTO create(@Valid @RequestBody DentalRequestDTO dto) {
        return requestService.create(dto);
    }

    //Dentist marketplace view
    @GetMapping
    public PagedResponseDTO<DentalRequestResponseDTO> findAllForDentist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) DentalSpecialty specialty,
            @RequestParam(required = false) String city
    ) {
        return requestService.findAllForDentist(page, size, specialty, city);
    }

    //Patient's own request

    @GetMapping("/patient/{patientId}")
    public PagedResponseDTO<DentalRequestResponseDTO> getForPatient(
            @PathVariable UUID patientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return requestService.findAllForPatient(patientId, page,size);
    }

    @GetMapping("/{id}")
    public DentalRequestResponseDTO getById(@PathVariable UUID id) {
        return requestService.findById(id);
    }

    @PutMapping("/{id}")
    public DentalRequestResponseDTO update (
            @PathVariable UUID id,
            @Valid @RequestBody DentalRequestDTO dto
    ){
        return requestService.update(id,dto);
    }

    @PatchMapping("/{id}/close")
    public DentalRequestResponseDTO close(@PathVariable UUID id) {
        return requestService.close(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        requestService.delete(id);
    }

}
