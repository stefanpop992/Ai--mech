'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
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
          }}>Glömt lösenord?</h1>

          {/* Subtext */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#888',
            fontSize: '14px',
            textAlign: 'center',
            margin: '0 0 32px 0',
          }}>
            Ange din e-post så skickar vi en återställningslänk
          </p>

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>📬</div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                color: '#888',
                fontSize: '14px',
                marginBottom: '24px',
              }}>
                Om e-posten finns i systemet har vi skickat en återställningslänk. Kolla din inkorg!
              </p>
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

              {/* Email field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  color: '#888',
                }}>E-post</label>
                <input
                  type="email"
                  placeholder="du@exempel.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                disabled={loading}
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
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                  transition: 'box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.target as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(224,48,48,0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                {loading ? 'Skickar...' : 'Skicka återställningslänk'}
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
