package backend.service.tests;

import backend.dto.DentalRequestDTO;
import backend.dto.DentalRequestResponseDTO;
import backend.dto.PagedResponseDTO;
import backend.enums.DentalSpecialty;
import backend.enums.RequestStatus;
import backend.exception.ConflictException;
import backend.exception.ResourceNotFoundException;
import backend.model.DentalRequest;
import backend.repository.UserRepository;
import backend.service.RequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test; // Fixed: Changed from TestNG to JUnit 5
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import backend.repository.RequestRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RequestServiceTest {

    @Mock private RequestRepository requestRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private RequestService requestService;

    private UUID patientId;
    private DentalRequestDTO dto;
    private DentalRequest request;

    @BeforeEach
    void setUp() {
        patientId = UUID.randomUUID();
        dto = new DentalRequestDTO();
        dto.setPatientPublicId(patientId);
        dto.setSpecialty(DentalSpecialty.ORTHODONTICS);
        dto.setDescription("Need braces");
        dto.setPreferredCity("Cluj");
        dto.setBudgetMax(Double.valueOf(500));

        request = new DentalRequest(patientId, DentalSpecialty.ORTHODONTICS, "Need braces", "Cluj", Double.valueOf(500));
    }

    @Test
    void create_shouldThrow_whenPatientNotFound() {
        when(userRepository.existsById(patientId)).thenReturn(false);
        assertThatThrownBy(() -> requestService.create(dto))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_shouldReturnDTO_whenValid() {
        when(userRepository.existsById(patientId)).thenReturn(true);
        when(requestRepository.save(any())).thenReturn(request);
        DentalRequestResponseDTO result = requestService.create(dto);
        assertThat(result).isNotNull();
    }

    @Test
    void findById_shouldThrow_whenNotFound() {
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> requestService.findById(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findById_shouldReturnDTO_whenFound() {
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.of(request));
        assertThat(requestService.findById(id)).isNotNull();
    }

    @Test
    void findAllForDentist_shouldReturnOnlyOpenRequests() {
        // Changed BigDecimal.TEN to 10.0
        DentalRequest closed = new DentalRequest(patientId, DentalSpecialty.ORTHODONTICS, "old", "Cluj", 10.0);
        closed.setStatus(RequestStatus.CLOSED);
        when(requestRepository.findAll()).thenReturn(List.of(request, closed));
        PagedResponseDTO<DentalRequestResponseDTO> result = requestService.findAllForDentist(0, 10, null, null);
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void findAllForDentist_shouldFilterBySpecialty() {
        DentalRequest other = new DentalRequest(patientId, DentalSpecialty.IMPLANTS, "implant", "Cluj", Double.valueOf(1000));
        when(requestRepository.findAll()).thenReturn(List.of(request, other));
        PagedResponseDTO<DentalRequestResponseDTO> result = requestService.findAllForDentist(0, 10, DentalSpecialty.ORTHODONTICS, null);
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void findAllForDentist_shouldFilterByCity() {
        // Changed BigDecimal.TEN to 10.0
        DentalRequest other = new DentalRequest(patientId, DentalSpecialty.ORTHODONTICS, "desc", "Bucharest", 10.0);
        when(requestRepository.findAll()).thenReturn(List.of(request, other));
        PagedResponseDTO<DentalRequestResponseDTO> result = requestService.findAllForDentist(0, 10, null, "Cluj");
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void findAllForPatient_shouldThrow_whenPatientNotFound() {
        when(userRepository.existsById(patientId)).thenReturn(false);
        assertThatThrownBy(() -> requestService.findAllForPatient(patientId, 0, 10))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findAllForPatient_shouldReturnPagedResults() {
        when(userRepository.existsById(patientId)).thenReturn(true);
        when(requestRepository.findByPatientPublicId(patientId)).thenReturn(List.of(request));
        assertThat(requestService.findAllForPatient(patientId, 0, 10).getContent()).hasSize(1);
    }

    @Test
    void update_shouldThrow_whenNotFound() {
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> requestService.update(id, dto))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_shouldThrow_whenNotOpen() {
        request.setStatus(RequestStatus.CLOSED);
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.of(request));
        assertThatThrownBy(() -> requestService.update(id, dto))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void update_shouldUpdate_whenOpen() {
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.of(request));
        when(requestRepository.save(any())).thenReturn(request);
        assertThat(requestService.update(id, dto)).isNotNull();
    }

    @Test
    void close_shouldThrow_whenNotFound() {
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> requestService.close(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void close_shouldThrow_whenAlreadyClosed() {
        request.setStatus(RequestStatus.CLOSED);
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.of(request));
        assertThatThrownBy(() -> requestService.close(id))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void close_shouldThrow_whenCancelled() {
        request.setStatus(RequestStatus.CANCELLED);
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.of(request));
        assertThatThrownBy(() -> requestService.close(id))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void close_shouldClose_whenOpen() {
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.of(request));
        when(requestRepository.save(any())).thenReturn(request);
        assertThat(requestService.close(id)).isNotNull();
    }

    @Test
    void delete_shouldThrow_whenNotFound() {
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> requestService.delete(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_shouldThrow_whenNotOpen() {
        request.setStatus(RequestStatus.CLOSED);
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.of(request));
        assertThatThrownBy(() -> requestService.delete(id))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void delete_shouldDelete_whenOpen() {
        UUID id = UUID.randomUUID();
        when(requestRepository.findById(id)).thenReturn(Optional.of(request));
        assertThatNoException().isThrownBy(() -> requestService.delete(id));
        verify(requestRepository).deleteById(id);
    }
}