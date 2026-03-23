'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Car } from '@/lib/api-client';
import CarBrandLogo from '@/components/CarBrandLogo';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

async function lookupCar(regnr: string): Promise<Car> {
    const res = await fetch(`${API_BASE_URL}/cars/lookup?regnr=${encodeURIComponent(regnr)}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ?? 'Kunde inte hitta fordonet');
    }
    return res.json();
}

interface CarLookupProps {
    onAddToGarage?: (car: Car) => void;
}

export default function CarLookup({ onAddToGarage }: CarLookupProps) {
    const router = useRouter();
    const [regnr, setRegnr] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<Car | null>(null);
    const [added, setAdded] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!regnr.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);
        setAdded(false);

        try {
            const car = await lookupCar(regnr.trim().toUpperCase());
            setResult(car);
        } catch (err: any) {
            setError(err?.message ?? 'Något gick fel');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        if (result && onAddToGarage) {
            onAddToGarage(result);
            setAdded(true);
        }
    };

    return (
        <div
            className="mb-6"
            style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
        >
            {/* Search bar */}
            <div className="p-5">
                <p
                    className="font-dm-mono text-xs uppercase tracking-widest mb-3"
                    style={{ color: 'var(--dim)' }}
                >
                    Sök fordon
                </p>
                <form onSubmit={handleSearch} className="flex gap-3">
                    <input
                        placeholder="Regnummer (t.ex. ABC123)"
                        value={regnr}
                        onChange={(e) => setRegnr(e.target.value.toUpperCase())}
                        className="flex-1 max-w-xs px-4 py-2.5 text-sm font-dm-mono tracking-widest"
                        style={{
                            background: 'var(--steel)',
                            border: '1px solid var(--border)',
                            color: 'var(--white)',
                            outline: 'none',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <button
                        type="submit"
                        disabled={loading || !regnr.trim()}
                        className="font-dm-mono text-xs uppercase tracking-widest px-5 py-2.5 disabled:opacity-50 transition-opacity"
                        style={{ background: 'var(--red)', color: 'var(--white)' }}
                    >
                        {loading ? 'Söker...' : 'Sök'}
                    </button>
                </form>

                {error && (
                    <div
                        className="font-dm-mono text-xs px-3 py-2 mt-3"
                        style={{
                            background: 'rgba(224,48,48,0.1)',
                            border: '1px solid var(--red)',
                            color: 'var(--red)',
                        }}
                    >
                        {error}
                    </div>
                )}
            </div>

            {/* Result card */}
            {result && (
                <div style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="p-5 flex flex-col sm:flex-row items-start gap-5">
                        {/* Logo + basic info */}
                        <div className="flex items-center gap-4 flex-1">
                            <CarBrandLogo make={result.make} size={56} />
                            <div>
                                <h3
                                    className="font-bebas text-xl tracking-wider leading-tight"
                                    style={{ color: 'var(--white)' }}
                                >
                                    {result.make} {result.model}
                                    {result.variant ? (
                                        <span style={{ color: 'var(--red)' }}> {result.variant}</span>
                                    ) : null}
                                </h3>
                                <p
                                    className="font-dm-mono text-xs tracking-wider mt-1"
                                    style={{ color: 'var(--dim)' }}
                                >
                                    {result.year ?? 'Okänt år'}
                                    {result.fuel ? ` · ${result.fuel}` : ''}
                                    {result.transmission ? ` · ${result.transmission}` : ''}
                                    {result.power_hp ? ` · ${result.power_hp} hk` : ''}
                                </p>
                                <span
                                    className="inline-block mt-2 font-dm-mono text-xs font-bold px-2.5 py-1 uppercase tracking-widest"
                                    style={{
                                        background: 'rgba(224,48,48,0.1)',
                                        border: '1px solid var(--red)',
                                        color: 'var(--red)',
                                    }}
                                >
                                    {result.regnr}
                                </span>
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="flex gap-3 flex-wrap">
                            {result.meter != null && (
                                <div
                                    className="px-3 py-2"
                                    style={{ background: 'var(--steel)', border: '1px solid var(--border)' }}
                                >
                                    <p className="font-dm-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--dim)' }}>
                                        Mätare
                                    </p>
                                    <p className="font-dm-mono text-sm font-bold" style={{ color: 'var(--white)' }}>
                                        {result.meter.toLocaleString('sv-SE')} km
                                    </p>
                                </div>
                            )}
                            {result.color && (
                                <div
                                    className="px-3 py-2"
                                    style={{ background: 'var(--steel)', border: '1px solid var(--border)' }}
                                >
                                    <p className="font-dm-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--dim)' }}>
                                        Färg
                                    </p>
                                    <p className="font-dm-mono text-sm font-bold" style={{ color: 'var(--white)' }}>
                                        {result.color}
                                    </p>
                                </div>
                            )}
                            {result.inspection_valid_until && (
                                <div
                                    className="px-3 py-2"
                                    style={{ background: 'var(--steel)', border: '1px solid var(--border)' }}
                                >
                                    <p className="font-dm-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--dim)' }}>
                                        Besiktning
                                    </p>
                                    <p className="font-dm-mono text-sm font-bold" style={{ color: 'var(--white)' }}>
                                        {result.inspection_valid_until}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div
                        className="px-5 py-3 flex items-center gap-3"
                        style={{ borderTop: '1px solid var(--border)', background: 'var(--steel)' }}
                    >
                        <button
                            onClick={() => router.push(`/dashboard/${result.id}`)}
                            className="font-dm-mono text-xs uppercase tracking-widest px-4 py-2 transition-colors"
                            style={{ background: 'var(--red)', color: 'var(--white)' }}
                        >
                            Visa detaljer & AI-chat
                        </button>
                        {onAddToGarage && !added && (
                            <button
                                onClick={handleAdd}
                                className="font-dm-mono text-xs uppercase tracking-widest px-4 py-2 transition-colors"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--border)',
                                    color: 'var(--white)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--red)';
                                    e.currentTarget.style.color = 'var(--red)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                    e.currentTarget.style.color = 'var(--white)';
                                }}
                            >
                                + Lägg till i garage
                            </button>
                        )}
                        {added && (
                            <span
                                className="font-dm-mono text-xs uppercase tracking-widest px-4 py-2"
                                style={{ color: '#34d399' }}
                            >
                                Tillagd i garaget
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}