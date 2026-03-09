'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
      await fetch('http://localhost:8000/api/v1/auth/forgot-password', {
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">Mitt AI-Garage</h1>
          <p className="text-gray-400 mt-1 text-sm">Återställ ditt lösenord</p>
        </div>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white">Glömt lösenord?</CardTitle>
            <CardDescription className="text-gray-400">
              Ange din e-post så skickar vi en återställningslänk
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="text-4xl">📬</div>
                <p className="text-gray-300 text-sm">
                  Om e-posten finns i systemet har vi skickat en återställningslänk. Kolla din inkorg!
                </p>
                <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm">
                  Tillbaka till inloggning
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">E-post</label>
                  <Input
                    type="email"
                    placeholder="du@exempel.se"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {loading ? 'Skickar...' : 'Skicka återställningslänk'}
                </Button>
                <p className="text-center text-sm text-gray-400">
                  <Link href="/login" className="text-blue-400 hover:text-blue-300">
                    Tillbaka till inloggning
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}