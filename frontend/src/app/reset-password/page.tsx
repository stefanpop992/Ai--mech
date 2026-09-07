'use client';
import { apiErrorMessage } from '@/lib/api-error';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Ogiltig återställningslänk.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte.');
      return;
    }

    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/auth/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(apiErrorMessage(data, 'Något gick fel.'));
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setError('Något gick fel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#080808',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Card */}
        <div style={{
          backgroundColor: '#111111',
          border: '1px solid #2a2a2a',
          padding: '48px',
          borderRadius: '4px',
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '28px',
              letterSpacing: '4px',
              color: '#f0f0f0',
            }}>MY</span>
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '28px',
              letterSpacing: '4px',
              color: '#e03030',
            }}>GARAGE</span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            color: '#f0f0f0',
            letterSpacing: '2px',
            textAlign: 'center',
            margin: '0 0 8px 0',
            fontSize: '24px',
          }}>Nytt lösenord</h1>

          {/* Subtext */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#888',
            fontSize: '14px',
            textAlign: 'center',
            margin: '0 0 32px 0',
          }}>
            Ange ditt nya lösenord nedan
          </p>

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>✅</div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                color: '#888',
                fontSize: '14px',
              }}>
                Lösenordet har uppdaterats! Du skickas till inloggningen...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Error */}
              {error && (
                <div style={{
                  backgroundColor: 'rgba(224,48,48,0.1)',
                  border: '1px solid #e03030',
                  color: '#e03030',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  padding: '10px 14px',
                }}>
                  {error}
                </div>
              )}

              {/* New password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  color: '#888',
                }}>Nytt lösenord</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    color: '#f0f0f0',
                    fontFamily: "'DM Sans', sans-serif",
                    padding: '12px 16px',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#e03030'}
                  onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>

              {/* Confirm password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  color: '#888',
                }}>Bekräfta lösenord</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    color: '#f0f0f0',
                    fontFamily: "'DM Sans', sans-serif",
                    padding: '12px 16px',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#e03030'}
                  onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !token}
                style={{
                  backgroundColor: '#e03030',
                  color: '#ffffff',
                  fontFamily: "'DM Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '3px',
                  fontSize: '13px',
                  padding: '16px 40px',
                  width: '100%',
                  border: 'none',
                  cursor: loading || !token ? 'not-allowed' : 'pointer',
                  opacity: loading || !token ? 0.6 : 1,
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                  transition: 'box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!loading && token) (e.target as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(224,48,48,0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                {loading ? 'Sparar...' : 'Spara nytt lösenord'}
              </button>

              {/* Back to login */}
              <div style={{ textAlign: 'center' }}>
                <Link
                  href="/login"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: '#888',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.target as HTMLAnchorElement).style.color = '#f0f0f0'}
                  onMouseLeave={(e) => (e.target as HTMLAnchorElement).style.color = '#888'}
                >
                  Tillbaka till inloggning
                </Link>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
