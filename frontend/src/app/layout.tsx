import './globals.css';
import { AuthProvider } from '@/context/AuthContext'; // Importera din nya AuthProvider

export const metadata = {
  title: 'AI-Mech Garage',
  description: 'Hantera dina fordon med AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Allt inuti AuthProvider får tillgång till inloggnings-logiken */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}