"use client";

// Här berättar vi för TypeScript exakt vad en "bil" innehåller
export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  regnr: string;
  engine: string;
}

export default function CarCard({ car }: { car: Car }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      {/* Rubrik och Regnummer */}
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {car.make} {car.model}
        </h2>
        <span className="bg-blue-50 text-blue-700 text-sm font-bold px-3 py-1 rounded-md border border-blue-200 uppercase tracking-wider">
          {car.regnr}
        </span>
      </div>
      
      <div className="text-gray-600 space-y-2 mb-6">
        <p className="flex justify-between border-b border-gray-100 pb-1">
          <span className="font-medium text-gray-500">Årsmodell:</span> 
          <span className="font-semibold">{car.year}</span>
        </p>
        <p className="flex justify-between border-b border-gray-100 pb-1">
          <span className="font-medium text-gray-500">Motor:</span> 
          <span className="font-semibold">{car.engine || 'Ej angiven'}</span>
        </p>
      </div>

      <button 
        onClick={() => alert(`Startar AI-chatten för ${car.make} (Funktion kommer snart!)`)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
      >
        <span>🛠️</span> Fråga mekanikern
      </button>
    </div>
  );
}