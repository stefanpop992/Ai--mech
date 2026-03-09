'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
      const res = await fetch('http://localhost:8000/api/v1/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Något gick fel.');
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">Mitt AI-Garage</h1>
          <p className="text-gray-400 mt-1 text-sm">Sätt ett nytt lösenord</p>
        </div>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white">Nytt lösenord</CardTitle>
            <CardDescription className="text-gray-400">
              Ange ditt nya lösenord nedan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <div className="text-4xl">✅</div>
                <p className="text-gray-300 text-sm">
                  Lösenordet har uppdaterats! Du skickas till inloggningen...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Nytt lösenord</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Bekräfta lösenord</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {loading ? 'Sparar...' : 'Spara nytt lösenord'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}