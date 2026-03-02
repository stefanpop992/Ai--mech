import './globals.css';

export const metadata = {
  title: 'Mitt AI-Garage',
  description: 'Din smarta AI-mekaniker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className="bg-gray-100 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}