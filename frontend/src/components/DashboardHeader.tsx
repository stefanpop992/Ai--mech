'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function DashboardHeader() {
  const { logout, user } = useAuth();

  const initials = user?.email ? user.email[0].toUpperCase() : '?';

  return (
    <header
      style={{ background: 'var(--black)', borderBottom: '1px solid var(--border)' }}
      className="flex justify-between items-center px-6 py-4"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">🔧</span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bebas text-xl tracking-widest leading-none" style={{ color: 'var(--white)' }}>
              MY<span style={{ color: 'var(--red)' }}>GARAGE</span>
            </h1>
            {user?.plan === 'premium' && (
              <span
                className="font-dm-mono text-[9px] font-bold px-1.5 py-0.5 tracking-widest"
                style={{ background: 'var(--red)', color: 'var(--white)' }}
              >
                PRO
              </span>
            )}
          </div>
          {user && (
            <p className="font-dm-mono text-xs tracking-wider mt-0.5" style={{ color: 'var(--dim)' }}>
              {user.email}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Profile avatar */}
        {user && (
          <Link href="/settings" aria-label="Inställningar">
            <div
              className="w-8 h-8 flex items-center justify-center overflow-hidden transition-opacity hover:opacity-80"
              style={{
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: user.profile_picture ? 'transparent' : 'var(--steel)',
                flexShrink: 0,
              }}
            >
              {user.profile_picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${API_BASE_URL}/users/me/profile-picture`}
                  alt="Profilbild"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-dm-mono text-xs font-bold" style={{ color: 'var(--white)' }}>
                  {initials}
                </span>
              )}
            </div>
          </Link>
        )}

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
