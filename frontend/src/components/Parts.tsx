'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Car } from '@/lib/api-client';
import {
    type Part,
    type PartPayload,
    type PartStatus,
    createPart,
    deletePart,
    listParts,
    updatePart,
} from '@/lib/parts-api';

// ── Constants ─────────────────────────────────────────────────────────────────

const PART_CATEGORIES = [
    { slug: 'filters', name: 'Filter', icon: '🔩', sub: 'Olje-, luft-, bränslefilter' },
    { slug: 'brakes', name: 'Bromsar', icon: '🛞', sub: 'Skivor, belägg, bromsvätska' },
    { slug: 'tires_wheels', name: 'Däck & fälgar', icon: '🏎️', sub: 'Sommar-, vinterdäck' },
    { slug: 'timing', name: 'Kamrem / kedja', icon: '⚙️', sub: 'Byte & intervall' },
    { slug: 'battery', name: 'Batteri', icon: '🔋', sub: 'Kapacitet, ålder' },
    { slug: 'wipers', name: 'Torkare', icon: '💧', sub: 'Fram & bak' },
    { slug: 'lighting', name: 'Belysning', icon: '💡', sub: 'Glödlampor, LED' },
    { slug: 'fluids_oil', name: 'Olja & vätskor', icon: '🛢️', sub: 'Motorolja, kylvätska' },
    { slug: 'other', name: 'Övrigt', icon: '📦', sub: 'Alla andra delar' },
];

const CATEGORY_MAP = Object.fromEntries(PART_CATEGORIES.map((c) => [c.slug, c]));

const STATUSES: { slug: PartStatus; name: string; color: string }[] = [
    { slug: 'installed', name: 'Monterad', color: '#34d399' },
    { slug: 'spare', name: 'I lager', color: '#fbbf24' },
    { slug: 'ordered', name: 'Beställd', color: '#60a5fa' },
];

const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.slug, s]));

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCost(cost: number | null): string {
    if (cost == null) return '—';
    return `${Number(cost).toLocaleString('sv-SE')} kr`;
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('sv-SE');
}

// Shared input styling, matching the service log form
const inputStyle = {
    background: 'var(--steel)',
    border: '1px solid var(--border)',
    color: 'var(--white)',
} as const;

const inputClass = 'w-full font-dm-sans text-sm px-3 py-2 outline-none';
const labelClass =
    'font-dm-mono text-[10px] uppercase tracking-widest block mb-1.5';

// ── Form (create + edit) ──────────────────────────────────────────────────────

interface PartFormProps {
    carId: number;
    part?: Part;
    onSaved: () => void;
    onCancel: () => void;
}

