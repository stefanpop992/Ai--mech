'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Inloggningen misslyckades. Kontrollera e-post och lösenord.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">Mitt AI-Garage</h1>
          <p className="text-gray-400 mt-1 text-sm">Logga in för att komma åt ditt garage</p>
        </div>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white">Logga in</CardTitle>
            <CardDescription className="text-gray-400">Ange dina uppgifter nedan</CardDescription>
          </CardHeader>
          <CardContent>
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
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Lösenord</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                {loading ? 'Loggar in...' : 'Logga in'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              Inget konto?{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Skapa ett här
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
