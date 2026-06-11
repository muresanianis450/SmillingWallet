package backend.service;

import backend.dto.DentalRequestDTO;
import backend.dto.DentalRequestResponseDTO;
import backend.dto.PagedResponseDTO;
import backend.enums.DentalSpecialty;
import backend.enums.RequestStatus;
import backend.exception.ConflictException;
import backend.exception.ResourceNotFoundException;
import backend.exception.UnprocessableEntityException;
import backend.model.DentalRequest;
import backend.model.User;
import backend.repository.OfferRepository;
import backend.repository.RequestRepository;
import backend.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RequestService {

    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    private final OfferRepository offerRepository;

    public RequestService(RequestRepository requestRepository,
                          UserRepository userRepository,
                          OfferRepository offerRepository) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.offerRepository = offerRepository;
    }

    /**
     * Patient creates a new dental treatment request
     */
    @Caching(evict = {
            @CacheEvict(value = "requests-by-patient", allEntries = true),
            @CacheEvict(value = "open-requests",         allEntries = true)
    })
    public DentalRequestResponseDTO create(DentalRequestDTO dto){

        User patient = userRepository.findById(dto.getPatientPublicId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient with id " + dto.getPatientPublicId() + " not found"));

        DentalRequest request = new DentalRequest(
                dto.getPatientPublicId(),
                dto.getSpecialty(),
                dto.getDescription(),
                dto.getPreferredCities(),
                dto.getBudgetMax(),
                dto.getAvailableFrom(),
                dto.getAvailableTo()
        );

        return DentalRequestResponseDTO.from(requestRepository.save(request));
    }

    /**
     * Geta all OPEN requests - visible to dentists browsing the marketplace.
     * Supports optional filtering by specialty and city
     */
    @Cacheable(value = "open-requests",
               key = "#dentistId + ':' + #page + ':' + #size + ':' + #specialty + ':' + #city")
    public PagedResponseDTO<DentalRequestResponseDTO> findAllForDentist(
            int page, int size,
            DentalSpecialty specialty,
            String city,
            UUID dentistId) {

        // Collect request IDs this dentist already bid on (any offer status)
        Set<UUID> alreadyOffered = offerRepository.findByDentistPublicId(dentistId)
                .stream()
                .map(o -> o.getRequestId())
                .collect(Collectors.toSet());

        // A dentist only serves their own city: scope the marketplace to requests
        // whose preferred cities include the dentist's city. The explicit `city`
        // query param can narrow further but cannot widen beyond the home city.
        String dentistCity = userRepository.findById(dentistId)
                .map(User::getCity)
                .filter(c -> c != null && !c.isBlank())
                .orElse(null);

        List<DentalRequestResponseDTO> all = requestRepository.findAll().stream()
                .filter(r -> r.getStatus() == RequestStatus.OPEN)
                .filter(r -> !alreadyOffered.contains(r.getId()))
                .filter(r -> specialty == null || r.getSpecialty() == specialty)
                .filter(r -> dentistCity == null || (r.getPreferredCities() != null
                        && r.getPreferredCities().stream().anyMatch(c -> c.equalsIgnoreCase(dentistCity))))
                .filter(r -> city == null || (r.getPreferredCities() != null
                        && r.getPreferredCities().stream().anyMatch(c -> c.equalsIgnoreCase(city))))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(r -> {
                    User patient = userRepository.findById(r.getPatientPublicId()).orElse(null);
                    return DentalRequestResponseDTO.fromWithPatient(r, patient);
                })
                .toList();

        return new PagedResponseDTO<>(all, page, size);
    }

    /**
     * Get all requests submitted by a specific patient
     */
    @Cacheable(value = "requests-by-patient", key = "#patientPublicId + ':' + #page + ':' + #size")
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
    @Caching(evict = {
            @CacheEvict(value = "requests-by-patient", allEntries = true),
            @CacheEvict(value = "open-requests",         allEntries = true)
    })
    public DentalRequestResponseDTO update(UUID id , DentalRequestDTO dto) {
        DentalRequest request = requestRepository.findById(id)
                .orElseThrow( () -> new ResourceNotFoundException("Request with id " + id + " not found") );

        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ConflictException("Only OPEN requests can be updated");
        }

        request.setDescription(dto.getDescription());
        request.setPreferredCities(dto.getPreferredCities());
        request.setBudgetMax(dto.getBudgetMax());
        request.setSpecialty(dto.getSpecialty());
        request.setAvailableFrom(dto.getAvailableFrom());
        request.setAvailableTo(dto.getAvailableTo());

        return DentalRequestResponseDTO.from(requestRepository.save(request));
    }

    /**
     * Manually close a request (patient decision - no offer accepted)
     */
    @Caching(evict = {
            @CacheEvict(value = "requests-by-patient", allEntries = true),
            @CacheEvict(value = "open-requests",         allEntries = true)
    })
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
    @Caching(evict = {
            @CacheEvict(value = "requests-by-patient", allEntries = true),
            @CacheEvict(value = "open-requests",         allEntries = true)
    })
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
