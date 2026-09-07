'use client';
import { apiErrorMessage } from '@/lib/api-error';
import { useState } from 'react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function RegisterPage() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(apiErrorMessage(data, 'Registreringen misslyckades'));
      }
    } catch {
      setError('Kunde inte nå servern. Är backend igång?');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--steel)',
    border: '1px solid var(--border)',
    color: 'var(--white)',
    outline: 'none',
  };

  return (
    <div style={{ background: 'var(--black)' }} className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-bebas text-4xl tracking-widest" style={{ color: 'var(--white)' }}>
            MY<span style={{ color: 'var(--red)' }}>GARAGE</span>
          </h1>
          <p className="font-dm-mono text-xs tracking-widest uppercase mt-2" style={{ color: 'var(--muted, #888)' }}>
            Skapa ett konto för att komma igång
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--carbon)', border: '1px solid var(--border)' }} className="p-8">

          {success ? (
            <div style={{ color: 'var(--white)' }} className="font-dm-mono text-xs leading-relaxed text-center space-y-4">
              <p>
                Ett bekräftelsemail har skickats till <span style={{ color: 'var(--red)' }}>{email}</span>.
              </p>
              <p style={{ color: 'var(--muted, #888)' }}>
                Kolla din inkorg för att aktivera ditt konto.
              </p>
              <Link href="/login" className="block mt-6 transition-colors" style={{ color: 'var(--red)' }}>
                Gå till inloggning
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ background: 'rgba(224,48,48,0.1)', border: '1px solid var(--red)', color: 'var(--red)' }}
                  className="text-sm px-3 py-2 mb-6 font-dm-mono text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="font-dm-mono text-xs uppercase tracking-widest block mb-2"
                    style={{ color: 'var(--muted, #888)' }}>
                    E-post
                  </label>
                  <input
                    type="email"
                    placeholder="du@exempel.se"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                    onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
                    className="w-full px-4 py-3 text-sm placeholder:text-[#444] transition-colors"
                  />
                </div>

                <div>
                  <label className="font-dm-mono text-xs uppercase tracking-widest block mb-2"
                    style={{ color: 'var(--muted, #888)' }}>
                    Lösenord
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                    onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
                    className="w-full px-4 py-3 text-sm placeholder:text-[#444] transition-colors"
                  />
                </div>

                <div>
                  <label className="font-dm-mono text-xs uppercase tracking-widest block mb-2"
                    style={{ color: 'var(--muted, #888)' }}>
                    Bekräfta lösenord
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                    onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
                    className="w-full px-4 py-3 text-sm placeholder:text-[#444] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: loading ? 'var(--dim)' : 'var(--red)', color: 'var(--white)' }}
                  className="w-full py-3 font-dm-mono text-xs uppercase tracking-widest transition-all mt-2 disabled:cursor-not-allowed"
                >
                  {loading ? 'Skapar konto...' : 'Registrera mig'}
                </button>
              </form>

              <p className="text-center font-dm-mono text-xs tracking-wider mt-8" style={{ color: 'var(--dim)' }}>
                Har du redan ett konto?{' '}
                <Link href="/login" className="transition-colors" style={{ color: 'var(--red)' }}>
                  Logga in här
                </Link>
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
