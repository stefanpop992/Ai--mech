'use client';
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type Car } from '@/lib/api-client';

interface CarCardProps {
  car: Car;
  isSelected: boolean;
  onSelect: (car: Car) => void;
  onDelete: (carId: number) => Promise<void>;
}

export default function CarCard({ car, isSelected, onSelect, onDelete }: CarCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(car.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <Card
      className={`bg-gray-800 border transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 shadow-lg shadow-blue-500/20'
          : 'border-gray-700 hover:border-gray-500'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-white">
              {car.make ?? '—'} {car.model ?? ''}
            </h2>
            <p className="text-sm text-gray-400">{car.year ?? 'Okänt år'}</p>
          </div>
          <span className="bg-blue-900/50 text-blue-300 text-xs font-bold px-2.5 py-1 rounded border border-blue-700 uppercase tracking-wider">
            {car.regnr}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="text-lg">🚗</span>
          <span>{car.engine ?? 'Motor ej angiven'}</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <Button
          onClick={() => onSelect(car)}
          className={`w-full font-semibold transition-all ${
            isSelected
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
          }`}
        >
          {isSelected ? '🛠️ Chattar med mekanikern' : '🛠️ Fråga mekanikern'}
        </Button>

        {!confirming ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(true)}
            className="w-full text-gray-500 hover:text-red-400 hover:bg-red-900/20 text-xs"
          >
            Ta bort fordon
          </Button>
        ) : (
          <div className="w-full flex items-center gap-2">
            <span className="text-xs text-gray-400 flex-1">Är du säker?</span>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-500 text-white text-xs px-3"
            >
              {deleting ? '...' : 'Ja, ta bort'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirming(false)}
              className="text-gray-400 hover:text-white text-xs px-3"
            >
              Avbryt
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
