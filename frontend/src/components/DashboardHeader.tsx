'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DashboardHeader() {
  const { logout, user } = useAuth();

  return (
    <header
      style={{ background: 'var(--black)', borderBottom: '1px solid var(--border)' }}
      className="flex justify-between items-center px-6 py-4"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">🔧</span>
        <div>
          <h1 className="font-bebas text-xl tracking-widest leading-none" style={{ color: 'var(--white)' }}>
            MY<span style={{ color: 'var(--red)' }}>GARAGE</span>
          </h1>
          {user && (
            <p className="font-dm-mono text-xs tracking-wider mt-0.5" style={{ color: 'var(--dim)' }}>
              {user.email}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/settings">
          <button
            style={{ border: '1px solid var(--border)', color: 'var(--silver)', background: 'transparent' }}
            className="font-dm-mono text-xs uppercase tracking-widest px-4 py-2 transition-colors hover:border-[var(--red)] hover:text-[var(--white)]"
          >
            ⚙ Inställningar
          </button>
        </Link>
        <button
          onClick={logout}
          style={{ border: '1px solid var(--border)', color: 'var(--silver)', background: 'transparent' }}
          className="font-dm-mono text-xs uppercase tracking-widest px-4 py-2 transition-colors hover:border-[var(--red)] hover:text-[var(--white)]"
        >
          Logga ut
        </button>
      </div>
    </header>
  );
}
