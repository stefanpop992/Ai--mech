'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import ChatWindow from '@/components/ChatWindow';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useCars } from '@/hooks/use-cars';
import { type Car } from '@/lib/api-client';

type Tab = 'info' | 'documents' | 'parts' | 'chat';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info',      label: 'Teknisk info' },
  { id: 'documents', label: 'Dokument / Manualer' },
  { id: 'parts',     label: 'Delar' },
  { id: 'chat',      label: 'AI-Chat' },
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
  return (
    <div className="space-y-4">
      {[
        {
          title: 'Grundinfo',
          rows: [
            { label: 'Märke',               value: car.make   },
            { label: 'Modell',              value: car.model  },
            { label: 'Årsmodell',           value: car.year   },
            { label: 'Motor',               value: car.engine },
            { label: 'Registreringsnummer', value: car.regnr  },
          ],
        },
        {
          title: 'Fordonsdata',
          rows: [
            { label: 'VIN-nummer',          value: null },
            { label: 'Bränsletyp',          value: null },
            { label: 'Växellåda',           value: null },
            { label: 'Färg',                value: null },
            { label: 'Mätarställning (mil)', value: null },
          ],
        },
        {
          title: 'Diagnostik',
          rows: [
            { label: 'OBD-felkoder',  value: null },
            { label: 'Senaste service', value: null },
            { label: 'Nästa service',   value: null },
          ],
        },
      ].map((section) => (
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
      ))}
    </div>
  );
}

// ── Dokument / Manualer ───────────────────────────────────────────────────────

const DOCUMENT_TYPES = [
  { icon: '📖', label: 'Instruktionsbok' },
  { icon: '🔧', label: 'Servicebok' },
  { icon: '🛠️', label: 'Reparationsmanual' },
  { icon: '🛡️', label: 'Försäkringsdokument' },
  { icon: '📋', label: 'Besiktningsprotokoll' },
  { icon: '🧾', label: 'Kvitton / Fakturor' },
];

function Documents() {
  return (
    <div>
      <p className="font-dm-mono text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--dim)' }}>
        Ladda upp och hantera dokument för ditt fordon.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px"
        style={{ background: 'var(--border)' }}>
        {DOCUMENT_TYPES.map((doc) => (
          <button
            key={doc.label}
            style={{ background: 'var(--carbon)', color: 'var(--white)' }}
            className="p-5 flex items-center gap-4 text-left group transition-all hover:brightness-125"
          >
            <span className="text-2xl">{doc.icon}</span>
            <div>
              <p className="font-dm-sans text-sm font-medium" style={{ color: 'var(--white)' }}>
                {doc.label}
              </p>
              <p className="font-dm-mono text-xs uppercase tracking-wider mt-0.5 transition-colors"
                style={{ color: 'var(--dim)' }}>
                Lägg till dokument
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Delar ─────────────────────────────────────────────────────────────────────

const PART_CATEGORIES = [
  { icon: '🔩', label: 'Filter',         sub: 'Olje-, luft-, bränslefilter' },
  { icon: '🛞', label: 'Bromsar',        sub: 'Skivor, belägg, bromsvätska' },
  { icon: '🏎️', label: 'Däck & Fälgar', sub: 'Sommar-, vinterdäck' },
  { icon: '⚙️', label: 'Kamrem / Kedja', sub: 'Byte & intervall' },
  { icon: '🔋', label: 'Batteri',        sub: 'Kapacitet, ålder' },
  { icon: '💧', label: 'Torkare',        sub: 'Fram & bak' },
  { icon: '💡', label: 'Belysning',      sub: 'Glödlampor, LED' },
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
                  color:      activeTab === tab.id ? 'var(--white)' : 'var(--muted, #888)',
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
          {activeTab === 'info'      && <TeknsikInfo car={car} />}
          {activeTab === 'documents' && <Documents />}
          {activeTab === 'parts'     && <Parts />}
          {activeTab === 'chat'      && <ChatWindow car={car} />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
