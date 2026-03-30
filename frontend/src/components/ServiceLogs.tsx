'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Car } from '@/lib/api-client';
import {
    type ServiceLog,
    type ServiceLogCreatePayload,
    type ServiceLogImage,
    type ServiceLogSummary,
    createServiceLog,
    deleteServiceImage,
    deleteServiceLog,
    getServiceImagePreviewUrl,
    getServiceLog,
    listServiceLogs,
    uploadServiceImage,
} from '@/lib/services-api';

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_CATEGORIES = [
    {
        slug: 'fluids_oil',
        name: 'Vätskor & olja',
        icon: '💧',
        items: [
            'Motoroljebyte',
            'Oljefilter',
            'Växellådsolja',
            'Bromsvätska',
            'Kylvätska',
            'Servostyrningsvätska',
            'Vindrutespolare',
        ],
    },
    {
        slug: 'filters',
        name: 'Filter',
        icon: '🔍',
        items: [
            'Luftfilter',
            'Kupéfilter / Pollenfilter',
            'Bränslefilter',
            'Partikelfilter (DPF) rensning',
        ],
    },
    {
        slug: 'brakes',
        name: 'Bromsar',
        icon: '🛑',
        items: [
            'Bromsbelägg fram',
            'Bromsbelägg bak',
            'Bromsskivor fram',
            'Bromsskivor bak',
            'Bromsok',
            'Handbromsvajer',
        ],
    },
    {
        slug: 'tires_wheels',
        name: 'Däck & hjul',
        icon: '🛞',
        items: [
            'Däckbyte sommar',
            'Däckbyte vinter',
            'Hjulinställning',
            'Hjulbalansering',
            'Nya däck',
            'Nya fälgar',
            'TPMS-sensor',
        ],
    },
    {
        slug: 'engine_drivetrain',
        name: 'Motor & drivlina',
        icon: '⚙️',
        items: [
            'Kamrem / kedja',
            'Tändstift',
            'Drivrem',
            'Koppling',
            'Turbo',
            'Avgassystem',
            'Batteri',
            'Generator / Laddare',
            'Startmotor',
        ],
    },
    {
        slug: 'suspension',
        name: 'Fjädring & styrning',
        icon: '🔩',
        items: [
            'Stötdämpare fram',
            'Stötdämpare bak',
            'Fjädrar',
            'Styrled / Spindelled',
            'Stabilisatorstag',
            'Bärarmar',
            'Krängningshämmare',
        ],
    },
    {
        slug: 'electrical',
        name: 'El & elektronik',
        icon: '⚡',
        items: [
            'Batteri',
            'Glödlampor / LED',
            'Säkringar',
            'Felsökning / Diagnosläsning',
            'Torkarblad',
            'AC-service',
            'Fönsterhiss',
        ],
    },
    {
        slug: 'other',
        name: 'Övrigt',
        icon: '🔧',
        items: [
            'Besiktning',
            'Rostskyddsbehandling',
            'Lackreparation',
            'Vindrutereparation / byte',
            'Inredning / Klädsel',
            'Annat (se anteckning)',
        ],
    },
] as const;

const CATEGORY_MAP = Object.fromEntries(
    SERVICE_CATEGORIES.map((c) => [c.slug, c]),
);

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatCost(cost: number | null): string {
    if (cost == null) return '';
    return `${Number(cost).toLocaleString('sv-SE')} kr`;
}

// ── Image Preview Modal ───────────────────────────────────────────────────────

function ImageModal({
    src,
    filename,
    onClose,
}: {
    src: string;
    filename: string;
    onClose: () => void;
}) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={onClose}
        >
            <div
                className="flex flex-col max-w-4xl max-h-[90vh] w-full"
                style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="flex items-center justify-between px-4 py-3 shrink-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                >
                    <p
                        className="font-dm-sans text-sm font-medium truncate"
                        style={{ color: 'var(--white)' }}
                    >
                        {filename}
                    </p>
                    <button
                        onClick={onClose}
                        className="font-dm-mono text-sm px-2 py-1 transition-colors"
                        style={{ color: 'var(--dim)' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--white)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--dim)';
                        }}
                    >
                        ✕
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-4 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={filename}
                        className="max-w-full"
                        style={{ maxHeight: '70vh', objectFit: 'contain' }}
                    />
                </div>
            </div>
        </div>
    );
}

// ── Create Form ───────────────────────────────────────────────────────────────

