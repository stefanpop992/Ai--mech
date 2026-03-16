'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    fetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setStatus(res.ok ? 'success' : 'error');
      })
      .catch(() => setStatus('error'));
  }, [searchParams]);

  return (
    <div style={{ background: 'var(--black)' }} className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <h1 className="font-bebas text-4xl tracking-widest" style={{ color: 'var(--white)' }}>
            MY<span style={{ color: 'var(--red)' }}>GARAGE</span>
          </h1>
        </div>

        <div style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }} className="p-8 text-center">
          {status === 'loading' && (
            <p className="font-dm-mono text-xs tracking-widest" style={{ color: 'var(--muted, #888)' }}>
              Verifierar...
            </p>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <p className="font-dm-mono text-xs tracking-wider" style={{ color: 'var(--white)' }}>
                Ditt konto är aktiverat! Du kan nu logga in.
              </p>
              <Link
                href="/login"
                className="block mt-4 font-dm-mono text-xs uppercase tracking-widest transition-colors"
                style={{ color: 'var(--red)' }}
              >
                Logga in
              </Link>
            </div>
          )}

          {status === 'error' && (
            <p className="font-dm-mono text-xs tracking-wider" style={{ color: 'var(--red)' }}>
              Ogiltig eller utgången länk.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Laddar...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
