package backend.dto;

import backend.model.RequestFile;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * What the frontend gets for one attachment. {@code previewable} drives the UI
 * branch (inline {@code <img>} vs download tile); {@code url} is a short-lived
 * presigned link the browser can hit directly.
 */
@Getter
@Setter
@NoArgsConstructor
public class RequestFileResponseDTO {
    private UUID id;
    private String fileName;
    private String contentType;
    private long sizeBytes;
    private boolean previewable;
    private String url;
    private LocalDateTime createdAt;

    public static RequestFileResponseDTO from(RequestFile f, String url) {
        RequestFileResponseDTO dto = new RequestFileResponseDTO();
        dto.id = f.getId();
        dto.fileName = f.getFileName();
        dto.contentType = f.getContentType();
        dto.sizeBytes = f.getSizeBytes();
        dto.previewable = isPreviewable(f.getContentType());
        dto.url = url;
        dto.createdAt = f.getCreatedAt();
        return dto;
    }

    /** Browsers can render jpg/png inline; .dcm cannot be previewed. */
    public static boolean isPreviewable(String contentType) {
        return "image/jpeg".equals(contentType) || "image/png".equals(contentType);
    }
}
