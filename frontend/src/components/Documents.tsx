'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Car } from '@/lib/api-client';
import {
    type CarDocument,
    deleteDocument,
    getDocumentDownloadUrl,
    getDocumentPreviewUrl,
    listDocuments,
    uploadDocument,
} from '@/lib/documents-api';

const DOCUMENT_CATEGORIES = [
    { key: 'instruktionsbok', icon: '📖', label: 'Instruktionsbok' },
    { key: 'servicebok', icon: '🔧', label: 'Servicebok' },
    { key: 'reparationsmanual', icon: '🛠️', label: 'Reparationsmanual' },
    { key: 'forsakringsdokument', icon: '🛡️', label: 'Försäkringsdokument' },
    { key: 'besiktningsprotokoll', icon: '📋', label: 'Besiktningsprotokoll' },
    { key: 'kvitton', icon: '🧾', label: 'Kvitton / Fakturor' },
] as const;

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function getFileIcon(mimeType: string): string {
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    return '📎';
}

function isPreviewable(mimeType: string): boolean {
    return mimeType === 'application/pdf' || mimeType.startsWith('image/');
}

// ── Preview Modal ─────────────────────────────────────────────────────────────

interface PreviewModalProps {
    doc: CarDocument;
    carId: number;
    onClose: () => void;
}

