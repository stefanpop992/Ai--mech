'use client';
import { useRouter } from 'next/navigation';
import { type Car } from '@/lib/api-client';
import CarBrandLogo from '@/components/CarBrandLogo';

interface CarCardProps {
  car: Car;
  onDelete?: (car: Car) => void;
}

export default function CarCard({ car, onDelete }: CarCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/dashboard/${car.id}`)}
      style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
      className="relative overflow-hidden cursor-pointer group transition-all duration-200 hover:border-[var(--red)] hover:shadow-[0_0_24px_var(--red-glow)]"
    >
      {/* Delete button — visible on hover */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(car);
          }}
          className="absolute top-2 right-2 z-10 p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:!bg-[var(--red)]"
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid transparent' }}
          title="Ta bort"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--white)' }}
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      )}

      {/* Car image */}
      <div
        style={{ background: 'var(--steel)' }}
        className="h-36 flex items-center justify-center group-hover:brightness-110 transition-all"
      >
        <CarBrandLogo make={car.make} size={72} />
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bebas text-xl tracking-wider leading-tight" style={{ color: 'var(--white)' }}>
          {car.make ?? '—'} {car.model ?? ''}
        </h3>
        <p className="font-dm-mono text-xs tracking-wider mt-0.5" style={{ color: 'var(--dim)' }}>
          {car.year ?? 'Okänt år'}
        </p>
        <span
          style={{ background: 'rgba(224,48,48,0.1)', border: '1px solid var(--red)', color: 'var(--red)' }}
          className="inline-block mt-3 font-dm-mono text-xs font-bold px-2.5 py-1 uppercase tracking-widest"
        >
          {car.regnr}
        </span>
      </div>
    </div>
  );
}
