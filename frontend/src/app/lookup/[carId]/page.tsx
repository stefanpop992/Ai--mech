'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import ChatWindow from '@/components/ChatWindow';
import CarBrandLogo from '@/components/CarBrandLogo';
import ProtectedRoute from '@/components/ProtectedRoute';
import { type Car } from '@/lib/api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div
            className="flex flex-col sm:flex-row sm:items-center py-3 gap-1 last:border-0"
            style={{ borderBottom: '1px solid var(--border)' }}
        >
            <span className="font-dm-sans text-sm w-48 shrink-0" style={{ color: 'var(--muted, #888)' }}>
                {label}
            </span>
            <span className="font-dm-sans text-sm font-medium" style={{ color: 'var(--white)' }}>
                {value != null && value !== '' ? String(value) : (
                    <span style={{ color: 'var(--dim)', fontStyle: 'italic' }}>Ej angett</span>
                )}
            </span>
        </div>
    );
}

export default function LookupCarPage() {
    const params = useParams();
    const router = useRouter();
    const carId = Number(params.carId);
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [added, setAdded] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');

    useEffect(() => {
        const fetchCar = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/cars/lookup?regnr=&car_id=${carId}`, {
                    credentials: 'include',
                });
                if (!res.ok) throw new Error();
                setCar(await res.json());
            } catch {
                // Fallback: try getting from cars table directly
                try {
                    const res = await fetch(`${API_BASE_URL}/cars/${carId}`, {
                        credentials: 'include',
                    });
                    if (!res.ok) throw new Error();
                    setCar(await res.json());
                } catch {
                    setError('Kunde inte hämta fordonet');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchCar();
    }, [carId]);

    const handleAddToGarage = async () => {
        if (!car) return;
        try {
            await fetch(`${API_BASE_URL}/cars/register`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ regnr: car.regnr }),
            });
            setAdded(true);
        } catch { }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div style={{ background: 'var(--black)' }} className="min-h-screen flex items-center justify-center">
                    <p className="font-dm-mono text-xs uppercase tracking-widest" style={{ color: 'var(--dim)' }}>
                        Laddar...
                    </p>
                </div>
            </ProtectedRoute>
        );
    }

    if (error || !car) {
        return (
            <ProtectedRoute>
                <div style={{ background: 'var(--black)' }} className="min-h-screen flex flex-col items-center justify-center gap-4">
                    <p className="font-bebas text-2xl tracking-widest" style={{ color: 'var(--white)' }}>
                        Fordonet hittades inte.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="font-dm-mono text-xs uppercase tracking-[2px] transition-colors"
                        style={{ color: 'var(--muted, #888)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--white)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted, #888)')}
                    >
                        ← Tillbaka till garaget
                    </button>
                </div>
            </ProtectedRoute>
        );
    }

    const inspectionStatus = () => {
        if (!car.inspection_valid_until) return null;
        const valid = new Date(car.inspection_valid_until);
        const now = new Date();
        const daysLeft = Math.ceil((valid.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return { text: 'Utgången', color: 'var(--red)' };
        if (daysLeft < 60) return { text: `${daysLeft} dagar kvar`, color: '#fbbf24' };
        return { text: 'Godkänd', color: '#34d399' };
    };

    const inspection = inspectionStatus();

    return (
        <ProtectedRoute>
            <div style={{ background: 'var(--black)' }} className="min-h-screen flex flex-col">
                <DashboardHeader />

                <main className="flex-1 p-6 max-w-5xl mx-auto w-full">

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="font-dm-mono text-xs uppercase tracking-[2px] mb-6 transition-colors block"
                        style={{ color: 'var(--muted, #888)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--white)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted, #888)')}
                    >
                        ← Tillbaka till garaget
                    </button>

                    {/* Car header */}
                    <div
                        style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="h-28 w-44 flex items-center justify-center shrink-0">
                                <CarBrandLogo make={car.make} size={80} />
                            </div>
                            <div className="text-center sm:text-left flex-1">
                                <h1 className="font-bebas leading-none" style={{ fontSize: '36px', color: 'var(--white)' }}>
                                    {car.make} {car.model}
                                    {car.variant ? (
                                        <span style={{ color: 'var(--red)' }}> {car.variant}</span>
                                    ) : null}
                                </h1>
                                <p className="font-dm-mono text-xs uppercase tracking-widest mt-2" style={{ color: 'var(--muted, #888)' }}>
                                    {car.year ?? 'Okänt år'}
                                    {car.fuel ? ` · ${car.fuel}` : ''}
                                    {car.transmission ? ` · ${car.transmission}` : ''}
                                    {car.power_hp ? ` · ${car.power_hp} hk` : ''}
                                </p>
                                <span
                                    className="inline-block mt-3 font-dm-mono text-xs font-bold px-3 py-1 uppercase tracking-widest"
                                    style={{ background: 'var(--steel)', border: '1px solid var(--border)', color: 'var(--white)' }}
                                >
                                    {car.regnr}
                                </span>
                            </div>

                            {/* Add to garage button */}
                            <div className="shrink-0">
                                {added ? (
                                    <span className="font-dm-mono text-xs uppercase tracking-widest" style={{ color: '#34d399' }}>
                                        Tillagd i garaget
                                    </span>
                                ) : (
                                    <button
                                        onClick={handleAddToGarage}
                                        className="font-dm-mono text-xs uppercase tracking-widest px-4 py-2 transition-colors"
                                        style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--white)' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--white)'; }}
                                    >
                                        + Lägg till i garage
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Inspection banner */}
                    {inspection && (
                        <div
                            className="flex items-center gap-3 p-4 mb-6"
                            style={{ background: 'var(--carbon)', border: `1px solid ${inspection.color}` }}
                        >
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: inspection.color }} />
                            <span className="font-dm-mono text-xs uppercase tracking-widest" style={{ color: inspection.color }}>
                                Besiktning: {inspection.text}
                            </span>
                            <span className="font-dm-mono text-xs ml-auto" style={{ color: 'var(--dim)' }}>
                                Giltig t.o.m. {car.inspection_valid_until}
                            </span>
                        </div>
                    )}

                    {/* Tabs */}
                    <div
                        style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
                        className="flex p-1 mb-6 gap-1"
                    >
                        {[
                            { id: 'info' as const, label: 'Teknisk info' },
                            { id: 'chat' as const, label: 'AI-Chat' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    background: activeTab === tab.id ? 'var(--red)' : 'transparent',
                                    color: activeTab === tab.id ? 'var(--white)' : 'var(--muted, #888)',
                                }}
                                className="flex-1 px-3 py-2 font-dm-mono text-xs uppercase tracking-[2px] transition-colors"
                                onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--white)'; }}
                                onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--muted, #888)'; }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Teknisk info */}
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            {[
                                {
                                    title: 'Grundinfo',
                                    rows: [
                                        { label: 'Märke', value: car.make },
                                        { label: 'Modell', value: car.model },
                                        { label: 'Variant', value: car.variant },
                                        { label: 'Årsmodell', value: car.year },
                                        { label: 'VIN', value: car.vin },
                                        { label: 'Färg', value: car.color },
                                        { label: 'Status', value: car.status === 'Itrafik' ? 'I trafik' : car.status },
                                    ],
                                },
                                {
                                    title: 'Motor & Drivlina',
                                    rows: [
                                        { label: 'Bränsle', value: car.fuel },
                                        { label: 'Effekt', value: car.power_hp ? `${car.power_hp} hk (${car.power_kw} kW)` : null },
                                        { label: 'Växellåda', value: car.transmission },
                                    ],
                                },
                                {
                                    title: 'Mått & Vikt',
                                    rows: [
                                        { label: 'Längd', value: car.length ? `${car.length} mm` : null },
                                        { label: 'Bredd', value: car.width ? `${car.width} mm` : null },
                                        { label: 'Tjänstevikt', value: car.kerb_weight ? `${car.kerb_weight} kg` : null },
                                    ],
                                },
                                {
                                    title: 'Besiktning & Mätare',
                                    rows: [
                                        { label: 'Mätarställning', value: car.meter ? `${car.meter.toLocaleString('sv-SE')} km` : null },
                                        { label: 'Senaste besiktning', value: car.inspection },
                                        { label: 'Giltig till', value: car.inspection_valid_until },
                                    ],
                                },
                                {
                                    title: 'Däck & Fälgar',
                                    rows: [
                                        { label: 'Däck fram', value: car.tyre_front },
                                        { label: 'Däck bak', value: car.tyre_rear },
                                    ],
                                },
                                {
                                    title: 'Ursprung',
                                    rows: [
                                        { label: 'Tillverkad', value: car.manufactured },
                                        { label: 'Tillverkningsland', value: car.manufactured_country },
                                        { label: 'Registrerad', value: car.registered },
                                    ],
                                },
                            ].map((section) => {
                                const hasData = section.rows.some((r) => r.value != null && r.value !== '');
                                if (!hasData) return null;
                                return (
                                    <section
                                        key={section.title}
                                        style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
                                        className="p-5"
                                    >
                                        <h3 className="font-dm-mono text-xs uppercase tracking-[4px] mb-3" style={{ color: 'var(--red)' }}>
                                            {section.title}
                                        </h3>
                                        <div>
                                            {section.rows.map((row) => (
                                                <InfoRow key={row.label} label={row.label} value={row.value} />
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}

                    {/* AI Chat */}
                    {activeTab === 'chat' && <ChatWindow car={car} />}
                </main>
            </div>
        </ProtectedRoute>
    );
}