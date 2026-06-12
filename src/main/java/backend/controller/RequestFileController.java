package backend.controller;

import backend.dto.DentalRequestResponseDTO;
import backend.dto.RequestFileResponseDTO;
import backend.exception.UnprocessableEntityException;
import backend.model.RequestFile;
import backend.service.FileStorageService;
import backend.service.RequestService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Attachments (CT scans / X-rays) for a dental request.
 *
 * Uploading / deleting is restricted to the request's owning patient (or admin);
 * listing is open to any authenticated user so dentists can review scans before
 * sending an offer. Path is under /api/requests/** → already auth-gated by SecurityConfig.
 */
@RestController
@RequestMapping("/api/requests/{requestId}/files")
public class RequestFileController {

    private final FileStorageService fileService;
    private final RequestService requestService;

    public RequestFileController(FileStorageService fileService, RequestService requestService) {
        this.fileService = fileService;
        this.requestService = requestService;
    }

    @PostMapping
    public RequestFileResponseDTO upload(@PathVariable UUID requestId,
                                         @RequestParam("file") MultipartFile file) {
        UUID currentUser = currentUserId();
        requireOwnerOrAdmin(requestId, currentUser);
        return fileService.upload(requestId, currentUser, file);
    }

    @GetMapping
    public List<RequestFileResponseDTO> list(@PathVariable UUID requestId) {
        // 404 if the request doesn't exist
        requestService.findById(requestId);
        return fileService.listForRequest(requestId);
    }

    @DeleteMapping("/{fileId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID requestId, @PathVariable UUID fileId) {
        requireOwnerOrAdmin(requestId, currentUserId());
        RequestFile file = fileService.getOwnedOrThrow(fileId);
        if (!file.getRequestId().equals(requestId)) {
            throw new UnprocessableEntityException("File does not belong to this request");
        }
        fileService.delete(file);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return UUID.fromString(auth.getName());
    }

    private void requireOwnerOrAdmin(UUID requestId, UUID currentUser) {
        DentalRequestResponseDTO request = requestService.findById(requestId); // 404 if missing
        if (isAdmin() || request.getPatientPublicId().equals(currentUser)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "You can only modify attachments on your own request");
    }

    private static boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }
}
