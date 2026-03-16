'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('De nya lösenorden matchar inte.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/auth/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Något gick fel.');
        return;
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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
          <h1 className="text-3xl font-extrabold text-white">Inställningar</h1>
          <p className="text-gray-400 mt-1 text-sm">Hantera ditt konto</p>
        </div>

        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white">Byt lösenord</CardTitle>
            <CardDescription className="text-gray-400">
              Ange ditt nuvarande och nya lösenord
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <div className="bg-green-900/40 border border-green-700 text-green-300 text-sm px-3 py-2 rounded-md mb-4">
                ✅ Lösenordet har ändrats!
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Nuvarande lösenord</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Nytt lösenord</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Bekräfta nytt lösenord</label>
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
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                {loading ? 'Sparar...' : 'Byt lösenord'}
              </Button>
              <p className="text-center text-sm text-gray-400">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Tillbaka
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}