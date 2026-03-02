import { getCars } from '../../lib/api-client';
import CarCard, { Car } from '../../components/CarCard';
import ChatWindow from '../../components/ChatWindow';
export default async function Dashboard() {
  const cars = await getCars();

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            Mitt AI-Garage 🛠️
          </h1>
          <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Inloggad som: Mekaniker
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
        
        {/* VÄNSTER SIDA: Garaget */}
        <div className="w-full lg:w-1/3">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            <span>🚘</span> Välj fordon
          </h2>
          <div className="flex flex-col gap-4">
            {cars.length === 0 ? (
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
                <p className="text-gray-500">Garaget är tomt.</p>
              </div>
            ) : (
              cars.map((car: Car) => (
                <CarCard key={car.id} car={car} />
              ))
            )}
          </div>
        </div>

        {/* HÖGER SIDA: Arbetsytan */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-gray-200 rounded-xl flex items-center justify-center h-64 lg:h-80 border-2 border-dashed border-gray-300 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 opacity-50"></div>
            <p className="text-gray-500 font-semibold text-lg z-10 flex flex-col items-center gap-2">
              <span className="text-3xl">🚗</span> 
              3D-scen laddas här framöver...
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 flex-1 min-h-[400px] flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <span className="text-blue-500">🤖</span> AI-Assistent
              </h3>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <p className="text-center max-w-sm">
                <ChatWindow />
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}