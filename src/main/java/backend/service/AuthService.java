package backend.service;

import backend.dto.*;
import backend.enums.Role;
import backend.exception.ResourceNotFoundException;
import backend.model.User;
import backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository){
        this.userRepository = userRepository;}


    /**
     * Register a new user (PATIENT or DENTIST)
     * Throws ConflictExceptions if email is already taken
     */
    public AuthResponseDTO register(RegisterRequestDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email is already taken");
        }
        if (dto.getRole() == Role.DENTIST) {
            if (dto.getCity() == null || dto.getCity().isBlank()) {
                throw new IllegalArgumentException("City is required for dentists");
            }
            if (dto.getSpecialty() == null) {
                throw new IllegalArgumentException("Specialty is required for dentists");
            }
        }

        User user = new User(
                dto.getEmail(),
                dto.getUsername(),
                encodePassword(dto.getPassword()),
                dto.getPhone(),
                dto.getRole()
        );
        user.setCity(dto.getCity());
        user.setAddress(dto.getAddress());
        user.setRating(dto.getRating());
        user.setSpecialty(dto.getSpecialty());

        userRepository.save(user);
        String token = generateToken(user);
        return new AuthResponseDTO(token, UserResponseDTO.from(user));
    }

    /**
     * Login with email + password
     * Throws ResourceNotFoundExceptions if email not found
     * Throws IllegalArgumentException if password doesn't match
     *
     */
    public AuthResponseDTO login(LoginRequestDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow( () -> new ResourceNotFoundException("No account found for: " + dto.getEmail()));

        if (!passwordMatches(dto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        String token = generateToken(user);
        return new AuthResponseDTO(token, UserResponseDTO.from(user));
    }

    /**
     * Load a user by username (used internally, e.g. by security layer)
     */
    public UserResponseDTO loadByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("No account found for: " + username));
        return UserResponseDTO.from(user);
    }

    /**
     * Update profile fields for an existing user
     */
    public UserResponseDTO updateProfile(UUID userId , UpdateProfileRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No account found for id: " + userId));

        user.setUsername(dto.getUsername());
        user.setPhone(dto.getPhone());

        if (user.getRole() == Role.DENTIST) {
            user.setCity(dto.getCity());
            user.setAddress(dto.getAddress());
            user.setRating(dto.getRating());
            user.setSpecialty(dto.getSpecialty());
        }

        userRepository.save(user);
        return UserResponseDTO.from(user);
    }

    /**
     * Delete a user account permanently
     */
    public void deleteAccount(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("No account found for id: " + userId);
        }
        userRepository.deleteById(userId);
    }

    /**
     * Get all users (admin / dashboard use)
     * Returns a paginated result
     */
    public PagedResponseDTO<UserResponseDTO> findAll(int page, int size) {
        List<UserResponseDTO> all = userRepository.findAll().stream()
                .sorted( (a,b) -> b.getCreatedAt().compareTo(a.getCreatedAt()) )
                .map(UserResponseDTO::from)
                .toList();
        return new PagedResponseDTO<>(all,page,size);
    }

    /**
     * Get a single user by id - public-safe (no email/phone)
     */
    public UserResponseDTO findById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No account found for id: " + userId));
        return UserResponseDTO.from(user);
    }

    /**
     * Simulates password encoding
     * In production this would be BCryptPasswordEncoder.encode().
     */
    public String encodePassword(String rawPassword) {
        return "hashed_" + rawPassword;
    }
    private boolean passwordMatches(String rawPassword, String storedPassword){
        return storedPassword.equals(encodePassword(rawPassword));
    }

    /**
     * Generates a session token.
     * In production this would be a signed JWT
     */
    private String generateToken(User user){
        return "token_" + user.getId();
    }



}
