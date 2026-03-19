'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import ChatWindow from '@/components/ChatWindow';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useCars } from '@/hooks/use-cars';
import { type Car } from '@/lib/api-client';
import Documents from '@/components/Documents';

type Tab = 'info' | 'documents' | 'parts' | 'chat';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Teknisk info' },
  { id: 'documents', label: 'Dokument / Manualer' },
  { id: 'parts', label: 'Delar' },
  { id: 'chat', label: 'AI-Chat' },
];

// ── Teknisk info ──────────────────────────────────────────────────────────────

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

function TeknsikInfo({ car }: { car: Car }) {
  // Helper to check if inspection is still valid
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

  const sections = [
    {
      title: 'Grundinfo',
      rows: [
        { label: 'Märke', value: car.make },
        { label: 'Modell', value: car.model },
        { label: 'Variant', value: car.variant },
        { label: 'Årsmodell', value: car.year },
        { label: 'Registreringsnummer', value: car.regnr },
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
  ];

  return (
    <div className="space-y-4">
      {/* Inspection banner */}
      {inspection && (
        <div
          className="flex items-center gap-3 p-4"
          style={{
            background: 'var(--carbon)',
            border: `1px solid ${inspection.color}`,
          }}
        >
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: inspection.color }}
          />
          <span className="font-dm-mono text-xs uppercase tracking-widest" style={{ color: inspection.color }}>
            Besiktning: {inspection.text}
          </span>
          {car.inspection_valid_until && (
            <span className="font-dm-mono text-xs ml-auto" style={{ color: 'var(--dim)' }}>
              Giltig t.o.m. {car.inspection_valid_until}
            </span>
          )}
        </div>
      )}

      {sections.map((section) => {
        // Skip sections where all values are null
        const hasData = section.rows.some((row) => row.value != null && row.value !== '');
        if (!hasData) return null;

        return (
          <section
            key={section.title}
            style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
            className="p-5"
          >
            <h3
              className="font-dm-mono text-xs uppercase tracking-[4px] mb-3"
              style={{ color: 'var(--red)' }}
            >
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
  );
}


// ── Delar ─────────────────────────────────────────────────────────────────────

const PART_CATEGORIES = [
  { icon: '🔩', label: 'Filter', sub: 'Olje-, luft-, bränslefilter' },
  { icon: '🛞', label: 'Bromsar', sub: 'Skivor, belägg, bromsvätska' },
  { icon: '🏎️', label: 'Däck & Fälgar', sub: 'Sommar-, vinterdäck' },
  { icon: '⚙️', label: 'Kamrem / Kedja', sub: 'Byte & intervall' },
  { icon: '🔋', label: 'Batteri', sub: 'Kapacitet, ålder' },
  { icon: '💧', label: 'Torkare', sub: 'Fram & bak' },
  { icon: '💡', label: 'Belysning', sub: 'Glödlampor, LED' },
  { icon: '🛢️', label: 'Olja & Vätskor', sub: 'Motorolja, kylvätska' },
];

function Parts() {
  return (
    <div>
      <p className="font-dm-mono text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--dim)' }}>
        Håll koll på dina bildelar och byten.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px"
        style={{ background: 'var(--border)' }}>
        {PART_CATEGORIES.map((part) => (
          <button
            key={part.label}
            style={{ background: 'var(--carbon)' }}
            className="p-5 flex items-center gap-4 text-left group transition-all hover:brightness-125"
          >
            <span className="text-2xl">{part.icon}</span>
            <div>
              <p className="font-dm-sans text-sm font-medium" style={{ color: 'var(--white)' }}>
                {part.label}
              </p>
              <p className="font-dm-mono text-xs uppercase tracking-wider mt-0.5"
                style={{ color: 'var(--dim)' }}>
                {part.sub}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const carId = Number(params.carId);
  const { cars, isLoading } = useCars();
  const [activeTab, setActiveTab] = useState<Tab>('info');

  if (isLoading) {
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

  const car = cars.find((c) => c.id === carId);

  if (!car) {
    return (
      <ProtectedRoute>
        <div style={{ background: 'var(--black)' }}
          className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="font-bebas text-2xl tracking-widest" style={{ color: 'var(--white)' }}>
            Bilen hittades inte.
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

  return (
    <ProtectedRoute>
      <div style={{ background: 'var(--black)' }} className="min-h-screen flex flex-col">
        <DashboardHeader />

        <main className="flex-1 p-6 max-w-5xl mx-auto w-full">

          {/* Back link */}
          <button
            onClick={() => router.push('/dashboard')}
            className="font-dm-mono text-xs uppercase tracking-[2px] mb-6 transition-colors block"
            style={{ color: 'var(--muted, #888)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--white)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted, #888)')}
          >
            ← Tillbaka till garaget
          </button>

          {/* Car header card */}
          <div
            style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
            className="p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6"
          >
            {/* Image area */}
            <div
              style={{ background: 'var(--steel)' }}
              className="h-28 w-44 flex items-center justify-center shrink-0"
            >
              <span className="text-6xl select-none">🚗</span>
            </div>

            {/* Car info */}
            <div className="text-center sm:text-left">
              <h1 className="font-bebas leading-none" style={{ fontSize: '36px', color: 'var(--white)' }}>
                {car.make} {car.model}
                {car.engine ? (
                  <span style={{ color: 'var(--red)' }}> {car.engine}</span>
                ) : null}
              </h1>
              <p className="font-dm-mono text-xs uppercase tracking-widest mt-2"
                style={{ color: 'var(--muted, #888)' }}>
                {car.year ?? 'Okänt år'}
              </p>
              <span
                style={{
                  background: 'var(--steel)',
                  border: '1px solid var(--border)',
                  color: 'var(--white)',
                }}
                className="inline-block mt-3 font-dm-mono text-xs font-bold px-3 py-1 uppercase tracking-widest"
              >
                {car.regnr}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
            className="flex p-1 mb-6 overflow-x-auto gap-1"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? 'var(--red)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--white)' : 'var(--muted, #888)',
                }}
                className="flex-1 min-w-fit px-3 py-2 font-dm-mono text-xs uppercase tracking-[2px] whitespace-nowrap transition-colors"
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--white)';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--muted, #888)';
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === 'info' && <TeknsikInfo car={car} />}
          {activeTab === 'documents' && <Documents car={car} />}
          {activeTab === 'parts' && <Parts />}
          {activeTab === 'chat' && <ChatWindow car={car} />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
