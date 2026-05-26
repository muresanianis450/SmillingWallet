package backend.controller;

import backend.dto.CreateDentistRequestDTO;
import backend.dto.UserResponseDTO;
import backend.enums.Role;
import backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dentists")
public class AdminDentistController {

    private final AuthService authService;

    public AdminDentistController(AuthService authService) {
        this.authService = authService;
    }

    /** Create a dentist account and send an invitation email. */
    @PostMapping
    public ResponseEntity<UserResponseDTO> createDentist(
            @Valid @RequestBody CreateDentistRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.createDentistInvite(dto));
    }

    /** List all dentist accounts (active + pending). */
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> listDentists() {
        return ResponseEntity.ok(authService.findAllByRole(Role.DENTIST));
    }
}
