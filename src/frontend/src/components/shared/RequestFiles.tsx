import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { RequestFile } from '../../types/types';
import { Icon } from './Icon';

interface RequestFilesProps {
    requestId: string;
    /** Optional heading; omit to render just the tiles. */
    title?: string;
    /** Compact mode: small thumbnails / icon-sized download buttons (fits table cells). */
    compact?: boolean;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Lists the attachments on a request. Previewable images render inline as a
 * thumbnail (the presigned URL opens full size in a new tab); non-previewable
 * files (e.g. .dcm) render as a download tile. Used on the dentist side so a
 * clinic can inspect the patient's CT scan / X-ray before sending an offer.
 */
export function RequestFiles({ requestId, title = 'Patient attachments', compact = false }: RequestFilesProps) {
    const [files, setFiles] = useState<RequestFile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        if (!requestId) { setLoading(false); return; }
        api.get(`/requests/${requestId}/files`)
            .then((res) => { if (active) setFiles(res.data || []); })
            .catch(() => { if (active) setFiles([]); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [requestId]);

    if (loading) {
        return <span style={{ fontSize: '0.8rem', color: '#9898b8' }}>{compact ? '…' : 'Loading attachments…'}</span>;
    }
    if (files.length === 0) {
        return <span style={{ fontSize: '0.8rem', color: '#9898b8' }}>{compact ? '—' : 'No attachments uploaded.'}</span>;
    }

    const thumb = compact ? 56 : 96;

    return (
        <div style={{ margin: compact ? 0 : '8px 0 16px' }}>
            {title && !compact && (
                <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: '8px' }}>
                    {title}
                </label>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? '6px' : '10px' }}>
                {files.map((f) =>
                    f.previewable ? (
                        <a
                            key={f.id}
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${f.fileName} — open full size`}
                            style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e3e0ff' }}
                        >
                            <img
                                src={f.url}
                                alt={f.fileName}
                                style={{ width: `${thumb}px`, height: `${thumb}px`, objectFit: 'cover', display: 'block' }}
                            />
                        </a>
                    ) : compact ? (
                        <a
                            key={f.id}
                            href={f.url}
                            download={f.fileName}
                            title={`Download ${f.fileName} (${formatSize(f.sizeBytes)})`}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '6px 9px', borderRadius: '7px', border: '1px solid #c7c4f7',
                                background: '#f0f0ff', color: '#4a3fbf', textDecoration: 'none',
                                fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                            }}
                        >
                            <Icon name="folder" size={14} />
                            {f.contentType === 'application/dicom' ? 'DICOM' : 'File'}
                        </a>
                    ) : (
                        <a
                            key={f.id}
                            href={f.url}
                            download={f.fileName}
                            title={`Download ${f.fileName}`}
                            style={{
                                display: 'flex', flexDirection: 'column', gap: '4px', width: '160px',
                                padding: '12px', borderRadius: '8px', border: '1px solid #c7c4f7',
                                background: '#f0f0ff', color: '#4a3fbf', textDecoration: 'none',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                <Icon name="folder" size={18} /> {f.contentType === 'application/dicom' ? 'DICOM scan' : 'File'}
                            </span>
                            <span style={{
                                fontSize: '0.78rem', color: '#6b7280', whiteSpace: 'nowrap',
                                overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {f.fileName}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#9898b8' }}>
                                {formatSize(f.sizeBytes)} · Download
                            </span>
                        </a>
                    ),
                )}
            </div>
        </div>
    );
}
