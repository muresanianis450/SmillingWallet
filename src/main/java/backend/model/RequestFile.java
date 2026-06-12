package backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Metadata for a file a patient attached to a {@link DentalRequest}
 * (CT scan / X-ray). The bytes live in Cloudflare R2 under {@code objectKey};
 * this row never holds the blob itself.
 */
@Entity
@Table(name = "request_files")
@Getter
@Setter
@NoArgsConstructor
public class RequestFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "request_id", nullable = false)
    private UUID requestId;

    @Column(name = "uploader_id", nullable = false)
    private UUID uploaderId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "object_key", nullable = false, length = 512)
    private String objectKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public RequestFile(UUID requestId, UUID uploaderId, String fileName,
                       String contentType, long sizeBytes, String objectKey) {
        this.requestId = requestId;
        this.uploaderId = uploaderId;
        this.fileName = fileName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.objectKey = objectKey;
        this.createdAt = LocalDateTime.now();
    }
}
