'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Car } from '@/lib/api-client';
import {
    type CarDocument,
    deleteDocument,
    getDocumentDownloadUrl,
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

interface DocumentsProps {
    car: Car;
}

export default function Documents({ car }: DocumentsProps) {
    const [docs, setDocs] = useState<CarDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const fetchDocs = useCallback(async () => {
        try {
            const data = await listDocuments(car.id);
            setDocs(data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [car.id]);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const countByCategory = (key: string) => docs.filter((d) => d.category === key).length;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeCategory) return;

        setUploading(activeCategory);
        setError('');

        try {
            await uploadDocument(car.id, activeCategory, file);
            await fetchDocs();
        } catch (err: any) {
            setError(err?.message ?? 'Kunde inte ladda upp filen');
        } finally {
            setUploading(null);
            setActiveCategory(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCategoryClick = (categoryKey: string) => {
        setActiveCategory(categoryKey);
        fileInputRef.current?.click();
    };

    const handleDelete = async (docId: number) => {
        try {
            await deleteDocument(car.id, docId);
            setDocs((prev) => prev.filter((d) => d.id !== docId));
            setDeleteConfirm(null);
        } catch {
            setError('Kunde inte ta bort dokumentet');
        }
    };

    return (
        <div>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                onChange={handleFileChange}
            />

            <p className="font-dm-mono text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--dim)' }}>
                Ladda upp och hantera dokument för ditt fordon.
            </p>

            {error && (
                <div
                    className="font-dm-mono text-xs px-3 py-2 mb-4"
                    style={{ background: 'rgba(224,48,48,0.1)', border: '1px solid var(--red)', color: 'var(--red)' }}
                >
                    {error}
                    <button onClick={() => setError('')} className="ml-3 underline">Stäng</button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
                {DOCUMENT_CATEGORIES.map((cat) => {
                    const count = countByCategory(cat.key);
                    const isUploading = uploading === cat.key;

                    return (
                        <button
                            key={cat.key}
                            onClick={() => handleCategoryClick(cat.key)}
                            disabled={isUploading}
                            style={{ background: 'var(--carbon)', color: 'var(--white)' }}
                            className="p-5 flex items-center gap-4 text-left group transition-all hover:brightness-125 disabled:opacity-50"
                        >
                            <span className="text-2xl">{cat.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-dm-sans text-sm font-medium" style={{ color: 'var(--white)' }}>
                                    {cat.label}
                                </p>
                                <p className="font-dm-mono text-xs uppercase tracking-wider mt-0.5" style={{ color: 'var(--dim)' }}>
                                    {isUploading ? 'Laddar upp...' : count > 0 ? `${count} dokument` : 'Lägg till dokument'}
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

            {loading ? (
                <p className="font-dm-mono text-xs uppercase tracking-widest text-center py-8" style={{ color: 'var(--dim)' }}>
                    Laddar dokument...
                </p>
            ) : docs.length > 0 ? (
                <div className="mt-6">
                    <h3 className="font-dm-mono text-xs uppercase tracking-[4px] mb-3" style={{ color: 'var(--red)' }}>
                        Uppladdade dokument
                    </h3>
                    <div className="space-y-1">
                        {docs.map((doc) => {
                            const cat = DOCUMENT_CATEGORIES.find((c) => c.key === doc.category);
                            return (
                                <div
                                    key={doc.id}
                                    className="flex items-center gap-3 p-3"
                                    style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
                                >
                                    <span className="text-lg shrink-0">{cat?.icon ?? '📄'}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-dm-sans text-sm font-medium truncate" style={{ color: 'var(--white)' }}>
                                            {doc.filename}
                                        </p>
                                        <p className="font-dm-mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--dim)' }}>
                                            {cat?.label ?? doc.category} · {formatFileSize(doc.file_size)} · {formatDate(doc.uploaded_at)}
                                        </p>
                                    </div>

                                    <a href={getDocumentDownloadUrl(car.id, doc.id)}
                                        className="font-dm-mono text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors shrink-0"
                                        style={{ border: '1px solid var(--border)', color: 'var(--white)' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--white)'; }}
                                    >
                                        Ladda ner
                                    </a>
                                    {deleteConfirm === doc.id ? (
                                        <div className="flex gap-1 shrink-0">
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
                                                style={{ border: '1px solid var(--border)', color: 'var(--dim)' }}
                                            >
                                                Avbryt
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirm(doc.id)}
                                            className="font-dm-mono text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors shrink-0"
                                            style={{ border: '1px solid var(--border)', color: 'var(--dim)' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--dim)'; }}
                                        >
                                            Ta bort
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
}