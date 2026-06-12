package backend.service;

import backend.config.R2Properties;
import backend.dto.RequestFileResponseDTO;
import backend.exception.ResourceNotFoundException;
import backend.exception.UnprocessableEntityException;
import backend.model.RequestFile;
import backend.repository.RequestFileRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

/**
 * Stores request attachments (CT scans / X-rays) in Cloudflare R2 and tracks
 * their metadata in Postgres. Validates by extension + magic bytes — never
 * trusts the browser-reported content type. No DICOM parsing: we just move bytes.
 */
@Service
public class FileStorageService {

    /** Hard cap per file (mirrors the multipart limit). */
    private static final long MAX_FILE_BYTES = 200L * 1024 * 1024;
    /** Keep request galleries sane. */
    private static final int MAX_FILES_PER_REQUEST = 10;
    /** Bytes needed to sniff the file type (DICOM "DICM" sits at offset 128). */
    private static final int HEADER_BYTES = 132;

    private final S3Client s3;
    private final S3Presigner presigner;
    private final R2Properties props;
    private final RequestFileRepository fileRepo;

    public FileStorageService(S3Client s3, S3Presigner presigner,
                              R2Properties props, RequestFileRepository fileRepo) {
        this.s3 = s3;
        this.presigner = presigner;
        this.props = props;
        this.fileRepo = fileRepo;
    }

    // ── Upload ────────────────────────────────────────────────────────────────

    public RequestFileResponseDTO upload(UUID requestId, UUID uploaderId, MultipartFile file) {
        requireConfigured();
        if (file == null || file.isEmpty()) {
            throw new UnprocessableEntityException("No file provided");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new UnprocessableEntityException("File exceeds the 200MB limit");
        }
        if (fileRepo.countByRequestId(requestId) >= MAX_FILES_PER_REQUEST) {
            throw new UnprocessableEntityException("This request already has the maximum of "
                    + MAX_FILES_PER_REQUEST + " attachments");
        }

        String originalName = sanitizeName(file.getOriginalFilename());
        String objectKey = "requests/" + requestId + "/" + UUID.randomUUID() + "_" + originalName;
        long size = file.getSize();

        // Stream the body straight to R2 rather than buffering the whole file in
        // memory. We only sniff the first HEADER_BYTES for validation, then reset
        // the buffered stream so putObject re-reads from the start.
        try (InputStream raw = file.getInputStream()) {
            BufferedInputStream in = new BufferedInputStream(raw);
            in.mark(HEADER_BYTES + 1);
            byte[] header = in.readNBytes(HEADER_BYTES);
            String contentType = resolveAndValidateType(originalName, header);
            in.reset();

            s3.putObject(
                    PutObjectRequest.builder()
                            .bucket(props.getBucket())
                            .key(objectKey)
                            .contentType(contentType)
                            .contentLength(size)
                            .build(),
                    RequestBody.fromInputStream(in, size));

            RequestFile saved = fileRepo.save(new RequestFile(
                    requestId, uploaderId, originalName, contentType, size, objectKey));

            return RequestFileResponseDTO.from(saved, presignDownload(saved));
        } catch (IOException e) {
            throw new UnprocessableEntityException("Could not read the uploaded file");
        }
    }

    // ── List ────────────────────────────────────────────────────────────────

