// AuthServiceTest.java
package backend.service.tests;

import backend.dto.*;
import backend.enums.Role;
import backend.enums.DentalSpecialty;
import backend.exception.ResourceNotFoundException;
import backend.model.User;
import backend.repository.UserRepository;
import backend.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @InjectMocks private AuthService authService;

    private RegisterRequestDTO registerDto;
    private User user;

    @BeforeEach
    void setUp() {
        registerDto = new RegisterRequestDTO();
        registerDto.setEmail("test@test.com");
        registerDto.setUsername("testuser");
        registerDto.setPassword("pass123");
        registerDto.setPhone("0700000000");
        registerDto.setRole(Role.PATIENT);

        user = new User("test@test.com", "testuser", "hashed_pass123", "0700000000", Role.PATIENT);
    }

    @Test
    void register_shouldThrow_whenEmailTaken() {
        when(userRepository.existsByEmail(registerDto.getEmail())).thenReturn(true);
        assertThatThrownBy(() -> authService.register(registerDto))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email is already taken");
    }

    @Test
    void register_shouldThrow_whenDentistMissingCity() {
        registerDto.setRole(Role.DENTIST);
        registerDto.setSpecialty(DentalSpecialty.ORTHODONTICS);
        when(userRepository.existsByEmail(any())).thenReturn(false);
        assertThatThrownBy(() -> authService.register(registerDto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("City is required");
    }

    @Test
    void register_shouldThrow_whenDentistMissingSpecialty() {
        registerDto.setRole(Role.DENTIST);
        registerDto.setCity("Cluj");
        when(userRepository.existsByEmail(any())).thenReturn(false);
        assertThatThrownBy(() -> authService.register(registerDto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Specialty is required");
    }

    @Test
    void register_shouldSucceed_whenValid() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.save(any())).thenReturn(user);
        AuthResponseDTO result = authService.register(registerDto);
        assertThat(result).isNotNull();
        assertThat(result.getToken()).startsWith("token_");
    }

    @Test
    void login_shouldThrow_whenEmailNotFound() {
        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail("none@test.com");
        dto.setPassword("pass");
        when(userRepository.findByEmail(dto.getEmail())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.login(dto))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void login_shouldThrow_whenPasswordWrong() {
        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail("test@test.com");
        dto.setPassword("wrongpass");
        when(userRepository.findByEmail(dto.getEmail())).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> authService.login(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid password");
    }

    @Test
    void login_shouldSucceed_whenCredentialsCorrect() {
        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail("test@test.com");
        dto.setPassword("pass123");
        when(userRepository.findByEmail(dto.getEmail())).thenReturn(Optional.of(user));
        AuthResponseDTO result = authService.login(dto);
        assertThat(result.getToken()).isNotNull();
    }

    @Test
    void loadByUsername_shouldThrow_whenNotFound() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.loadByUsername("ghost"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void loadByUsername_shouldReturnDTO_whenFound() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        assertThat(authService.loadByUsername("testuser")).isNotNull();
    }

    @Test
    void updateProfile_shouldThrow_whenUserNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.updateProfile(id, new UpdateProfileRequestDTO()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateProfile_shouldUpdate_whenValid() {
        UUID id = UUID.randomUUID();
        UpdateProfileRequestDTO dto = new UpdateProfileRequestDTO();
        dto.setUsername("newname");
        dto.setPhone("0700000001");
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);
        assertThat(authService.updateProfile(id, dto)).isNotNull();
    }

    @Test
    void deleteAccount_shouldThrow_whenNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.existsById(id)).thenReturn(false);
        assertThatThrownBy(() -> authService.deleteAccount(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteAccount_shouldDelete_whenFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.existsById(id)).thenReturn(true);
        assertThatNoException().isThrownBy(() -> authService.deleteAccount(id));
        verify(userRepository).deleteById(id);
    }

    @Test
    void findAll_shouldReturnPagedResults() {
        when(userRepository.findAll()).thenReturn(List.of(user));
        assertThat(authService.findAll(0, 10).getContent()).hasSize(1);
    }

    @Test
    void findById_shouldThrow_whenNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.findById(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void encodePassword_shouldPrefixWithHashed() {
        assertThat(authService.encodePassword("mypass")).isEqualTo("hashed_mypass");
    }
}