interface CreateFormProps {
    carId: number;
    onCreated: () => void;
    onCancel: () => void;
}

function CreateServiceForm({ carId, onCreated, onCancel }: CreateFormProps) {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [mileage, setMileage] = useState('');
    const [workshop, setWorkshop] = useState('');
    const [cost, setCost] = useState('');
    const [notes, setNotes] = useState('');
    const [checkedItems, setCheckedItems] = useState<Map<string, Set<string>>>(new Map());
    const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const toggleCategory = (slug: string) => {
        setExpandedCats((prev) => {
            const next = new Set(prev);
            if (next.has(slug)) next.delete(slug);
            else next.add(slug);
            return next;
        });
    };

    const toggleItem = (catSlug: string, item: string) => {
        setCheckedItems((prev) => {
            const next = new Map(prev);
            const items = new Set(next.get(catSlug) || []);
            if (items.has(item)) items.delete(item);
            else items.add(item);
            if (items.size === 0) next.delete(catSlug);
            else next.set(catSlug, items);
            return next;
        });
    };

    const totalChecked = Array.from(checkedItems.values()).reduce(
        (sum, s) => sum + s.size,
        0,
    );

    const handleSubmit = async () => {
        if (!date) {
            setError('Ange datum');
            return;
        }
        if (totalChecked === 0) {
            setError('Bocka i minst en åtgärd');
            return;
        }

        setSaving(true);
        setError('');

        const items: ServiceLogCreatePayload['items'] = [];
        checkedItems.forEach((labels, catSlug) => {
            labels.forEach((label) => {
                items.push({ category: catSlug, label, checked: true });
            });
        });

        try {
            await createServiceLog(carId, {
                service_date: date,
                mileage: mileage ? parseInt(mileage) : null,
                workshop: workshop || null,
                cost: cost ? parseFloat(cost) : null,
                notes: notes || null,
                items,
            });
            onCreated();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Något gick fel');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <button
                    onClick={onCancel}
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
                <h3
                    className="font-dm-sans text-base font-semibold"
                    style={{ color: 'var(--white)' }}
                >
                    Ny service
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
                </div>
            )}

            {/* Meta fields */}
            <div
                className="p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
                style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
            >
                <div>
                    <label
                        className="font-dm-mono text-[10px] uppercase tracking-widest block mb-1.5"
                        style={{ color: 'var(--dim)' }}
                    >
                        Datum *
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full font-dm-sans text-sm px-3 py-2 outline-none"
                        style={{
                            background: 'var(--steel)',
                            border: '1px solid var(--border)',
                            color: 'var(--white)',
                        }}
                    />
                </div>
                <div>
                    <label
                        className="font-dm-mono text-[10px] uppercase tracking-widest block mb-1.5"
                        style={{ color: 'var(--dim)' }}
                    >
                        Mätarställning (km)
                    </label>
                    <input
                        type="number"
                        placeholder="t.ex. 123 456"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        className="w-full font-dm-sans text-sm px-3 py-2 outline-none"
                        style={{
                            background: 'var(--steel)',
                            border: '1px solid var(--border)',
                            color: 'var(--white)',
                        }}
                    />
                </div>
                <div>
                    <label
                        className="font-dm-mono text-[10px] uppercase tracking-widest block mb-1.5"
                        style={{ color: 'var(--dim)' }}
                    >
                        Verkstad / Utfört av
                    </label>
                    <input
                        type="text"
                        placeholder="t.ex. Mekonomen Solna"
                        value={workshop}
                        onChange={(e) => setWorkshop(e.target.value)}
                        className="w-full font-dm-sans text-sm px-3 py-2 outline-none"
                        style={{
                            background: 'var(--steel)',
                            border: '1px solid var(--border)',
                            color: 'var(--white)',
                        }}
                    />
                </div>
                <div>
                    <label
                        className="font-dm-mono text-[10px] uppercase tracking-widest block mb-1.5"
                        style={{ color: 'var(--dim)' }}
                    >
                        Kostnad (kr)
                    </label>
                    <input
                        type="number"
                        placeholder="t.ex. 3500"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="w-full font-dm-sans text-sm px-3 py-2 outline-none"
                        style={{
                            background: 'var(--steel)',
                            border: '1px solid var(--border)',
                            color: 'var(--white)',
                        }}
                    />
                </div>
                <div className="sm:col-span-2">
                    <label
                        className="font-dm-mono text-[10px] uppercase tracking-widest block mb-1.5"
                        style={{ color: 'var(--dim)' }}
                    >
                        Anteckningar
                    </label>
                    <textarea
                        rows={3}
                        placeholder="Fritext, detaljer om vad som gjorts..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full font-dm-sans text-sm px-3 py-2 outline-none resize-y"
                        style={{
                            background: 'var(--steel)',
                            border: '1px solid var(--border)',
                            color: 'var(--white)',
                        }}
                    />
                </div>
            </div>

            {/* Checklist */}
            <div
                className="mb-4"
                style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
            >
                <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <h4
                        className="font-dm-mono text-xs uppercase tracking-[3px]"
                        style={{ color: 'var(--red)' }}
                    >
                        Vad gjordes? ({totalChecked} valda)
                    </h4>
                </div>

                {SERVICE_CATEGORIES.map((cat) => {
                    const isExpanded = expandedCats.has(cat.slug);
                    const catChecked = checkedItems.get(cat.slug)?.size || 0;
                    return (
                        <div key={cat.slug}>
                            <button
                                onClick={() => toggleCategory(cat.slug)}
                                className="w-full flex items-center gap-3 px-5 py-3 text-left transition-all hover:brightness-125"
                                style={{ borderBottom: '1px solid var(--border)' }}
                            >
                                <span className="text-lg">{cat.icon}</span>
                                <span
                                    className="font-dm-sans text-sm font-medium flex-1"
                                    style={{ color: 'var(--white)' }}
                                >
                                    {cat.name}
                                </span>
                                {catChecked > 0 && (
                                    <span
                                        className="font-dm-mono text-[10px] font-bold px-2 py-0.5"
                                        style={{ background: 'var(--red)', color: 'var(--white)' }}
                                    >
                                        {catChecked}
                                    </span>
                                )}
                                <span
                                    className="font-dm-mono text-xs transition-transform"
                                    style={{
                                        color: 'var(--dim)',
                                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    }}
                                >
                                    ›
                                </span>
                            </button>
                            {isExpanded && (
                                <div
                                    className="px-5 py-2"
                                    style={{ background: 'var(--steel)' }}
                                >
                                    {cat.items.map((item) => {
                                        const isChecked =
                                            checkedItems.get(cat.slug)?.has(item) || false;
                                        return (
                                            <label
                                                key={item}
                                                className="flex items-center gap-3 py-2 cursor-pointer group"
                                            >
                                                <div
                                                    className="w-5 h-5 shrink-0 flex items-center justify-center transition-colors"
                                                    style={{
                                                        border: `1px solid ${isChecked ? 'var(--red)' : 'var(--border)'}`,
                                                        background: isChecked ? 'var(--red)' : 'transparent',
                                                    }}
                                                >
                                                    {isChecked && (
                                                        <span
                                                            className="text-xs font-bold"
                                                            style={{ color: 'var(--white)' }}
                                                        >
                                                            ✓
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={isChecked}
                                                    onChange={() =>
                                                        toggleItem(cat.slug, item)
                                                    }
                                                />
                                                <span
                                                    className="font-dm-sans text-sm transition-colors"
                                                    style={{
                                                        color: isChecked
                                                            ? 'var(--white)'
                                                            : 'var(--silver)',
                                                    }}
                                                >
                                                    {item}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Submit */}
            <div className="flex gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="font-dm-mono text-xs uppercase tracking-wider px-6 py-2.5 transition-opacity disabled:opacity-50"
                    style={{ background: 'var(--red)', color: 'var(--white)' }}
                >
                    {saving ? 'Sparar...' : '✓ Spara service'}
                </button>
                <button
                    onClick={onCancel}
                    className="font-dm-mono text-xs uppercase tracking-wider px-4 py-2.5 transition-colors"
                    style={{ border: '1px solid var(--border)', color: 'var(--dim)' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--white)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--dim)';
                    }}
                >
                    Avbryt
                </button>
            </div>
        </div>
    );
}

// ── Detail View ───────────────────────────────────────────────────────────────

interface DetailProps {
    carId: number;
    serviceId: number;
    onBack: () => void;
    onDeleted: () => void;
}

function ServiceDetail({ carId, serviceId, onBack, onDeleted }: DetailProps) {
    const [service, setService] = useState<ServiceLog | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [previewImage, setPreviewImage] = useState<{
        src: string;
        name: string;
    } | null>(null);
    const [error, setError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const fetchService = useCallback(async () => {
        try {
            const data = await getServiceLog(carId, serviceId);
            setService(data);
        } catch {
            setError('Kunde inte hämta service');
        } finally {
            setLoading(false);
        }
    }, [carId, serviceId]);

    useEffect(() => {
        fetchService();
    }, [fetchService]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError('');
        try {
            await uploadServiceImage(carId, serviceId, file);
            await fetchService();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Uppladdning misslyckades');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleDeleteImage = async (imageId: number) => {
        try {
            await deleteServiceImage(carId, serviceId, imageId);
            await fetchService();
        } catch {
            setError('Kunde inte ta bort bild');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteServiceLog(carId, serviceId);
            onDeleted();
        } catch {
            setError('Kunde inte ta bort service');
        }
    };

    if (loading) {
        return (
            <p
                className="font-dm-mono text-xs uppercase tracking-widest text-center py-12"
                style={{ color: 'var(--dim)' }}
            >
                Laddar...
            </p>
        );
    }

    if (!service) {
        return (
            <p
                className="font-dm-mono text-xs uppercase tracking-widest text-center py-12"
                style={{ color: 'var(--dim)' }}
            >
                Servicen hittades inte
            </p>
        );
    }

    // Group items by category
    const grouped = new Map<string, string[]>();
    service.items.forEach((item) => {
        const arr = grouped.get(item.category) || [];
        arr.push(item.label);
        grouped.set(item.category, arr);
    });

    return (
        <>
            {previewImage && (
                <ImageModal
                    src={previewImage.src}
                    filename={previewImage.name}
                    onClose={() => setPreviewImage(null)}
                />
            )}

            <div>
                <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                />

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <button
                        onClick={onBack}
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
                    <h3
                        className="font-dm-sans text-base font-semibold"
                        style={{ color: 'var(--white)' }}
                    >
                        Service {formatDate(service.service_date)}
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
                    </div>
                )}

                {/* Meta info */}
                <div
                    className="p-5 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4"
                    style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
                >
                    <div>
                        <p
                            className="font-dm-mono text-[10px] uppercase tracking-widest mb-1"
                            style={{ color: 'var(--dim)' }}
                        >
                            Datum
                        </p>
                        <p className="font-dm-sans text-sm" style={{ color: 'var(--white)' }}>
                            {formatDate(service.service_date)}
                        </p>
                    </div>
                    <div>
                        <p
                            className="font-dm-mono text-[10px] uppercase tracking-widest mb-1"
                            style={{ color: 'var(--dim)' }}
                        >
                            Mätarställning
                        </p>
                        <p className="font-dm-sans text-sm" style={{ color: 'var(--white)' }}>
                            {service.mileage
                                ? `${service.mileage.toLocaleString('sv-SE')} km`
                                : '—'}
                        </p>
                    </div>
                    <div>
                        <p
                            className="font-dm-mono text-[10px] uppercase tracking-widest mb-1"
                            style={{ color: 'var(--dim)' }}
                        >
                            Verkstad
                        </p>
                        <p className="font-dm-sans text-sm" style={{ color: 'var(--white)' }}>
                            {service.workshop || '—'}
                        </p>
                    </div>
                    <div>
                        <p
                            className="font-dm-mono text-[10px] uppercase tracking-widest mb-1"
                            style={{ color: 'var(--dim)' }}
                        >
                            Kostnad
                        </p>
                        <p className="font-dm-sans text-sm" style={{ color: 'var(--white)' }}>
                            {formatCost(service.cost) || '—'}
                        </p>
                    </div>
                </div>

                {/* Notes */}
                {service.notes && (
                    <div
                        className="p-5 mb-4"
                        style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
                    >
                        <p
                            className="font-dm-mono text-[10px] uppercase tracking-widest mb-2"
                            style={{ color: 'var(--dim)' }}
                        >
                            Anteckningar
                        </p>
                        <p
                            className="font-dm-sans text-sm whitespace-pre-wrap"
                            style={{ color: 'var(--silver)' }}
                        >
                            {service.notes}
                        </p>
                    </div>
                )}

                {/* Items grouped by category */}
                <div
                    className="mb-4"
                    style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
                >
                    <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                        <h4
                            className="font-dm-mono text-xs uppercase tracking-[3px]"
                            style={{ color: 'var(--red)' }}
                        >
                            Utfört ({service.items.length} åtgärder)
                        </h4>
                    </div>
                    {Array.from(grouped.entries()).map(([catSlug, labels]) => {
                        const cat = CATEGORY_MAP[catSlug];
                        return (
                            <div key={catSlug} className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                                <p className="font-dm-sans text-sm font-medium mb-2" style={{ color: 'var(--white)' }}>
                                    {cat?.icon || '🔧'} {cat?.name || catSlug}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {labels.map((label) => (
                                        <span
                                            key={label}
                                            className="font-dm-mono text-[10px] uppercase tracking-wider px-2 py-1"
                                            style={{
                                                background: 'var(--steel)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--silver)',
                                            }}
                                        >
                                            ✓ {label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Images */}
                <div
                    className="mb-4"
                    style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
                >
                    <div
                        className="flex items-center justify-between px-5 py-3"
                        style={{ borderBottom: '1px solid var(--border)' }}
                    >
                        <h4
                            className="font-dm-mono text-xs uppercase tracking-[3px]"
                            style={{ color: 'var(--red)' }}
                        >
                            Bilder / bevis ({service.images.length})
                        </h4>
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="font-dm-mono text-[10px] uppercase tracking-wider px-3 py-1.5 transition-opacity disabled:opacity-50"
                            style={{ background: 'var(--red)', color: 'var(--white)' }}
                        >
                            {uploading ? 'Laddar upp...' : '↑ Lägg till bild'}
                        </button>
                    </div>

                    {service.images.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                            <p
                                className="font-dm-mono text-xs uppercase tracking-widest"
                                style={{ color: 'var(--dim)' }}
                            >
                                Inga bilder. Ladda upp kvitto, foto eller bevis.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px p-px">
                            {service.images.map((img) => {
                                const src = getServiceImagePreviewUrl(
                                    carId,
                                    serviceId,
                                    img.id,
                                );
                                return (
                                    <div key={img.id} className="relative group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={src}
                                            alt={img.filename}
                                            className="w-full aspect-square object-cover cursor-pointer"
                                            style={{ background: 'var(--steel)' }}
                                            onClick={() =>
                                                setPreviewImage({
                                                    src,
                                                    name: img.filename,
                                                })
                                            }
                                        />
                                        <button
                                            onClick={() => handleDeleteImage(img.id)}
                                            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{
                                                background: 'var(--red)',
                                                color: 'var(--white)',
                                            }}
                                            title="Ta bort"
                                        >
                                            ✕
                                        </button>
                                        <p
                                            className="absolute bottom-0 left-0 right-0 font-dm-mono text-[9px] px-1 py-0.5 truncate"
                                            style={{
                                                background: 'rgba(0,0,0,0.7)',
                                                color: 'var(--silver)',
                                            }}
                                        >
                                            {img.filename}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Delete service */}
                <div className="flex justify-end">
                    {deleteConfirm ? (
                        <div className="flex gap-2">
                            <button
                                onClick={handleDelete}
                                className="font-dm-mono text-[10px] uppercase tracking-wider px-4 py-2"
                                style={{ background: 'var(--red)', color: 'var(--white)' }}
                            >
                                Bekräfta radering
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(false)}
                                className="font-dm-mono text-[10px] uppercase tracking-wider px-3 py-2"
                                style={{ border: '1px solid var(--border)', color: 'var(--dim)' }}
                            >
                                Avbryt
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setDeleteConfirm(true)}
                            className="font-dm-mono text-[10px] uppercase tracking-wider px-3 py-2 transition-colors"
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
                            🗑 Ta bort service
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ServiceLogProps {
    car: Car;
}

type View = { kind: 'list' } | { kind: 'create' } | { kind: 'detail'; id: number };

export default function ServiceLogs({ car }: ServiceLogProps) {
    const [view, setView] = useState<View>({ kind: 'list' });
    const [services, setServices] = useState<ServiceLogSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchServices = useCallback(async () => {
        try {
            const data = await listServiceLogs(car.id);
            setServices(data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [car.id]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // ── Create view
    if (view.kind === 'create') {
        return (
            <CreateServiceForm
                carId={car.id}
                onCreated={() => {
                    fetchServices();
                    setView({ kind: 'list' });
                }}
                onCancel={() => setView({ kind: 'list' })}
            />
        );
    }

    // ── Detail view
    if (view.kind === 'detail') {
        return (
            <ServiceDetail
                carId={car.id}
                serviceId={view.id}
                onBack={() => setView({ kind: 'list' })}
                onDeleted={() => {
                    fetchServices();
                    setView({ kind: 'list' });
                }}
            />
        );
    }

    // ── List view
    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <p
                    className="font-dm-mono text-xs uppercase tracking-widest"
                    style={{ color: 'var(--dim)' }}
                >
                    {services.length} service{services.length !== 1 ? 'r' : ''} loggade
                </p>
                <button
                    onClick={() => setView({ kind: 'create' })}
                    className="font-dm-mono text-xs uppercase tracking-wider px-4 py-2 transition-opacity"
                    style={{ background: 'var(--red)', color: 'var(--white)' }}
                >
                    + Ny service
                </button>
            </div>

            {loading ? (
                <p
                    className="font-dm-mono text-xs uppercase tracking-widest text-center py-12"
                    style={{ color: 'var(--dim)' }}
                >
                    Laddar...
                </p>
            ) : services.length === 0 ? (
                <div
                    className="text-center py-16"
                    style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
                >
                    <p className="text-3xl mb-3">🔧</p>
                    <p
                        className="font-dm-sans text-sm font-medium mb-1"
                        style={{ color: 'var(--white)' }}
                    >
                        Ingen service loggad ännu
                    </p>
                    <p
                        className="font-dm-mono text-xs uppercase tracking-widest mb-5"
                        style={{ color: 'var(--dim)' }}
                    >
                        Börja logga underhåll för din bil
                    </p>
                    <button
                        onClick={() => setView({ kind: 'create' })}
                        className="font-dm-mono text-xs uppercase tracking-wider px-5 py-2"
                        style={{ background: 'var(--red)', color: 'var(--white)' }}
                    >
                        + Skapa första servicen
                    </button>
                </div>
            ) : (
                <div className="space-y-1">
                    {services.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setView({ kind: 'detail', id: s.id })}
                            className="w-full flex items-center gap-4 p-4 text-left transition-all hover:brightness-125"
                            style={{
                                background: 'var(--carbon)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            {/* Date block */}
                            <div
                                className="w-14 h-14 flex flex-col items-center justify-center shrink-0"
                                style={{ background: 'var(--steel)' }}
                            >
                                <span
                                    className="font-bebas text-lg leading-none"
                                    style={{ color: 'var(--white)' }}
                                >
                                    {new Date(s.service_date).getDate()}
                                </span>
                                <span
                                    className="font-dm-mono text-[9px] uppercase tracking-wider"
                                    style={{ color: 'var(--dim)' }}
                                >
                                    {new Date(s.service_date).toLocaleDateString('sv-SE', {
                                        month: 'short',
                                    })}
                                </span>
                                <span
                                    className="font-dm-mono text-[9px]"
                                    style={{ color: 'var(--dim)' }}
                                >
                                    {new Date(s.service_date).getFullYear()}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    {s.categories.map((catSlug) => {
                                        const cat = CATEGORY_MAP[catSlug];
                                        return (
                                            <span
                                                key={catSlug}
                                                className="font-dm-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5"
                                                style={{
                                                    background: 'var(--steel)',
                                                    border: '1px solid var(--border)',
                                                    color: 'var(--silver)',
                                                }}
                                            >
                                                {cat?.icon} {cat?.name || catSlug}
                                            </span>
                                        );
                                    })}
                                </div>
                                <p
                                    className="font-dm-mono text-[10px] uppercase tracking-wider"
                                    style={{ color: 'var(--dim)' }}
                                >
                                    {s.item_count} åtgärd{s.item_count !== 1 ? 'er' : ''}
                                    {s.workshop ? ` · ${s.workshop}` : ''}
                                    {s.mileage
                                        ? ` · ${s.mileage.toLocaleString('sv-SE')} km`
                                        : ''}
                                    {s.image_count > 0
                                        ? ` · ${s.image_count} bild${s.image_count !== 1 ? 'er' : ''}`
                                        : ''}
                                </p>
                            </div>

                            {/* Cost */}
                            {s.cost != null && (
                                <span
                                    className="font-dm-mono text-xs font-bold shrink-0"
                                    style={{ color: 'var(--white)' }}
                                >
                                    {formatCost(s.cost)}
                                </span>
                            )}

                            <span
                                className="font-dm-mono text-xs shrink-0"
                                style={{ color: 'var(--dim)' }}
                            >
                                ›
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}