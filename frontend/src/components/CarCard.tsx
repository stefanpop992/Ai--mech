'use client';
import { useRouter } from 'next/navigation';
import { type Car } from '@/lib/api-client';
import CarBrandLogo from '@/components/CarBrandLogo';

interface CarCardProps {
  car: Car;
}

export default function CarCard({ car }: CarCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/dashboard/${car.id}`)}
      style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }}
      className="overflow-hidden cursor-pointer group transition-all duration-200 hover:border-[var(--red)] hover:shadow-[0_0_24px_var(--red-glow)]"
    >
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
