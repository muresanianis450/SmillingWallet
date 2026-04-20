package backend.service;

import backend.dto.DentalRequestDTO;
import backend.dto.DentalRequestResponseDTO;
import backend.dto.PagedResponseDTO;
import backend.enums.DentalSpecialty;
import backend.enums.RequestStatus;
import backend.exception.ConflictException;
import backend.exception.ResourceNotFoundException;
import backend.model.DentalRequest;
import backend.repository.RequestRepository;
import backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class RequestService {

    private final RequestRepository requestRepository;
    private final UserRepository userRepository;

    public RequestService(RequestRepository requestRepository, UserRepository userRepository) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;}

    /**
     * Patient creates a new dental treatment request
     */
    public DentalRequestResponseDTO create(DentalRequestDTO dto){

        if (!userRepository.existsById(dto.getPatientPublicId())) {
            throw new ResourceNotFoundException("Patient with id " + dto.getPatientPublicId() + " not found");
        }

        DentalRequest request = new DentalRequest(
                dto.getPatientPublicId(),
                dto.getSpecialty(),
                dto.getDescription(),
                dto.getPreferredCity(),
                dto.getBudgetMax()
        );

        return DentalRequestResponseDTO.from(requestRepository.save(request));
    }

    /**
     * Geta all OPEN requests - visible to dentists browsing the marketplace.
     * Supports optional filtering by specialty and city
     */

    public PagedResponseDTO<DentalRequestResponseDTO> findAllForDentist(
            int page, int size,
            DentalSpecialty specialty,
            String city){

        List<DentalRequestResponseDTO> all = requestRepository.findAll().stream()
                .filter(r -> r.getStatus() == RequestStatus.OPEN)
                .filter(r -> specialty == null || r.getSpecialty() == specialty)
                .filter(r -> city == null || r.getPreferredCity().equalsIgnoreCase(city))
                .sorted( (a,b) -> b.getCreatedAt().compareTo(a.getCreatedAt()) ) // newest first
                .map(DentalRequestResponseDTO::from)
                .toList();

        return new PagedResponseDTO<>(all,page,size);

    }

    /**
     * Get all requests submitted by a specific patient
     */
    public PagedResponseDTO<DentalRequestResponseDTO> findAllForPatient(UUID patientPublicId, int page, int size) {
        if (!userRepository.existsById(patientPublicId)) {
            throw new ResourceNotFoundException("Patient with id " + patientPublicId + " not found");
        }

        List<DentalRequestResponseDTO> all = requestRepository.findByPatientPublicId(patientPublicId).stream()
                .sorted( (a,b) -> b.getCreatedAt().compareTo(a.getCreatedAt()) ) // newest first
                .map(DentalRequestResponseDTO::from)
                .toList();

        return new PagedResponseDTO<>(all,page,size);
    }

    /**
     * Gt a single request by ID.
     */

    public DentalRequestResponseDTO findById(UUID id) {
        DentalRequest request = requestRepository.findById(id)
                .orElseThrow( () -> new ResourceNotFoundException("Request with id " + id + " not found") );

        return DentalRequestResponseDTO.from(request);
    }

    /**
     * Update a request's description, city, budget or speciality.
     * Only allowed while status is OPEN
     */

    public DentalRequestResponseDTO update(UUID id , DentalRequestDTO dto) {
        DentalRequest request = requestRepository.findById(id)
                .orElseThrow( () -> new ResourceNotFoundException("Request with id " + id + " not found") );

        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ConflictException("Only OPEN requests can be updated");
        }

        request.setDescription(dto.getDescription());
        request.setPreferredCity(dto.getPreferredCity());
        request.setBudgetMax(dto.getBudgetMax());
        request.setSpecialty(dto.getSpecialty());

        return DentalRequestResponseDTO.from(requestRepository.save(request));
    }

    /**
     * Manually close a request (patient decision - no offer accepted)
     */

    public DentalRequestResponseDTO close (UUID id) {
        DentalRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found: " + id));

        if (request.getStatus() == RequestStatus.CLOSED || request.getStatus() == RequestStatus.CANCELLED) {
            throw new ConflictException("Request is already " + request.getStatus());
        }

        request.setStatus(RequestStatus.CLOSED);
        return DentalRequestResponseDTO.from(requestRepository.save(request));
    }

    /**
     * Delete a request - only allowed while OPEN
     */

    public void delete(UUID id) {
        DentalRequest request = requestRepository.findById(id)
                .orElseThrow( () -> new ResourceNotFoundException("Request with id " + id + " not found") );

        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ConflictException("Only OPEN requests can be deleted");
        }

        requestRepository.deleteById(id);
    }

    DentalRequest getRawById(UUID id) {
        return requestRepository.findById(id)
                .orElseThrow( () -> new ResourceNotFoundException("Request with id " + id + " not found") );
    }
    void saveRaw(DentalRequest request) {
        requestRepository.save(request);
    }

}