function PartForm({ carId, part, onSaved, onCancel }: PartFormProps) {
    const isEdit = part != null;

    const [name, setName] = useState(part?.name ?? '');
    const [category, setCategory] = useState(part?.category ?? 'filters');
    const [brand, setBrand] = useState(part?.brand ?? '');
    const [partNumber, setPartNumber] = useState(part?.part_number ?? '');
    const [quantity, setQuantity] = useState(String(part?.quantity ?? 1));
    const [vendor, setVendor] = useState(part?.vendor ?? '');
    const [cost, setCost] = useState(part?.cost != null ? String(part.cost) : '');
    const [purchasedDate, setPurchasedDate] = useState(part?.purchased_date ?? '');
    const [installedDate, setInstalledDate] = useState(part?.installed_date ?? '');
    const [mileage, setMileage] = useState(
        part?.mileage != null ? String(part.mileage) : '',
    );
    const [status, setStatus] = useState<PartStatus>(part?.status ?? 'installed');
    const [notes, setNotes] = useState(part?.notes ?? '');

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Ange ett namn på delen');
            return;
        }

        setSaving(true);
        setError('');

        const payload: PartPayload = {
            name: name.trim(),
            category,
            brand: brand.trim() || null,
            part_number: partNumber.trim() || null,
            quantity: quantity ? parseInt(quantity, 10) : 1,
            vendor: vendor.trim() || null,
            cost: cost ? parseFloat(cost) : null,
            purchased_date: purchasedDate || null,
            installed_date: installedDate || null,
            mileage: mileage ? parseInt(mileage, 10) : null,
            status,
            notes: notes.trim() || null,
        };

        try {
            if (isEdit) {
                await updatePart(carId, part.id, payload);
            } else {
                await createPart(carId, payload);
            }
            onSaved();
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
                    {isEdit ? 'Redigera del' : 'Ny del'}
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

            {/* Category picker */}
            <div className="mb-4">
                <label className={labelClass} style={{ color: 'var(--dim)' }}>
                    Kategori *
                </label>
                <div
                    className="grid grid-cols-2 sm:grid-cols-3 gap-px"
                    style={{ background: 'var(--border)' }}
                >
                    {PART_CATEGORIES.map((cat) => {
                        const active = category === cat.slug;
                        return (
                            <button
                                key={cat.slug}
                                type="button"
                                onClick={() => setCategory(cat.slug)}
                                className="p-3 flex items-center gap-2.5 text-left transition-all"
                                style={{
                                    background: active ? 'var(--steel)' : 'var(--carbon)',
                                    borderLeft: active
                                        ? '2px solid var(--red)'
                                        : '2px solid transparent',
                                }}
                            >
                                <span className="text-lg">{cat.icon}</span>
                                <span
                                    className="font-dm-sans text-xs font-medium"
                                    style={{
                                        color: active ? 'var(--white)' : 'var(--silver)',
                                    }}
                                >
                                    {cat.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Fields */}
            <div
                className="p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
                style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
            >
                <div className="sm:col-span-2">
                    <label className={labelClass} style={{ color: 'var(--dim)' }}>
                        Namn *
                    </label>
                    <input
                        type="text"
                        placeholder="t.ex. Bromsbelägg fram"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label className={labelClass} style={{ color: 'var(--dim)' }}>
                        Märke
                    </label>
                    <input
                        type="text"
                        placeholder="t.ex. Bosch"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label className={labelClass} style={{ color: 'var(--dim)' }}>
                        Artikelnummer
                    </label>
                    <input
                        type="text"
                        placeholder="t.ex. 0 986 494 104"
                        value={partNumber}
                        onChange={(e) => setPartNumber(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label className={labelClass} style={{ color: 'var(--dim)' }}>
                        Antal
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label className={labelClass} style={{ color: 'var(--dim)' }}>
                        Pris (kr)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="t.ex. 1200"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                    />
                </div>

                <div className="sm:col-span-2">
                    <label className={labelClass} style={{ color: 'var(--dim)' }}>
                        Inköpsställe
                    </label>
                    <input
                        type="text"
                        placeholder="t.ex. Mekonomen, Biltema, Skruvat.se"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label className={labelClass} style={{ color: 'var(--dim)' }}>
                        Inköpsdatum
                    </label>
                    <input
                        type="date"
                        value={purchasedDate}
                        onChange={(e) => setPurchasedDate(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label className={labelClass} style={{ color: 'var(--dim)' }}>
                        Monteringsdatum
                    </label>
                    <input
                        type="date"
                        value={installedDate}
                        onChange={(e) => setInstalledDate(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label className={labelClass} style={{ color: 'var(--dim)' }}>
                        Mätarställning (km)
                    </label>
                    <input
                        type="number"
                        placeholder="t.ex. 123 456"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        className={inputClass}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label className={labelClass} style={{ color: 'var(--dim)' }}>
                        Status
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as PartStatus)}
                        className={inputClass}
                        style={inputStyle}
                    >
                        {STATUSES.map((s) => (
                            <option key={s.slug} value={s.slug}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="sm:col-span-2">
                    <label className={labelClass} style={{ color: 'var(--dim)' }}>
                        Anteckningar
                    </label>
                    <textarea
                        rows={3}
                        placeholder="t.ex. Byttes samtidigt som bromsskivorna"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className={`${inputClass} resize-none`}
                        style={inputStyle}
                    />
                </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="font-dm-mono text-xs uppercase tracking-wider px-6 py-2.5 transition-opacity disabled:opacity-50"
                    style={{ background: 'var(--red)', color: 'var(--white)' }}
                >
                    {saving ? 'Sparar...' : isEdit ? '✓ Spara ändringar' : '✓ Spara del'}
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

// ── Part row ──────────────────────────────────────────────────────────────────

function PartRow({
    part,
    onEdit,
    onDelete,
}: {
    part: Part;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [confirming, setConfirming] = useState(false);
    const cat = CATEGORY_MAP[part.category];
    const st = STATUS_MAP[part.status];

    return (
        <div
            className="flex items-center gap-4 p-4"
            style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
        >
            {/* Icon */}
            <div
                className="w-12 h-12 flex items-center justify-center shrink-0 text-xl"
                style={{ background: 'var(--steel)' }}
            >
                {cat?.icon ?? '📦'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p
                        className="font-dm-sans text-sm font-medium"
                        style={{ color: 'var(--white)' }}
                    >
                        {part.name}
                        {part.quantity > 1 && (
                            <span style={{ color: 'var(--dim)' }}> ×{part.quantity}</span>
                        )}
                    </p>
                    {st && (
                        <span
                            className="font-dm-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5"
                            style={{
                                background: 'var(--steel)',
                                border: `1px solid ${st.color}`,
                                color: st.color,
                            }}
                        >
                            {st.name}
                        </span>
                    )}
                </div>
                <p
                    className="font-dm-mono text-[10px] uppercase tracking-wider truncate"
                    style={{ color: 'var(--dim)' }}
                >
                    {cat?.name ?? part.category}
                    {part.brand ? ` · ${part.brand}` : ''}
                    {part.part_number ? ` · ${part.part_number}` : ''}
                    {part.vendor ? ` · ${part.vendor}` : ''}
                    {part.installed_date
                        ? ` · monterad ${formatDate(part.installed_date)}`
                        : part.purchased_date
                          ? ` · köpt ${formatDate(part.purchased_date)}`
                          : ''}
                    {part.mileage
                        ? ` · ${part.mileage.toLocaleString('sv-SE')} km`
                        : ''}
                </p>
                {part.notes && (
                    <p
                        className="font-dm-sans text-xs mt-1.5"
                        style={{ color: 'var(--silver)' }}
                    >
                        {part.notes}
                    </p>
                )}
            </div>

            {/* Cost */}
            {part.cost != null && (
                <span
                    className="font-dm-mono text-xs font-bold shrink-0"
                    style={{ color: 'var(--white)' }}
                >
                    {formatCost(part.cost)}
                </span>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
                {confirming ? (
                    <>
                        <button
                            onClick={onDelete}
                            className="font-dm-mono text-[10px] uppercase tracking-wider px-2 py-1"
                            style={{ background: 'var(--red)', color: 'var(--white)' }}
                        >
                            Ta bort
                        </button>
                        <button
                            onClick={() => setConfirming(false)}
                            className="font-dm-mono text-[10px] uppercase tracking-wider px-2 py-1"
                            style={{
                                border: '1px solid var(--border)',
                                color: 'var(--dim)',
                            }}
                        >
                            Avbryt
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={onEdit}
                            title="Redigera"
                            className="font-dm-mono text-xs px-2 py-1 transition-colors"
                            style={{
                                border: '1px solid var(--border)',
                                color: 'var(--dim)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--white)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--dim)';
                            }}
                        >
                            ✎
                        </button>
                        <button
                            onClick={() => setConfirming(true)}
                            title="Ta bort"
                            className="font-dm-mono text-xs px-2 py-1 transition-colors"
                            style={{
                                border: '1px solid var(--border)',
                                color: 'var(--dim)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--red)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--dim)';
                            }}
                        >
                            ✕
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface PartsProps {
    car: Car;
}

type View = { kind: 'list' } | { kind: 'create' } | { kind: 'edit'; part: Part };

export default function Parts({ car }: PartsProps) {
    const [view, setView] = useState<View>({ kind: 'list' });
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<string | null>(null);

    const fetchParts = useCallback(async () => {
        try {
            const data = await listParts(car.id);
            setParts(data);
            setError('');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Kunde inte hämta delar');
        } finally {
            setLoading(false);
        }
    }, [car.id]);

    useEffect(() => {
        fetchParts();
    }, [fetchParts]);

    const handleDelete = async (partId: number) => {
        try {
            await deletePart(car.id, partId);
            fetchParts();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Kunde inte ta bort delen');
        }
    };

    if (view.kind === 'create' || view.kind === 'edit') {
        return (
            <PartForm
                carId={car.id}
                part={view.kind === 'edit' ? view.part : undefined}
                onSaved={() => {
                    fetchParts();
                    setView({ kind: 'list' });
                }}
                onCancel={() => setView({ kind: 'list' })}
            />
        );
    }

    // Categories that actually have parts, for the filter row
    const usedCategories = PART_CATEGORIES.filter((c) =>
        parts.some((p) => p.category === c.slug),
    );

    const visible = filter ? parts.filter((p) => p.category === filter) : parts;
    const totalCost = parts.reduce((sum, p) => sum + (Number(p.cost) || 0), 0);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <p
                    className="font-dm-mono text-xs uppercase tracking-widest"
                    style={{ color: 'var(--dim)' }}
                >
                    {parts.length} del{parts.length !== 1 ? 'ar' : ''} registrerade
                    {totalCost > 0 && ` · ${totalCost.toLocaleString('sv-SE')} kr totalt`}
                </p>
                <button
                    onClick={() => setView({ kind: 'create' })}
                    className="font-dm-mono text-xs uppercase tracking-wider px-4 py-2 transition-opacity"
                    style={{ background: 'var(--red)', color: 'var(--white)' }}
                >
                    + Ny del
                </button>
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

            {/* Category filter */}
            {usedCategories.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap mb-4">
                    <button
                        onClick={() => setFilter(null)}
                        className="font-dm-mono text-[10px] uppercase tracking-wider px-2.5 py-1 transition-colors"
                        style={{
                            background: filter === null ? 'var(--steel)' : 'transparent',
                            border: '1px solid var(--border)',
                            color: filter === null ? 'var(--white)' : 'var(--dim)',
                        }}
                    >
                        Alla ({parts.length})
                    </button>
                    {usedCategories.map((cat) => {
                        const count = parts.filter((p) => p.category === cat.slug).length;
                        const active = filter === cat.slug;
                        return (
                            <button
                                key={cat.slug}
                                onClick={() => setFilter(active ? null : cat.slug)}
                                className="font-dm-mono text-[10px] uppercase tracking-wider px-2.5 py-1 transition-colors"
                                style={{
                                    background: active ? 'var(--steel)' : 'transparent',
                                    border: '1px solid var(--border)',
                                    color: active ? 'var(--white)' : 'var(--dim)',
                                }}
                            >
                                {cat.icon} {cat.name} ({count})
                            </button>
                        );
                    })}
                </div>
            )}

            {loading ? (
                <p
                    className="font-dm-mono text-xs uppercase tracking-widest text-center py-12"
                    style={{ color: 'var(--dim)' }}
                >
                    Laddar...
                </p>
            ) : parts.length === 0 ? (
                <div
                    className="text-center py-16"
                    style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
                >
                    <p className="text-3xl mb-3">🔩</p>
                    <p
                        className="font-dm-sans text-sm font-medium mb-1"
                        style={{ color: 'var(--white)' }}
                    >
                        Inga delar registrerade ännu
                    </p>
                    <p
                        className="font-dm-mono text-xs uppercase tracking-widest mb-5"
                        style={{ color: 'var(--dim)' }}
                    >
                        Håll koll på dina bildelar och byten
                    </p>
                    <button
                        onClick={() => setView({ kind: 'create' })}
                        className="font-dm-mono text-xs uppercase tracking-wider px-5 py-2"
                        style={{ background: 'var(--red)', color: 'var(--white)' }}
                    >
                        + Lägg till första delen
                    </button>
                </div>
            ) : (
                <div className="space-y-1">
                    {visible.map((p) => (
                        <PartRow
                            key={p.id}
                            part={p}
                            onEdit={() => setView({ kind: 'edit', part: p })}
                            onDelete={() => handleDelete(p.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