    public List<RequestFileResponseDTO> listForRequest(UUID requestId) {
        List<RequestFile> files = fileRepo.findByRequestIdOrderByCreatedAtAsc(requestId);
        if (files.isEmpty()) {
            return List.of();   // no R2 round-trip / presign needed
        }
        requireConfigured();
        return files.stream()
                .map(f -> RequestFileResponseDTO.from(f, presignDownload(f)))
                .toList();
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public RequestFile getOwnedOrThrow(UUID fileId) {
        return fileRepo.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File " + fileId + " not found"));
    }

    public void delete(RequestFile file) {
        s3.deleteObject(DeleteObjectRequest.builder()
                .bucket(props.getBucket())
                .key(file.getObjectKey())
                .build());
        fileRepo.delete(file);
    }

    /**
     * Purges every attachment for a request from R2. Call this BEFORE deleting the
     * request row (the FK cascade would otherwise drop the metadata and orphan the
     * blobs in the bucket). No-op when the request has no files.
     */
    public void deleteAllForRequest(UUID requestId) {
        List<RequestFile> files = fileRepo.findByRequestIdOrderByCreatedAtAsc(requestId);
        if (files.isEmpty()) {
            return;
        }
        requireConfigured();
        files.forEach(f -> s3.deleteObject(DeleteObjectRequest.builder()
                .bucket(props.getBucket())
                .key(f.getObjectKey())
                .build()));
        fileRepo.deleteAll(files);
    }

    // ── Presigning ──────────────────────────────────────────────────────────

    /**
     * Short-lived link the browser hits directly. Previewable images get an
     * inline disposition (so {@code <img>} works); everything else (e.g. .dcm)
     * is forced to download so it lands on the dentist's disk for a DICOM viewer.
     */
    private String presignDownload(RequestFile file) {
        boolean previewable = RequestFileResponseDTO.isPreviewable(file.getContentType());
        String disposition = (previewable ? "inline" : "attachment")
                + "; filename=\"" + file.getFileName() + "\"";

        GetObjectRequest get = GetObjectRequest.builder()
                .bucket(props.getBucket())
                .key(file.getObjectKey())
                .responseContentType(file.getContentType())
                .responseContentDisposition(disposition)
                .build();

        GetObjectPresignRequest presign = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(props.getPresignExpiryMinutes()))
                .getObjectRequest(get)
                .build();

        return presigner.presignGetObject(presign).url().toString();
    }

    private void requireConfigured() {
        if (!props.isConfigured()) {
            throw new UnprocessableEntityException(
                    "File storage is not configured on the server (missing R2 credentials)");
        }
    }

    // ── Validation helpers ────────────────────────────────────────────────────

    /**
     * Returns the canonical content type, or throws 422 if the file isn't an
     * allowed type. Checks magic bytes for images; for .dcm we accept by the
     * DICOM "DICM" preamble OR the extension (many .dcm files omit the preamble).
     */
    private String resolveAndValidateType(String fileName, byte[] bytes) {
        String ext = extensionOf(fileName);

        if (isJpeg(bytes)) return "image/jpeg";
        if (isPng(bytes))  return "image/png";
        if (isDicom(bytes) || "dcm".equals(ext)) return "application/dicom";

        throw new UnprocessableEntityException(
                "Unsupported file type. Allowed: JPG, PNG, DICOM (.dcm)");
    }

    private static boolean isJpeg(byte[] b) {
        return b.length >= 3
                && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
    }

    private static boolean isPng(byte[] b) {
        return b.length >= 8
                && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && (b[4] & 0xFF) == 0x0D && (b[5] & 0xFF) == 0x0A
                && (b[6] & 0xFF) == 0x1A && (b[7] & 0xFF) == 0x0A;
    }

    /** DICOM files carry the magic word "DICM" at byte offset 128. */
    private static boolean isDicom(byte[] b) {
        return b.length >= 132
                && b[128] == 'D' && b[129] == 'I' && b[130] == 'C' && b[131] == 'M';
    }

    private static String extensionOf(String name) {
        int dot = name.lastIndexOf('.');
        return dot >= 0 ? name.substring(dot + 1).toLowerCase() : "";
    }

    /** Strip path components and anything risky from the original filename. */
    private static String sanitizeName(String name) {
        if (name == null || name.isBlank()) return "upload";
        String base = name.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1);
        base = base.replaceAll("[^a-zA-Z0-9._-]", "_");
        return base.isBlank() ? "upload" : base;
    }
}