function PreviewModal({ doc, carId, onClose }: PreviewModalProps) {
    const [pdfLoaded, setPdfLoaded] = useState(false);
    const previewUrl = getDocumentPreviewUrl(carId, doc.id);
    const downloadUrl = getDocumentDownloadUrl(carId, doc.id);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const isPdf = doc.mime_type === 'application/pdf';
    const isImage = doc.mime_type.startsWith('image/');

    return (
        // Overlay
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={onClose}
        >
            {/* Panel — stop propagation so clicks inside don't close */}
            <div
                className="flex flex-col w-full max-w-4xl max-h-[90vh]"
                style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-3 px-4 py-3 shrink-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                >
                    <span className="text-lg shrink-0">{getFileIcon(doc.mime_type)}</span>
                    <p
                        className="font-dm-sans text-sm font-medium flex-1 min-w-0 truncate"
                        style={{ color: 'var(--white)' }}
                    >
                        {doc.filename}
                    </p>
                    <a
                        href={downloadUrl}
                        className="font-dm-mono text-[10px] uppercase tracking-wider px-3 py-1.5 shrink-0 transition-colors"
                        style={{ border: '1px solid var(--border)', color: 'var(--white)' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--red)';
                            e.currentTarget.style.color = 'var(--red)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.color = 'var(--white)';
                        }}
                    >
                        ↓ Ladda ner
                    </a>
                    <button
                        onClick={onClose}
                        className="font-dm-mono text-sm px-2 py-1 shrink-0 transition-colors"
                        style={{ color: 'var(--dim)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--white)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--dim)'; }}
                        aria-label="Stäng"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 min-h-0">
                    {isPdf && (
                        <div className="relative w-full" style={{ height: 600 }}>
                            {!pdfLoaded && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={{ background: 'var(--carbon)' }}
                                >
                                    <p
                                        className="font-dm-mono text-xs uppercase tracking-widest"
                                        style={{ color: 'var(--dim)' }}
                                    >
                                        Laddar...
                                    </p>
                                </div>
                            )}
                            <iframe
                                src={previewUrl}
                                title={doc.filename}
                                className="w-full h-full"
                                style={{ border: 'none' }}
                                onLoad={() => setPdfLoaded(true)}
                            />
                        </div>
                    )}

                    {isImage && (
                        <div className="flex justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewUrl}
                                alt={doc.filename}
                                className="max-w-full"
                                style={{ maxHeight: 600, objectFit: 'contain' }}
                            />
                        </div>
                    )}

                    {!isPdf && !isImage && (
                        <div className="flex flex-col items-center gap-4 py-12">
                            <p
                                className="font-dm-mono text-xs uppercase tracking-widest text-center"
                                style={{ color: 'var(--dim)' }}
                            >
                                Förhandsgranskning ej tillgänglig för detta filformat
                            </p>
                            <a
                                href={downloadUrl}
                                className="font-dm-mono text-xs uppercase tracking-wider px-4 py-2 transition-colors"
                                style={{ background: 'var(--red)', color: 'var(--white)' }}
                            >
                                ↓ Ladda ner filen
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

interface DocumentsProps {
    car: Car;
}

export default function Documents({ car }: DocumentsProps) {
    const [allDocs, setAllDocs] = useState<CarDocument[]>([]);
    const [categoryDocs, setCategoryDocs] = useState<CarDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<CarDocument | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchAllDocs = useCallback(async () => {
        try {
            const data = await listDocuments(car.id);
            setAllDocs(data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [car.id]);

    useEffect(() => {
        fetchAllDocs();
    }, [fetchAllDocs]);

    const fetchCategoryDocs = useCallback(
        async (category: string) => {
            setCategoryLoading(true);
            try {
                const data = await listDocuments(car.id, category);
                setCategoryDocs(data);
            } catch {
                setError('Kunde inte hämta dokument');
            } finally {
                setCategoryLoading(false);
            }
        },
        [car.id],
    );

    const handleCategoryClick = (categoryKey: string) => {
        setActiveCategory(categoryKey);
        setError('');
        setDeleteConfirm(null);
        fetchCategoryDocs(categoryKey);
    };

    const handleBack = () => {
        setActiveCategory(null);
        setError('');
        setDeleteConfirm(null);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeCategory) return;

        setUploading(true);
        setError('');

        try {
            await uploadDocument(car.id, activeCategory, file);
            await Promise.all([fetchCategoryDocs(activeCategory), fetchAllDocs()]);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : undefined;
            setError(msg ?? 'Kunde inte ladda upp filen');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (docId: number) => {
        if (!activeCategory) return;
        try {
            await deleteDocument(car.id, docId);
            setCategoryDocs((prev) => prev.filter((d) => d.id !== docId));
            setAllDocs((prev) => prev.filter((d) => d.id !== docId));
            setDeleteConfirm(null);
        } catch {
            setError('Kunde inte ta bort dokumentet');
        }
    };

    const countByCategory = (key: string) => allDocs.filter((d) => d.category === key).length;

    const activeCat = DOCUMENT_CATEGORIES.find((c) => c.key === activeCategory);

    // ── CATEGORY DETAIL VIEW ──────────────────────────────────────────────────
    if (activeCategory && activeCat) {
        return (
            <>
                {previewDoc && (
                    <PreviewModal
                        doc={previewDoc}
                        carId={car.id}
                        onClose={() => setPreviewDoc(null)}
                    />
                )}

                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileChange}
                    />

                    {/* Header row */}
                    <div className="flex items-center gap-3 mb-5">
                        <button
                            onClick={handleBack}
                            className="font-dm-mono text-xs uppercase tracking-wider px-3 py-1.5 transition-colors"
                            style={{ border: '1px solid var(--border)', color: 'var(--dim)' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--red)';
                                e.currentTarget.style.color = 'var(--white)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.color = 'var(--dim)';
                            }}
                        >
                            ← Tillbaka
                        </button>
                        <span className="text-xl">{activeCat.icon}</span>
                        <h3
                            className="font-dm-sans text-base font-semibold"
                            style={{ color: 'var(--white)' }}
                        >
                            {activeCat.label}
                        </h3>
                    </div>

                    {error && (
                        <div
                            className="font-dm-mono text-xs px-3 py-2 mb-4"
                            style={{
                                background: 'rgba(224,48,48,0.1)',
                                border: '1px solid var(--red)',
                                color: 'var(--red)',
                            }}
                        >
                            {error}
                            <button onClick={() => setError('')} className="ml-3 underline">
                                Stäng
                            </button>
                        </div>
                    )}

                    {/* Upload button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="font-dm-mono text-xs uppercase tracking-wider px-4 py-2 mb-5 transition-opacity disabled:opacity-50"
                        style={{ background: 'var(--red)', color: 'var(--white)' }}
                    >
                        {uploading ? 'Laddar upp...' : '↑ Ladda upp dokument'}
                    </button>

                    {/* Document list */}
                    {categoryLoading ? (
                        <p
                            className="font-dm-mono text-xs uppercase tracking-widest text-center py-8"
                            style={{ color: 'var(--dim)' }}
                        >
                            Laddar dokument...
                        </p>
                    ) : categoryDocs.length === 0 ? (
                        <div
                            className="text-center py-12"
                            style={{ border: '1px solid var(--border)' }}
                        >
                            <p
                                className="font-dm-mono text-xs uppercase tracking-widest"
                                style={{ color: 'var(--dim)' }}
                            >
                                Inga dokument uppladdade ännu
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {categoryDocs.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center gap-3 p-3 cursor-pointer transition-all"
                                    style={{
                                        background: 'var(--carbon)',
                                        border: '1px solid var(--border)',
                                    }}
                                    onClick={() => setPreviewDoc(doc)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.filter = 'brightness(1.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.filter = '';
                                    }}
                                >
                                    <span className="text-lg shrink-0">
                                        {getFileIcon(doc.mime_type)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="font-dm-sans text-sm font-medium truncate"
                                            style={{ color: 'var(--white)' }}
                                        >
                                            {doc.filename}
                                        </p>
                                        <p
                                            className="font-dm-mono text-[10px] uppercase tracking-wider mt-0.5"
                                            style={{ color: 'var(--dim)' }}
                                        >
                                            {formatDate(doc.uploaded_at)} · {formatFileSize(doc.file_size)}
                                            {isPreviewable(doc.mime_type) && (
                                                <span style={{ color: 'var(--red)' }}> · Klicka för förhandsgranskning</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Action buttons — stop row click propagation */}
                                    <a
                                        href={getDocumentDownloadUrl(car.id, doc.id)}
                                        className="font-dm-mono text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors shrink-0"
                                        style={{ border: '1px solid var(--border)', color: 'var(--white)' }}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--red)';
                                            e.currentTarget.style.color = 'var(--red)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            e.currentTarget.style.color = 'var(--white)';
                                        }}
                                    >
                                        ↓ Ladda ner
                                    </a>

                                    {deleteConfirm === doc.id ? (
                                        <div
                                            className="flex gap-1 shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="font-dm-mono text-[10px] uppercase tracking-wider px-2 py-1.5"
                                                style={{ background: 'var(--red)', color: 'var(--white)' }}
                                            >
                                                Bekräfta
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="font-dm-mono text-[10px] uppercase tracking-wider px-2 py-1.5"
                                                style={{
                                                    border: '1px solid var(--border)',
                                                    color: 'var(--dim)',
                                                }}
                                            >
                                                Avbryt
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirm(doc.id);
                                            }}
                                            className="font-dm-mono text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors shrink-0"
                                            style={{ border: '1px solid var(--border)', color: 'var(--dim)' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--red)';
                                                e.currentTarget.style.color = 'var(--red)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border)';
                                                e.currentTarget.style.color = 'var(--dim)';
                                            }}
                                        >
                                            🗑 Ta bort
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </>
        );
    }

    // ── CATEGORY GRID VIEW ────────────────────────────────────────────────────
    return (
        <div>
            <p
                className="font-dm-mono text-xs uppercase tracking-widest mb-5"
                style={{ color: 'var(--dim)' }}
            >
                Välj en kategori för att hantera dokument.
            </p>

            {error && (
                <div
                    className="font-dm-mono text-xs px-3 py-2 mb-4"
                    style={{
                        background: 'rgba(224,48,48,0.1)',
                        border: '1px solid var(--red)',
                        color: 'var(--red)',
                    }}
                >
                    {error}
                    <button onClick={() => setError('')} className="ml-3 underline">
                        Stäng
                    </button>
                </div>
            )}

            {loading ? (
                <p
                    className="font-dm-mono text-xs uppercase tracking-widest text-center py-8"
                    style={{ color: 'var(--dim)' }}
                >
                    Laddar...
                </p>
            ) : (
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px"
                    style={{ background: 'var(--border)' }}
                >
                    {DOCUMENT_CATEGORIES.map((cat) => {
                        const count = countByCategory(cat.key);
                        return (
                            <button
                                key={cat.key}
                                onClick={() => handleCategoryClick(cat.key)}
                                style={{ background: 'var(--carbon)', color: 'var(--white)' }}
                                className="p-5 flex items-center gap-4 text-left transition-all hover:brightness-125"
                            >
                                <span className="text-2xl">{cat.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p
                                        className="font-dm-sans text-sm font-medium"
                                        style={{ color: 'var(--white)' }}
                                    >
                                        {cat.label}
                                    </p>
                                    <p
                                        className="font-dm-mono text-xs uppercase tracking-wider mt-0.5"
                                        style={{ color: 'var(--dim)' }}
                                    >
                                        {count > 0 ? `${count} dokument` : 'Inga dokument'}
                                    </p>
                                </div>
                                {count > 0 && (
                                    <span
                                        className="font-dm-mono text-xs font-bold px-2 py-0.5 shrink-0"
                                        style={{ background: 'var(--red)', color: 'var(--white)' }}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
