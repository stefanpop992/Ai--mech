'use client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function DashboardHeader() {
  const { logout, user } = useAuth();

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔧</span>
        <div>
          <h1 className="text-lg font-bold text-white leading-none">Mitt AI-Garage</h1>
          {user && (
            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
          )}
        </div>
      </div>

      <Button
        onClick={logout}
        variant="outline"
        size="sm"
        className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-500"
      >
        Logga ut
      </Button>
    </header>
  );
}
